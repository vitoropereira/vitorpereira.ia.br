# Design — Syndication POSSE (site → TabNews)

**Data:** 2026-07-18
**Autor:** Vitor (com Claude Code)
**Status:** Aprovado — pronto para o plano de implementação
**Branch:** `feat/tabnews-syndication` (a partir de `main`, sem stacking sobre a PR #20)

---

## 1. Objetivo

Publicar um post no site (`vitorpereira.ia.br`) e **sindicá-lo pro TabNews** com um
único comando, mantendo o **site como fonte canônica**. O padrão é
**POSSE** (*Publish on your Own Site, Syndicate Elsewhere*): o conteúdo "mora" no
domínio próprio; o TabNews é canal de descoberta que **funila** de volta pro site.

Escopo desta fase (fase 1): **biblioteca + comando local**. A rota HTTP + botão
no site ficam para a fase 2, reusando a mesma lib.

Não-objetivos (fora de escopo):
- Puxar/exibir conteúdo do TabNews **no** site (decisão anterior: não por enquanto).
- Sindicar posts em **EN** (TabNews é comunidade PT-BR; só PT).
- Backfill dos posts que já existem no TabNews (fluxo é só site → TabNews, daqui pra frente).
- Fase 2 (rota `app/api/syndicate` + botão admin) — desenhada, não implementada aqui.

---

## 2. Decisão de estratégia (e o porquê)

### 2.1 Achado verificado sobre o SEO do TabNews

Investigação no repositório open-source (`filipedeschamps/tabnews.com.br`) +
inspeção do HTML renderizado de posts reais. **Correção importante de uma
hipótese inicial errada:**

- Hipótese inicial (n=1, **falsificada**): "setar `source_url` faz o TabNews
  marcar a página como `noindex`". **Errado.**
- Verdade (código + prova empírica): o TabNews só emite `noindex` quando
  `type === "ad"` (anúncio). O post que parecia "protegido" era um **anúncio**
  (`type: ad`), não efeito do `source_url`.

Prova empírica:

| Post | `type` | `source_url` | `robots` |
| --- | --- | --- | --- |
| copa/palpites | `content` | `null` | `index, follow` |
| openclaw | `ad` | `youtu.be/...` | `noindex, nofollow` |

Fundamentos no código:
- `pages/[username]/[slug]/index.jsx` → `canonical` é **sempre a própria URL do
  TabNews**; `noIndex: type === 'ad'`.
- `interface/components/Content/index.jsx` → `source_url` vira só um link visível
  "**Fonte:**", com `rel="nofollow"` (nosso domínio não está na whitelist de
  domínios confiáveis: `tabnews.com.br`, `curso.dev`, `filipedeschamps.com.br`,
  `github.com`).

**Consequência:** publicar o **conteúdo completo** no TabNews cria disputa de
conteúdo duplicado — a cópia é indexável, se auto-canonicaliza e o TabNews tem
alta autoridade de domínio, então **pode ranquear no lugar do original**. O
TabNews **não** protege nosso SEO por nós.

### 2.2 Estratégia escolhida: **teaser + link**

Manda pro TabNews um **teaser** (lede forte + a sacada principal) terminando com
um CTA que aponta pro post completo no site.

- ✅ SEO-limpo: conteúdo diferente e curto no TabNews → sem duplicata.
- ✅ Funil pro domínio próprio (onde vive a marca/portfólio) → serve o objetivo de
  autoridade.
- ✅ Coerente com "site é canônico" (decisão anterior).
- ⚠️ Risco conhecido: a cultura do TabNews às vezes penaliza teaser puro como
  autopromoção. Mitigação: o teaser precisa ter **valor por si só** (a ideia
  central entregue), não ser um isca vazia. O `--full` fica disponível como
  escape hatch se algum post pedir.

---

## 3. Contrato verificado da API do TabNews

Host: `https://www.tabnews.com.br`. Tudo abaixo lido do código real do repo.

### 3.1 Autenticação — `POST /api/v1/sessions`
- Body: `{ email, password }` (email 7–254 chars; senha 8–72).
- Resposta 201: `{ id, token, expires_at, ... }` — **`token` vem no corpo** (96
  chars hex).
- Uso nas próximas chamadas: header `Cookie: session_id=<token>`. **Não** há
  Bearer.
- Expira em **30 dias**. Conta precisa estar **ativada** (senão 403 + reenvio de
  ativação). Conta ativada tem a feature `create:content`.

### 3.2 Criar conteúdo — `POST /api/v1/contents`
- Body (raiz): `{ title, body, status, source_url }`.
- **`body` obrigatório**; Markdown; **≤ 20.000 chars**; precisa começar com char
  visível; não pode ficar vazio após remover markdown.
- **`title` obrigatório para conteúdo raiz**; ≤ 255 chars.
- **`status`**: `draft | published | deleted | firewall`. **Default = `draft`.**
  ⚠️ Precisamos enviar **`status: "published"`** explicitamente.
- `source_url`: opcional, `^https?://…`, ≤ 2000 chars.
- `slug`: opcional (gerado do título se omitido); regex `^[a-z0-9](-?[a-z0-9])*$`.
- Resposta 201: objeto do conteúdo, incl. `owner_username` + `slug` → dá pra
  montar a URL pública `https://www.tabnews.com.br/{owner_username}/{slug}`.
- Gate: prestígio negativo bloqueia publicar (`ForbiddenError`). TabCoins **não**
  são exigidos para `type: content`.

### 3.3 Atualizar — `PATCH /api/v1/contents/[username]/[slug]`
- Edita `title, body, source_url, status`.
- Não permite voltar `published → draft`. Publicar rascunho via `PATCH` funciona.
- Habilita `--update` (republicar/corrigir sem duplicar).

### 3.4 Rate limit / anti-abuso
- Firewall por IP: **máx. 2 criações a cada 5s**; a 3ª → **429** e o side-effect
  **apaga o que foi criado** + reverte TabCoins.
- Sem teto diário no código. Estratégia: 1 post por vez, com folga entre chamadas.

### 3.5 Formato do body
- Markdown (ByteMD + `rehype-sanitize`): GFM (tabelas, task lists, strikethrough),
  KaTeX, mermaid, gemoji, syntax highlight.
- **JSX/HTML fora do schema é descartado** → confirma a necessidade de transformar
  `<Callout>` e `<Video>`.
- Links externos ganham `nofollow` (menos domínios confiáveis).

---

## 4. Arquitetura

Abstração de **syndication** com *targets* plugáveis. TabNews é o primeiro target;
Dev.to/LinkedIn/etc. podem ser adicionados depois sem tocar no núcleo.

```
lib/
  syndication/
    types.ts              # SyndicationTarget, SourcePost, SyndicationResult
    posse.ts              # orquestra: post publicado → roda targets habilitados
    targets/
      tabnews.ts          # adapter: transform(teaser) + client + registro idempotente
  tabnews/
    client.ts             # createSession · createContent · updateContent · getMe
    types.ts              # tipos das respostas
    errors.ts             # mapeia erros do TabNews (429, 403 conta-não-ativada, prestígio)
  mdx/
    to-tabnews-markdown.ts # MDX → markdown do TabNews (modo teaser | full)
scripts/
  crosspost.ts            # CLI: pnpm crosspost <post> [--dry-run] [--full] [--update] [--draft]
```

Fase 2 (desenhada, não implementada): `app/api/syndicate/route.ts` + botão admin
reusam `lib/syndication`. Muda só o gatilho e onde mora o segredo (Vercel env +
rota protegida por auth Vitor-only — a fronteira é o servidor).

### Interfaces principais (esboço)

```ts
// lib/syndication/types.ts
export interface SourcePost {
  title: string;
  bodyMdx: string;          // corpo MDX cru (sem frontmatter)
  canonicalUrl: string;     // https://vitorpereira.ia.br/<permalink>
  permalink: string;
  locale: "pt" | "en";
  draft: boolean;
  tags: string[];
}

export interface SyndicationResult {
  target: string;           // "tabnews"
  url: string;              // URL pública no destino
  externalId?: string;      // id/slug no destino
  mode: "teaser" | "full";
}

export interface SyndicationTarget {
  name: string;
  publish(post: SourcePost, opts: PublishOpts): Promise<SyndicationResult>;
}
```

---

## 5. Fluxo de dados (comando local, modo teaser)

```
pnpm crosspost content/posts/2026/07/18/arquitetura-mental-do-agente
  │
  1. Lê index.mdx (PT) → parse frontmatter + body
  2. GUARDS (falha cedo, mensagem clara):
       - draft:false?  (só sindica publicado)
       - já tem `tabnews:` no frontmatter?  → aborta (idempotência), a menos que --update
       - body não-vazio, título presente
  3. TEASER = lede (tudo até o 1º "##") transformado + rodapé CTA
       transform:  <Callout> → citação  ·  <Video> → link YouTube
                   links internos "/..." → absolutos  ·  strip JSX/frontmatter
       rodapé:     "\n\n---\n\nEscrevi o resto no meu site:\n\n**[<título>](<canônica>)**"
       guard:      len(body) ≤ 20.000
  4. payload = { title, body: teaser, status: "published", source_url: canônica }
  5. --dry-run → imprime payload + grava .syndication/<slug>.preview.md → PARA
  6. run real:
       sessão = token cacheado válido  ||  login(email, senha do .env) → cacheia token
       POST /api/v1/contents  →  201 { owner_username, slug }
       url = https://www.tabnews.com.br/{owner_username}/{slug}
       grava `tabnews: "<url>"` no frontmatter do index.mdx
  7. Vitor revisa o diff do frontmatter e commita
```

Flags:
- `--dry-run`: gera e mostra, **não** publica. Escreve um `.preview.md` revisável.
- `--full`: publica o conteúdo inteiro (escape hatch), não o teaser.
- `--update`: `PATCH` no conteúdo já existente (usa a URL do frontmatter) em vez
  de criar outro.
- `--draft`: publica como rascunho no TabNews (revisar lá antes) — default é
  `published`.

---

## 6. Segurança e segredos

- **Credenciais:** `TABNEWS_EMAIL` + `TABNEWS_PASSWORD` no `.env.development.local`
  (gitignored). Slots vazios documentados no `.env.example`. **Uso local apenas** —
  não vão pra Vercel nesta fase.
- **Cache de sessão:** o token (30d) é cacheado em `.syndication/session.json`
  (gitignored). Re-login automático quando expira. Evita logar a cada run.
- **Sem `NEXT_PUBLIC_`** em nada disto — nunca chega ao browser.
- **Fase 2 (nota):** ao expor rota HTTP, o segredo migra pra Vercel env e a rota
  **precisa de auth forte** (Vitor-only). A fronteira real é o servidor: uma rota
  que publica no TabNews sem proteção deixa qualquer um postar no seu nome.
- Segue o mesmo padrão já estabelecido pelo `gen:cover` (PR #20): env slot +
  `node --env-file`, deps de autoria em `devDependencies`, fora do runtime do site.

---

## 7. Idempotência (anti-duplo-post)

- Após publicar, grava `tabnews: "<url>"` **no frontmatter** do post.
- Guard no passo 2: se `tabnews:` já existe → aborta (a menos que `--update`).
- **Bônus:** o site pode renderizar um link *"Discuta no TabNews"* no rodapé do
  post a partir desse campo.
- **Custo:** um campo opcional novo no schema do Velite (`tabnews: s.string().optional()`)
  + render opcional no `PostBody`/rodapé.
- Alternativa considerada e descartada: sidecar `.syndication.json` — não mexe no
  schema, mas não habilita o link "Discuta no TabNews". Frontmatter venceu.

---

## 8. Transform MDX → markdown do TabNews

Função **pura** (`lib/mdx/to-tabnews-markdown.ts`), sem rede — o ponto de maior
valor de teste.

| No `.mdx` | Vira |
| --- | --- |
| frontmatter YAML | removido (título vai em campo separado) |
| `<Callout type="note">…</Callout>` | citação `> **Nota:** …` |
| `<Callout type="warn">` | `> **Atenção:** …` |
| `<Callout type="info">` | `> **Info:** …` |
| `<Video id="XYZ" />` | `[Assista no YouTube](https://youtu.be/XYZ)` |
| link interno `/2026/…` ou `/en/…` | absoluto `https://vitorpereira.ia.br/…` |
| ` ```ts … ``` ` (code fence) | mantém (GFM) |
| tabelas GFM | mantêm |
| imagens `./assets/…` | absolutas `https://vitorpereira.ia.br/static/…` |

Modo **teaser**: corta no 1º `##` e anexa o rodapé CTA.
Modo **full** (`--full`): corpo inteiro transformado + rodapé "Publicado
originalmente em <canônica>".

---

## 9. Tratamento de erros

- `429` (rate limit): mensagem explicando o burst de 2/5s; sem retry automático
  agressivo (o TabNews **apaga** o conteúdo ao estourar) — no máximo 1 retry com
  espera.
- `403` conta não ativada / prestígio negativo: mensagem clara com a causa.
- `body > 20.000`: guard local **antes** de chamar a API.
- Falha de rede/login: erro tipado, sem estado parcial (não grava `tabnews:` no
  frontmatter se o POST não confirmou 201).
- Nada de erro silencioso: toda falha de escrita aborta com causa explícita.

---

## 10. Testes

- **Transform** (`to-tabnews-markdown`): unitário com **fixtures dos posts reais**
  (#2, #3) — determinístico, sem rede. Cobre: corte do teaser, cada tipo de
  Callout, Video, links internos→absolutos, guard de 20k.
- **Cliente TabNews**: mockado (sem bater na API real nos testes). Casos: 201 ok,
  429, 403, payload sem `status` (garante que enviamos `published`).
- **Orquestrador `posse`**: mock do target; garante guards (draft, idempotência).
- Gates do projeto: `pnpm typecheck` + `pnpm lint` + `pnpm test` verdes.

---

## 11. Entregáveis da fase 1

1. `lib/syndication/*`, `lib/tabnews/*`, `lib/mdx/to-tabnews-markdown.ts`.
2. `scripts/crosspost.ts` + script `pnpm crosspost` no `package.json`.
3. Slots `TABNEWS_EMAIL` / `TABNEWS_PASSWORD` no `.env.example` + `.gitignore`
   cobrindo `.syndication/`.
4. Campo `tabnews` opcional no schema do Velite + link opcional no rodapé do post.
5. Testes (transform + cliente mockado + orquestrador).
6. Sem publicar de verdade sem OK do Vitor — primeiro run é `--dry-run`.

---

## 12. Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| Cultura TabNews penaliza teaser | Teaser com valor real; `--full` disponível |
| API muda (contrato pós-leitura) | Cliente tipado isola as chamadas; erros mapeados |
| Rate limit apaga conteúdo | Guard 1-post-por-vez; sem retry agressivo |
| Token expira (30d) | Cache com checagem de expiração + re-login automático |
| Senha em disco local | Gitignored; fase 2 migra pra env server + auth |
| Frontmatter re-commit manual | Fluxo explícito: tool grava, Vitor revisa o diff e commita |
