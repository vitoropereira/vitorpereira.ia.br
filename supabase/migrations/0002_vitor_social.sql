-- Painel de redes sociais (YouTube / Instagram) do /admin.
--
-- Tabelas prefixadas `vitor_` no Supabase PESSOAL do Vitor (projeto
-- qzczyicspbizosjogmlq), que é COMPARTILHADO com outras apps dele. Esta migration
-- é ADITIVA: não toca em nenhuma tabela existente (nem nas vitor_syndication_*).
--
-- Métrica: número que a API não devolveu fica `null`, NUNCA zero. Zero é dado
-- ("ninguém salvou"); null é ausência ("a API não informou"). Misturar os dois
-- distorce média e meta.
--
-- Segurança (disciplina do Vitor: "a fronteira é o servidor", "validar que resiste"):
--   * RLS habilitado nas cinco + REVOKE de anon/authenticated → a chave
--     publishable não enxerga nada daqui.
--   * Dois papéis de login próprios, sem senha aqui (o Vitor roda
--     `alter role ... password` ao aplicar):
--       - social_collector: SELECT/INSERT/UPDATE nas cinco. SEM DELETE.
--       - social_reader:    SELECT nas cinco.
--   * Acesso por GRANT + policy por papel, não BYPASSRLS: BYPASSRLS vale pro banco
--     inteiro (inclusive vitor_syndication_* e tabelas das outras apps, se um
--     grant escapar); com policy, a RLS também prende o papel às cinco tabelas.
--     O DELETE do collector segue barrado pelo GRANT mesmo com policy `for all`.
--
-- Aplicada via SQL Editor / Management API (não via Supabase CLI). Idempotente:
-- rodar de novo não quebra nem duplica.

-- 1 linha por post publicado.
create table if not exists public.vitor_social_posts (
  id uuid primary key default gen_random_uuid(),
  rede text not null check (rede in ('youtube', 'instagram')),
  -- YouTube: id de 11 caracteres; Instagram: media id.
  external_id text not null,
  url text,
  published_at timestamptz,
  titulo text,
  tipo text check (tipo in ('longo', 'short', 'reel', 'carrossel', 'imagem')),
  -- Nome do arquivo da peça editorial sem `.md`; null = post sem peça.
  peca_slug text,
  pauta text,
  formato text,
  hook text,
  template text,
  testa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rede, external_id)
);
create index if not exists vitor_social_posts_rede_published_idx
  on public.vitor_social_posts (rede, published_at desc);
create index if not exists vitor_social_posts_peca_idx
  on public.vitor_social_posts (peca_slug);

-- Série diária por post. `dia` é a data de Brasília, não UTC.
create table if not exists public.vitor_social_post_metrics (
  post_id uuid not null references public.vitor_social_posts (id) on delete cascade,
  dia date not null,
  captured_at timestamptz not null default now(),
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  reach bigint,
  impressions bigint,
  subs_gained bigint,
  ctr numeric,
  avg_view_pct numeric,
  watch_time_min numeric,
  extra jsonb not null default '{}',
  primary key (post_id, dia)
);
create index if not exists vitor_social_post_metrics_dia_idx
  on public.vitor_social_post_metrics (dia);

-- Série diária da conta.
create table if not exists public.vitor_social_account_daily (
  rede text check (rede in ('youtube', 'instagram')),
  dia date,
  seguidores bigint,
  views_dia bigint,
  alcance_dia bigint,
  extra jsonb not null default '{}',
  primary key (rede, dia)
);

-- Meta de publicação por semana, versionada por data de vigência.
create table if not exists public.vitor_social_goals (
  rede text check (rede in ('youtube', 'instagram')),
  tipo text check (tipo in ('longo', 'short', 'reel', 'carrossel', 'imagem', 'estatico')),
  por_semana numeric not null,
  vigente_desde date,
  primary key (rede, tipo, vigente_desde)
);

-- Log de execução dos coletores, pra saber quando um job parou de rodar.
create table if not exists public.vitor_social_collect_runs (
  id uuid primary key default gen_random_uuid(),
  rede text check (rede in ('youtube', 'instagram')),
  job text check (job in ('collect', 'backfill', 'sync_pecas', 'refresh_token')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  erro text,
  linhas int
);

-- RLS ligado nas cinco. Sem policy pra anon/authenticated → deny-all pra eles.
alter table public.vitor_social_posts enable row level security;
alter table public.vitor_social_post_metrics enable row level security;
alter table public.vitor_social_account_daily enable row level security;
alter table public.vitor_social_goals enable row level security;
alter table public.vitor_social_collect_runs enable row level security;

-- O Supabase dá grant default a anon/authenticated em tabela nova: revoga explícito.
revoke all on public.vitor_social_posts from anon, authenticated;
revoke all on public.vitor_social_post_metrics from anon, authenticated;
revoke all on public.vitor_social_account_daily from anon, authenticated;
revoke all on public.vitor_social_goals from anon, authenticated;
revoke all on public.vitor_social_collect_runs from anon, authenticated;

-- Papéis. `create role` não tem `if not exists`, daí o bloco. NOINHERIT pra que
-- nenhum grant futuro de papel herdado amplie o acesso sem querer. Senha fica
-- fora do repo.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'social_collector') then
    create role social_collector login noinherit;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'social_reader') then
    create role social_reader login noinherit;
  end if;
end
$$;

grant usage on schema public to social_collector, social_reader;

-- Collector: escreve e lê (o upsert precisa de SELECT), mas nunca apaga.
grant select, insert, update on
  public.vitor_social_posts,
  public.vitor_social_post_metrics,
  public.vitor_social_account_daily,
  public.vitor_social_goals,
  public.vitor_social_collect_runs
to social_collector;

-- Reader: só leitura, pro painel.
grant select on
  public.vitor_social_posts,
  public.vitor_social_post_metrics,
  public.vitor_social_account_daily,
  public.vitor_social_goals,
  public.vitor_social_collect_runs
to social_reader;

-- Policies por papel. `create policy` também não tem `if not exists`. O collector
-- leva `for all` porque o upsert passa por SELECT, INSERT e UPDATE; o DELETE
-- continua negado pelo GRANT acima.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_posts' and policyname = 'vitor_social_posts_collector') then
    create policy vitor_social_posts_collector on public.vitor_social_posts
      for all to social_collector using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_posts' and policyname = 'vitor_social_posts_reader') then
    create policy vitor_social_posts_reader on public.vitor_social_posts
      for select to social_reader using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_post_metrics' and policyname = 'vitor_social_post_metrics_collector') then
    create policy vitor_social_post_metrics_collector on public.vitor_social_post_metrics
      for all to social_collector using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_post_metrics' and policyname = 'vitor_social_post_metrics_reader') then
    create policy vitor_social_post_metrics_reader on public.vitor_social_post_metrics
      for select to social_reader using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_account_daily' and policyname = 'vitor_social_account_daily_collector') then
    create policy vitor_social_account_daily_collector on public.vitor_social_account_daily
      for all to social_collector using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_account_daily' and policyname = 'vitor_social_account_daily_reader') then
    create policy vitor_social_account_daily_reader on public.vitor_social_account_daily
      for select to social_reader using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_goals' and policyname = 'vitor_social_goals_collector') then
    create policy vitor_social_goals_collector on public.vitor_social_goals
      for all to social_collector using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_goals' and policyname = 'vitor_social_goals_reader') then
    create policy vitor_social_goals_reader on public.vitor_social_goals
      for select to social_reader using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_collect_runs' and policyname = 'vitor_social_collect_runs_collector') then
    create policy vitor_social_collect_runs_collector on public.vitor_social_collect_runs
      for all to social_collector using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'vitor_social_collect_runs' and policyname = 'vitor_social_collect_runs_reader') then
    create policy vitor_social_collect_runs_reader on public.vitor_social_collect_runs
      for select to social_reader using (true);
  end if;
end
$$;
