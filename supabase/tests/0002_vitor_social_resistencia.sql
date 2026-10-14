begin;

-- Teste de resistência da 0002_vitor_social. Rodar como `postgres` (SQL Editor),
-- DEPOIS de aplicar a migration. Saída esperada: só `NOTICE ok: ...`. Qualquer
-- `ERROR` = alguma permissão está errada; o script para no primeiro.
--
-- Cada caso negativo executa a operação e, se ela PASSAR, dá raise exception
-- (fora do handler, então ninguém engole). Só insufficient_privilege é aceito
-- como "barrado". Tudo termina em rollback: não fica dado nem grant.

-- No Postgres 16+, quem cria um papel não ganha SET nele por padrão. Este grant
-- deixa o `set local role` abaixo funcionar e some no rollback.
grant social_collector, social_reader to current_user;

-- 1. social_reader não escreve.
set local role social_reader;
do $$
begin
  insert into public.vitor_social_posts (rede, external_id) values ('youtube', 'teste-reader');
  raise exception 'FALHA: social_reader fez INSERT em vitor_social_posts';
exception when insufficient_privilege then
  raise notice 'ok: social_reader INSERT em vitor_social_posts barrado';
end
$$;
reset role;

-- 2. social_collector não enxerga tabela fora das vitor_social_*.
set local role social_collector;
do $$
begin
  perform (select count(*) from public.vitor_syndication_clicks);
  raise exception 'FALHA: social_collector fez SELECT em vitor_syndication_clicks';
exception when insufficient_privilege then
  raise notice 'ok: social_collector SELECT em vitor_syndication_clicks barrado';
end
$$;
reset role;

-- 3. social_collector não apaga.
set local role social_collector;
do $$
begin
  delete from public.vitor_social_posts;
  raise exception 'FALHA: social_collector fez DELETE em vitor_social_posts';
exception when insufficient_privilege then
  raise notice 'ok: social_collector DELETE em vitor_social_posts barrado';
end
$$;
reset role;

-- 4. anon (chave publishable) não lê nenhuma das cinco.
set local role anon;
do $$
begin
  perform (select count(*) from public.vitor_social_posts);
  raise exception 'FALHA: anon fez SELECT em vitor_social_posts';
exception when insufficient_privilege then
  raise notice 'ok: anon SELECT em vitor_social_posts barrado';
end
$$;
do $$
begin
  perform (select count(*) from public.vitor_social_post_metrics);
  raise exception 'FALHA: anon fez SELECT em vitor_social_post_metrics';
exception when insufficient_privilege then
  raise notice 'ok: anon SELECT em vitor_social_post_metrics barrado';
end
$$;
do $$
begin
  perform (select count(*) from public.vitor_social_account_daily);
  raise exception 'FALHA: anon fez SELECT em vitor_social_account_daily';
exception when insufficient_privilege then
  raise notice 'ok: anon SELECT em vitor_social_account_daily barrado';
end
$$;
do $$
begin
  perform (select count(*) from public.vitor_social_goals);
  raise exception 'FALHA: anon fez SELECT em vitor_social_goals';
exception when insufficient_privilege then
  raise notice 'ok: anon SELECT em vitor_social_goals barrado';
end
$$;
do $$
begin
  perform (select count(*) from public.vitor_social_collect_runs);
  raise exception 'FALHA: anon fez SELECT em vitor_social_collect_runs';
exception when insufficient_privilege then
  raise notice 'ok: anon SELECT em vitor_social_collect_runs barrado';
end
$$;
reset role;

-- 5. authenticated (usuário logado via Supabase Auth) também não lê.
set local role authenticated;
do $$
begin
  perform (select count(*) from public.vitor_social_posts);
  raise exception 'FALHA: authenticated fez SELECT em vitor_social_posts';
exception when insufficient_privilege then
  raise notice 'ok: authenticated SELECT em vitor_social_posts barrado';
end
$$;
reset role;

-- 6. Caso que PRECISA passar: social_collector cria post e faz upsert da métrica.
-- Sem handler: qualquer erro aqui aborta o script.
set local role social_collector;
do $$
declare
  v_post uuid;
  v_views bigint;
begin
  insert into public.vitor_social_posts (rede, external_id, tipo)
    values ('youtube', 'teste-resist', 'short')
    returning id into v_post;

  insert into public.vitor_social_post_metrics (post_id, dia, views)
    values (v_post, date '2026-01-01', 10)
    on conflict (post_id, dia) do update set views = excluded.views, captured_at = now();
  insert into public.vitor_social_post_metrics (post_id, dia, views)
    values (v_post, date '2026-01-01', 25)
    on conflict (post_id, dia) do update set views = excluded.views, captured_at = now();

  select views into v_views from public.vitor_social_post_metrics
    where post_id = v_post and dia = date '2026-01-01';
  if v_views is distinct from 25 then
    raise exception 'FALHA: upsert do social_collector não atualizou (views = %)', v_views;
  end if;
  raise notice 'ok: social_collector fez upsert em vitor_social_post_metrics';
end
$$;
reset role;

-- 7. Caso que PRECISA passar: social_reader lê as cinco (e enxerga o post do caso 6,
-- o que prova que a policy de leitura não está filtrando linha).
set local role social_reader;
do $$
begin
  if not exists (select 1 from public.vitor_social_posts where external_id = 'teste-resist') then
    raise exception 'FALHA: social_reader não enxerga a linha gravada pelo collector';
  end if;
  perform (select count(*) from public.vitor_social_post_metrics);
  perform (select count(*) from public.vitor_social_account_daily);
  perform (select count(*) from public.vitor_social_goals);
  perform (select count(*) from public.vitor_social_collect_runs);
  raise notice 'ok: social_reader leu as cinco tabelas';
end
$$;
reset role;

rollback;
