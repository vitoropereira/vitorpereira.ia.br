# TabNews Syndication — Fase 2 (medição) — Handoff

**Data:** 2026-07-19 (construído autonomamente enquanto o Vitor dormia)
**Branch:** `feat/tabnews-syndication`
**Status:** Construído, testado, **sem PR/merge/deploy** (é a revisão de amanhã, juntos).
**Spec:** `docs/superpowers/specs/2026-07-18-tabnews-syndication-design.md`

---

## O que foi construído

Camada de analytics do cross-post: registra cada syndication no Supabase, puxa
métricas do TabNews, e mede **cliques de volta pro site** (métrica primária).

| Peça | Arquivo | Estado |
| --- | --- | --- |
| Tabelas `vitor_*` + RLS trancado | `supabase/migrations/0001_vitor_syndication.sql` | ✅ **aplicada** no seu Supabase |
| Cliente Management API (escaping seguro) | `lib/analytics/supabase-admin.ts` | ✅ testado |
| Gravar/ler syndications + snapshots | `lib/analytics/record.ts` | ✅ testado + validado no DB real |
| CLI grava a linha no publish | `scripts/crosspost.ts` | ✅ (best-effort) |
| `pnpm crosspost:stats` (tabela no terminal) | `scripts/crosspost-stats.ts` | ✅ rodou contra DB+TabNews reais |
| Métricas do TabNews | `lib/tabnews/client.ts` (`getContentMetrics`) | ✅ testado |
| Clique first-party: helpers + log | `lib/analytics/click.ts` | ✅ testado (anti open-redirect) |
| Rota redirect de rastreio | `app/api/track/route.ts` | ✅ testado (redirect); log gated |
| CTA roteado pelo `/api/track` | `lib/mdx/to-tabnews-markdown.ts` | ✅ testado |

**Gates:** velite ✓ · typecheck ✓ · lint ✓ · **77 testes ✓**.

---

## O que já está VIVO (e é reversível)

- **3 tabelas `vitor_*`** criadas no seu Supabase pessoal (`qzczyicspbizosjogmlq`),
  **aditivas** (não tocam nas suas tabelas de finanças/WhatsApp). RLS **trancado**:
  testei que a chave anon leva **HTTP 401** em leitura E escrita.
- **1 linha** em `vitor_syndications` (backfill do âncora já publicado) + 1 snapshot
  de métricas. Reversível: `drop table` das `vitor_*` desfaz tudo.

---

## O que PRECISA de você pra ativar (o clique first-party)

O log de clique roda **server-side** e é **gated** — sem os secrets, o `/api/track`
ainda redireciona certo (o funil funciona), **só não grava o clique**. Pra ativar:

1. **Local** (`.env.development.local`): adicione
   `NEXT_PUBLIC_SUPABASE_URL=https://qzczyicspbizosjogmlq.supabase.co` e
   `SUPABASE_SERVICE_ROLE_KEY=<sua service_role>` (pegue no dashboard Supabase →
   Settings → API). **Não** deixei sua service_role no repo — decisão minha, é secreta.
2. **Vercel** (Production + Preview): as duas mesmas vars. A `SERVICE_ROLE` é
   **secreta** (server apenas, nunca `NEXT_PUBLIC`). Slots documentados no `.env.example`.
3. Deploy. A partir daí, todo clique de um CTA do TabNews cai em `vitor_syndication_clicks`.

Depois: `pnpm crosspost:stats` mostra a tabela (post · formato · idade · tabcoins ·
comentários · **cliques**).

---

## Decisões que tomei sozinho (revise se discorda)

1. **Escrita do CLI via Management token** (não service_role): eu já tinha o token,
   evita você precisar colar service_role pra o fluxo local. Local apenas.
2. **Clique = redirect `/api/track`** em vez de logar na página do post. **Por quê:**
   ler `searchParams` na página de post a tornaria **dinâmica** (perde static/SEO). O
   redirect mantém as páginas estáticas. **Custo:** o link visível no TabNews aponta
   pra `vitorpereira.ia.br/api/track?to=…` (escondido atrás do título no markdown), e
   há um hop de redirect. Se preferir a canônica limpa + aceitar o GA subcontar, dá pra
   reverter o CTA (mudança pequena em `to-tabnews-markdown.ts`).
3. **Anti open-redirect**: `/api/track` só redireciona pra `vitorpereira.ia.br`
   (destino externo → volta pro site). Testado.
4. **RLS trancado + REVOKE** (deny-all pra anon/authenticated). Escrita só por caminho
   privilegiado (Management token local / service_role server). Sua regra da fronteira.
5. **Sem dashboard** (você pediu): leitura por `crosspost:stats` / SQL.
6. **UA hasheado, sem IP cru** nos cliques (privacidade).

---

## Checklist de revisão (amanhã)

- [ ] Ler `supabase/migrations/0001_vitor_syndication.sql` — schema + RLS ok?
- [ ] Confirmar o trade-off do CTA-via-redirect (item 2) — mantém ou reverte?
- [ ] Rodar `pnpm crosspost:stats` (já configurado local) — ver a tabela.
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (local+Vercel) pra ativar cliques.
- [ ] Rodar o review de segurança (já anexei um no fim da branch) — ver findings.
- [ ] PR de tudo (Fase 1 + Fase 2 + os posts) quando aprovar.

---

## Fora de escopo (deferido, como na spec)

`--update`/PATCH (republicar sem duplicar), cache de sessão, dashboard web,
rate-limit no `/api/track`. Nada disso é necessário pra a Fase 2 funcionar.
