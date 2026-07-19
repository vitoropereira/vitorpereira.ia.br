-- Fase 2 — Syndication analytics (POSSE / TabNews).
--
-- Tabelas prefixadas `vitor_` no Supabase PESSOAL do Vitor (projeto
-- qzczyicspbizosjogmlq), que é COMPARTILHADO com outras apps dele. Esta migration
-- é ADITIVA e não toca em nenhuma tabela existente.
--
-- Segurança (disciplina do Vitor: "a fronteira é o servidor", "validar que resiste"):
--   * RLS habilitado em todas + NENHUMA policy → deny-all para anon/authenticated.
--   * REVOKE dos grants default do PostgREST → nem aparecem para a chave publishable.
--   * Escrita de syndications/metrics: CLI local via management token (bypassa RLS).
--   * Escrita de clicks: rota server-side via service_role (bypassa RLS). Nunca anon.
--   * Leitura (stats): CLI via management token. Sem leitura pública (sem dashboard).
--
-- Aplicada via Management API (não via Supabase CLI). Mantida no repo p/ reprodutibilidade.

-- 1 linha por cross-post publicado.
create table if not exists public.vitor_syndications (
  id uuid primary key default gen_random_uuid(),
  post_permalink text not null,
  canonical_url text not null,
  target text not null default 'tabnews',
  external_url text,
  external_slug text,
  format text not null check (format in ('summary', 'teaser', 'full')),
  status text not null default 'published',
  title text not null,
  summary_char_count int,
  pillar text,
  tags text[] not null default '{}',
  note text,
  source_commit text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (post_permalink, target)
);

-- Snapshots de vaidade (tabcoins/comentários) puxados da API do TabNews.
create table if not exists public.vitor_syndication_metrics (
  id bigint generated always as identity primary key,
  syndication_id uuid not null references public.vitor_syndications (id) on delete cascade,
  captured_at timestamptz not null default now(),
  tabcoins int,
  comments_count int
);
create index if not exists vitor_syndication_metrics_syn_idx
  on public.vitor_syndication_metrics (syndication_id, captured_at desc);

-- Cliques first-party (métrica PRIMÁRIA). Sem IP cru; UA só hasheado.
create table if not exists public.vitor_syndication_clicks (
  id bigint generated always as identity primary key,
  syndication_id uuid references public.vitor_syndications (id) on delete set null,
  post_permalink text not null,
  format text,
  occurred_at timestamptz not null default now(),
  referrer text,
  country text,
  device text,
  ua_hash text
);
create index if not exists vitor_syndication_clicks_syn_idx
  on public.vitor_syndication_clicks (syndication_id, occurred_at desc);
create index if not exists vitor_syndication_clicks_permalink_idx
  on public.vitor_syndication_clicks (post_permalink, occurred_at desc);

-- RLS trancado: habilita e NÃO cria policy → deny-all p/ anon e authenticated.
alter table public.vitor_syndications enable row level security;
alter table public.vitor_syndication_metrics enable row level security;
alter table public.vitor_syndication_clicks enable row level security;

-- Defensivo: revoga os grants default (PostgREST) — nem entram no schema do anon.
revoke all on public.vitor_syndications from anon, authenticated;
revoke all on public.vitor_syndication_metrics from anon, authenticated;
revoke all on public.vitor_syndication_clicks from anon, authenticated;
