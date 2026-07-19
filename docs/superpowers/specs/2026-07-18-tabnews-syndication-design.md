# Design — Syndication POSSE (site → TabNews) + medição

**Data:** 2026-07-18
**Autor:** Vitor (com Claude Code)
**Status:** Aprovado — pronto para o plano de implementação
**Branch:** `feat/tabnews-syndication` (a partir de `main`, sem stacking sobre a PR #20)

---

## 1. Objetivo

Publicar um post no site (`vitorpereira.ia.br`) e **sindicá-lo pro TabNews** com um
comando, mantendo o **site como fonte canônica** (padrão **POSSE**). O TabNews é
canal de descoberta que **funila** de volta pro site. Além de publicar, **medir o
que funciona** — priorizando o clique de volta pro site.

Escopo em **duas fases**:
- **Fase 1 — cross-post:** biblioteca + comando local que publica no TabNews. Ship
  independente; **não** depende do banco.
- **Fase 2 — medição:** camada de analytics no Supabase (cliques first-party +
  snapshots do TabNews) + comando de stats.

Não-objetivos:
- Exibir conteúdo do TabNews **no** site.
- Sindicar posts em **EN** (TabNews é PT-BR; só PT).
- Backfill dos posts que já existem no TabNews.
- **Dashboard web** (por ora não — leitura via CLI/SQL; dashzinho só se trivial, depois).
- Rota HTTP + botão no site (fase futura; a lib já fica pronta pra isso).

---

## 2. Estratégia de conteúdo

### 2.1 Achado verificado sobre o SEO do TabNews

Investigação no repo open-source (`filipedeschamps/tabnews.com.br`) + HTML real.
**Correção de hipótese inicial errada (n=1):** setar `source_url` **não** faz o
TabNews marcar `noindex`. Prova:

| Post | `type` | `source_url` | `robots` |
| --- | --- | --- | --- |
| copa/palpites | `content` | `null` | `index, follow` |
| openclaw | `ad` | `youtu.be/...` | `noindex, nofollow` |

O `noindex` era por ser **anúncio** (`type: ad`), não pelo `source_url`. Código:
`pages/[username]/[slug]/index.jsx` → `canonical` é sempre a URL do TabNews;
`noIndex: type === 'ad'`. O `source_url` vira só link "Fonte:" com `rel=nofollow`.

**Consequência:** espelhar o **conteúdo completo** cria disputa de conteúdo
duplicado (o TabNews é indexável, se auto-canonicaliza e tem alta autoridade). O
TabNews **não** protege nosso SEO.

### 2.2 Modo padrão: **resumo** (não teaser cru)

Manda pro TabNews um **resumo de cada item** do post (ex.: uma linha por pergunta,
no caso do #2) + CTA pro post completo. É um artefato **transformado** (não cópia),
então:
- ✅ Entrega valor por si só → a comunidade não lê como isca (risco menor de downvote).
- ✅ Diferente do original → sem duplicata de SEO.
- ✅ Funil pro domínio próprio (onde vive marca/portfólio).

**Direção editorial paralela (fora do tooling):** o post no **site fica mais denso**
— mais exemplos e detalhe. O gap entre "resumo no TabNews" e "profundidade no site"
é o que faz o clique valer a pena.

### 2.3 Modos e como o resumo é gerado

Três modos (flag `--format`):
- **`summary`** (default): resumo item-a-item.
- **`teaser`**: só a lede + CTA (fallback pra posts em prosa, sem itens claros).
- **`full`**: conteúdo inteiro + "Publicado originalmente em <canônica>" (escape hatch).

**Geração do resumo (opção escolhida): tool extrai → Vitor edita → publica.**
- O tool monta um rascunho **determinístico**: título de cada `##` + a 1ª frase-chave
  da seção. **Sem IA, sem inventar** (respeita anti-fabricação).
- O `--dry-run` grava o rascunho em `.syndication/<slug>.preview.md` pra Vitor
  **ajustar à mão** antes de publicar. Mantém "minha mão em tudo" sem virar um 2º
  artigo por semana.
- **Override manual:** um marcador `{/* tabnews */}` no MDX define o corte exato
  quando Vitor quiser; sem marcador, usa o default do modo.

---

## 3. Contrato verificado da API do TabNews

Host: `https://www.tabnews.com.br`. Lido do código real.

- **Login:** `POST /api/v1/sessions` `{email,password}` → `token` (96 hex) no corpo
  → header `Cookie: session_id=<token>`. Expira em 30 dias. Conta precisa estar
  **ativada** (senão 403). Sem Bearer.
- **Criar:** `POST /api/v1/contents` `{title, body, status, source_url}`.
  - `body` **obrigatório**, Markdown, **≤ 20.000 chars**, começa com char visível.
  - `title` **obrigatório** (raiz), ≤ 255.
  - `status` default **`draft`** → ⚠️ enviar **`published`** explicitamente.
  - `source_url` opcional, `^https?://…`, ≤ 2000.
  - 201 devolve `owner_username` + `slug` → URL pública.
  - Prestígio negativo bloqueia; TabCoins **não** exigidos p/ `type: content`.
- **Atualizar:** `PATCH /api/v1/contents/[username]/[slug]` — `title/body/source_url/status`.
  Não volta `published→draft`. Habilita `--update`.
- **Rate limit:** máx **2 criações / 5s por IP** → 429 **e apaga o que criou**. 1 por vez.
- **Markdown:** GFM + KaTeX + mermaid + gemoji + highlight. **JSX/HTML descartado**
  (por isso transformamos `<Callout>`/`<Video>`). Links externos ganham `nofollow`.

---

## 4. Métricas — o que importa (e o que não)

**Princípio:** TabCoins e comentários são **vaidade** — um post pode trazer muito
acesso sem ganhar coin nem comentário. O que importa é o **clique de volta pro site**.

E tem um agravante: o público é **dev**, que **bloqueia GA/analytics** → o GA
**subconta** cliques. Por isso o clique é medido **first-party** (cai no nosso site,
gravamos no nosso banco), não via GA.

| Prioridade | Métrica | Origem |
| --- | --- | --- |
| ⭐ **Primária** | **cliques pro site** por post e por formato | first-party (`vitor_syndication_clicks`) |
| Secundária | tabcoins, nº de comentários | snapshot da API do TabNews (`vitor_syndication_metrics`) |
| Contexto | formato, pilar/tema, tamanho do resumo, dia/hora do post, título | `vitor_syndications` |
| Qualitativa | **anotação livre de Vitor** ("título ficou clickbait", "postei sexta à noite") | `vitor_syndications.note` |

⚠️ **Rigor honesto:** com ~2 posts/semana, cada um de tema diferente, isto é
**aprendizado direcional**, não experimento controlado — cada post é um confundidor.
Coletar sim; **não** concluir "formato X é melhor" a partir de n=1–2. Em amostra
pequena, a **anotação qualitativa** costuma valer mais que qualquer coluna numérica.

**Atribuição do clique:** o link do CTA carrega UTM com o formato — ex.:
`…/2026/07/18/…?utm_source=tabnews&utm_medium=syndication&utm_content=summary`.
O `source_url` (campo "Fonte") continua **limpo**, sem UTM.

---

## 5. Arquitetura

```
lib/
  syndication/
    types.ts              # SyndicationTarget, SourcePost, SyndicationResult
    posse.ts              # orquestra: post publicado → roda targets habilitados
    targets/
      tabnews.ts          # adapter: transform + client + registro
  tabnews/
    client.ts             # createSession · createContent · updateContent · getContent
    types.ts · errors.ts  # tipos + mapeamento de erro (429, 403, prestígio)
  mdx/
    to-tabnews-markdown.ts # MDX → markdown (modos summary | teaser | full) + UTM no CTA
  analytics/               # (fase 2)
    supabase-admin.ts      # cliente Management-token, escopo travado no PROJECT_REF
    record.ts              # grava vitor_syndications / lê vitor_syndication_metrics
scripts/
  crosspost.ts            # pnpm crosspost <post> [--dry-run] [--format] [--update] [--draft]
  crosspost-stats.ts      # pnpm crosspost:stats — lê números e imprime tabela (fase 2)
```

Fase futura (desenhada, não implementada): `app/api/syndicate/route.ts` + botão
admin + a rota de log de clique reusam a lib. Segredo migra pra Vercel (server-side,
nunca `NEXT_PUBLIC`); rotas protegidas por auth Vitor-only.

---

## 6. Fluxo de dados (comando local, modo summary)

```
pnpm crosspost content/posts/2026/07/18/arquitetura-mental-do-agente
  1. Lê index.mdx (PT) → frontmatter + body
  2. GUARDS: draft:false?  já tem `tabnews:` no frontmatter (ou linha no DB)?  título/ body ok?
  3. RESUMO = por seção ("## X" → 1ª frase) transformado + CTA com UTM
       transform: <Callout>→citação · <Video>→link YT · links internos→absolutos · strip JSX
  4. payload = { title, body: resumo, status:"published", source_url: canônica-limpa }
  5. --dry-run → grava .syndication/<slug>.preview.md → PARA (Vitor edita)
  6. run real → sessão (token cacheado/login .env) → POST /contents → 201 {user, slug}
       → grava `tabnews: <url>` no frontmatter  (+ fase 2: insere linha em vitor_syndications)
  7. Vitor revisa o diff e commita
```

Flags: `--dry-run` (gera, não publica), `--format teaser|summary|full`, `--update`
(PATCH), `--draft` (publica como rascunho no TabNews).

---

## 7. Idempotência (anti-duplo-post)

Dois níveis, papéis distintos:
- **Frontmatter `tabnews: "<url>"`** — marcador **offline, versionado em git**. Guard
  do passo 2; de brinde vira link *"Discuta no TabNews"* no rodapé do post. Custo: 1
  campo opcional no schema do Velite.
- **DB `vitor_syndications`** (fase 2) — `unique (post_permalink, target)` garante no
  banco. É o registro rico do experimento.

O CLI escreve os dois após 201. `--update` faz `PATCH` em vez de duplicar.

---

## 8. Armazenamento — Supabase (fase 2)

**Projeto:** o Supabase pessoal do Vitor (`qzczyicspbizosjogmlq`), **compartilhado**
com outras tabelas dele. Regras de convivência:
- **Não** tocamos nas tabelas existentes.
- Tudo que criamos leva **prefixo `vitor_`**.
- **RLS trancado** em todas: **nenhuma policy pública** (o site usa a publishable key;
  nada de `vitor_*` pode vazar pro anon). Leitura via Management token (CLI/aqui);
  escrita via service_role server-side.

**Segredos:**
- `SUPABASE_TOKEN` (management, `sbp_…`) + `SUPABASE_PROJECT_REF` — **local apenas**,
  escopo travado no ref; usado por mim/CLI pra criar tabelas e ler stats. Não é
  `NEXT_PUBLIC`, não vai pra Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` — para a **escrita** de runtime (log de clique
  server-side na fase futura da rota). Server-side apenas.

**Tabelas (`vitor_` prefix):**

`vitor_syndications` — 1 linha por cross-post
```
id uuid pk · post_permalink text · canonical_url text · target text default 'tabnews'
external_url text · external_slug text · format text check(summary|teaser|full)
status text · title text · summary_char_count int · pillar text · tags text[]
posted_at timestamptz · note text · source_commit text · created_at timestamptz
unique(post_permalink, target)
```

`vitor_syndication_metrics` — snapshots do TabNews (vaidade/contexto)
```
id bigint identity pk · syndication_id uuid fk → vitor_syndications(id) on delete cascade
captured_at timestamptz · tabcoins int · comments_count int
```

`vitor_syndication_clicks` — first-party (métrica primária)
```
id bigint identity pk · syndication_id uuid fk (nullable) · post_permalink text · format text
occurred_at timestamptz · referrer text · country text · device text · ua_hash text · is_bot bool
```
**Privacidade:** sem IP cru; UA só **hasheado**; geo/device grosseiros (headers Vercel).

---

## 9. Transform MDX → markdown do TabNews

Função **pura** (`lib/mdx/to-tabnews-markdown.ts`), sem rede — maior valor de teste.

| No `.mdx` | Vira |
| --- | --- |
| frontmatter | removido |
| `<Callout type=note/warn/info>` | citação `> **Nota/Atenção/Info:** …` |
| `<Video id="XYZ" />` | `[Assista no YouTube](https://youtu.be/XYZ)` |
| link interno `/2026/…`, `/en/…` | absoluto `https://vitorpereira.ia.br/…` |
| code fence / tabelas GFM | mantêm |
| imagens `./assets/…` | absolutas `…/static/…` |
| CTA final | link canônico **com UTM** (`utm_content=<format>`) |

- **summary:** cada `##` → 1ª frase; junta como lista + CTA.
- **teaser:** lede (até 1º `##`) + CTA. **full:** corpo inteiro + rodapé "original".
- Guard: `len(body) ≤ 20.000` antes de chamar a API.

---

## 10. Erros

- `429`: explica o burst 2/5s; sem retry agressivo (TabNews apaga ao estourar).
- `403` (conta não ativada / prestígio): mensagem com a causa.
- `body > 20.000`: guard local antes da API.
- Rede/login/DB: erro tipado, **sem estado parcial** — não grava `tabnews:` nem linha
  no DB se o POST não confirmou 201. Nada de erro silencioso.

---

## 11. Testes

- **Transform** (`to-tabnews-markdown`): unitário com **fixtures dos posts reais**
  (#2, #3) — determinístico, sem rede. Cobre summary/teaser/full, Callout, Video,
  links→absolutos, UTM no CTA, guard 20k.
- **Cliente TabNews:** mockado. Casos: 201, 429, 403, garante `status:"published"`.
- **Orquestrador `posse`:** mock; garante guards (draft, idempotência).
- **Analytics (fase 2):** RLS — teste que **afirma que anon NÃO lê `vitor_*`** (não só
  que o service_role lê). Escopo do token travado no ref.
- Gates: `pnpm typecheck` + `pnpm lint` + `pnpm test` verdes.

---

## 12. Entregáveis

**Fase 1 — cross-post (ship primeiro, sem banco):**
1. `lib/syndication/*`, `lib/tabnews/*`, `lib/mdx/to-tabnews-markdown.ts`.
2. `scripts/crosspost.ts` + `pnpm crosspost`.
3. Slots `TABNEWS_EMAIL`/`TABNEWS_PASSWORD` no `.env.example`; `.gitignore` cobrindo `.syndication/`.
4. Campo `tabnews` opcional no schema do Velite + link opcional no rodapé.
5. Testes do transform + cliente + orquestrador.
6. Primeiro run é `--dry-run`; publicar de verdade só com OK do Vitor.

**Fase 2 — medição:**
7. Tabelas `vitor_*` (migration) + RLS trancado + doc dos slots Supabase no `.env.example`.
8. `lib/analytics/*` (grava syndications, lê metrics) + UTM no CTA.
9. Rota/middleware de log de clique first-party (server-side, service_role).
10. `scripts/crosspost-stats.ts` + `pnpm crosspost:stats` (tabela no terminal).

---

## 13. Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| Cultura TabNews penaliza resumo | Resumo com valor real; `--full` disponível |
| Conclusão errada de amostra pequena | Rótulo "direcional"; peso na anotação qualitativa |
| GA subconta cliques (dev bloqueia) | Clique medido **first-party** |
| Supabase compartilhado com dado pessoal | Prefixo `vitor_` + RLS trancado + escopo do token no ref |
| Rate limit apaga conteúdo | 1 post por vez; sem retry agressivo |
| Token/sessão expira (30d) | Cache com checagem + re-login |
| Frontmatter/DB divergem | CLI escreve ambos após 201; guard checa os dois |
