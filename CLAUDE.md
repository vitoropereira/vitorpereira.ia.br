# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Blog e portfólio pessoal do Vitor Pereira. Next.js 16 (App Router, Turbopack),
React 19, TypeScript strict, Tailwind v4, conteúdo em MDX via Velite, bilíngue
PT/EN, deploy na Vercel.

> Este arquivo é versionado e sobrevive ao clone. O `.claude/` é gitignored —
> o que estiver lá só existe na máquina de quem escreveu.

## Comandos

```bash
pnpm dev            # velite build (predev) + velite watch + next dev → localhost:3000
pnpm build          # velite build && next build
pnpm test           # vitest run — suíte inteira
pnpm test:watch     # vitest em watch
pnpm typecheck      # tsc --noEmit (strict)
pnpm lint           # eslint (next/core-web-vitals)
pnpm format:check   # prettier
```

Um arquivo de teste só: `pnpm vitest run lib/mdx/transforms.test.ts`.
Um teste só, pelo nome: `pnpm vitest run -t "nome do caso"`.

Antes de commitar, o mínimo é `pnpm lint && pnpm typecheck && pnpm test` — é o
que o CI roda.

**Só pnpm.** O `preinstall` aborta npm e yarn (`only-allow`), porque um
`package-lock.json` competiria com o `pnpm-lock.yaml`.

### CLIs de autoria (locais, nunca na Vercel)

```bash
pnpm new:post "Título"       # scaffold do post como draft
pnpm translate <post-dir>    # gera o irmão .en.mdx — precisa de ANTHROPIC_API_KEY
pnpm gen:cover --post <dir>  # capa a partir de cover.prompt.txt — precisa de GOOGLE_API_KEY
pnpm crosspost <post-dir>    # sindica no TabNews
pnpm crosspost:stats         # métricas da sindicação
```

## Arquitetura

### O pipeline de conteúdo é a peça central

O Velite lê `content/` e escreve `.velite/`, que o TypeScript expõe como
`@/content` (alias no `tsconfig.json` **e** no `vitest.config.ts`). Nada que
consome post compila antes de o Velite rodar — por isso `predev` e `build`
encadeiam `velite build`.

O Velite **não compila o MDX**: ele guarda o corpo cru como string em `body`, e
o `next-mdx-remote` renderiza em request time (`lib/mdx/`). Mudança em
componente de MDX é mudança de runtime, não de build de conteúdo.

Frontmatter e schema vivem em `velite.config.ts`. Campos derivados (`slug`,
`permalink`, `locale`, `readingTime`, `excerpt`, `translationSlug`) são
calculados lá no `transform`/`prepare`, **não** no frontmatter.

### O caminho do arquivo é que define a URL do post

```
content/posts/2026/04/21/meu-post/index.mdx      → /2026/04/21/meu-post
content/posts/2026/04/21/meu-post/index.en.mdx   → /en/2026/04/21/meu-post
```

O par PT/EN se encontra pelo `slug` no `prepare` do Velite, que preenche
`translationSlug` dos dois lados. Renomear a pasta muda a URL e quebra o par.

### Bilíngue é por diretório físico, não por `[locale]`

Não existe segmento dinâmico de locale. PT mora na raiz de `app/(site)/`, EN
mora em `app/(site)/en/`, e os segmentos são **traduzidos** (`/sobre` ↔
`/en/about`, `/servicos/agente-operacional` ↔ `/en/services/operational-ai-agent`).

O de-para é `lib/i18n/routeMap.ts`, e o seletor de idioma depende dele. Criar
página institucional nova = três passos: a rota PT, a rota EN e a entrada no
`routeMap`. Esquecer o `routeMap` deixa o botão de idioma levando pra lugar
errado, sem erro de build.

O `middleware.ts` só decide o idioma **na primeira visita a `/`** (cookie
`NEXT_LOCALE`, senão `Accept-Language`). Ele não reescreve prefixo de locale em
nenhuma outra rota.

### Visibilidade de post tem dois eixos independentes

`features/blog/lib/visibility.ts` é a fonte única. Um post some por `draft:
true` (não terminou) **ou** por data no futuro (agendado). Os dois aparecem em
dev e somem em produção.

Filtrar `!draft` na mão é o erro clássico: o post agendado vaza pro ar antes da
data. Toda consulta passa por `isPublic` / `previewEnabled`.

### Onde o código mora

| Pasta                                                          | Papel                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `app/(site)/`                                                  | rotas da página pública, PT na raiz e EN em `en/`                                |
| `app/api/`, `app/og/`, `app/card/`, `app/qr/`, `app/llms.txt/` | route handlers e assets gerados                                                  |
| `features/<domínio>/`                                          | blog, portfolio, marketing, card — componentes, dados e regras do domínio        |
| `components/`                                                  | UI compartilhada (`ui/` é shadcn sobre `@base-ui/react`), layout, SEO, analytics |
| `lib/`                                                         | i18n, MDX, analytics, consent, siteConfig                                        |
| `scripts/`                                                     | CLIs de autoria                                                                  |
| `content/`                                                     | fonte MDX de posts e páginas                                                     |

Regra prática: se é específico de um domínio, vai em `features/`; se três telas
diferentes usam, vai em `components/` ou `lib/`.

### O agendamento tem uma metade fora do repo

`features/booking/services.ts` declara os serviços agendáveis, e cada `slug`
vira ao mesmo tempo uma rota `/agendar/<slug>` e o `calSlug` de um event type
no Cal.com. A rota o repo garante; o event type não — ele vive na conta do
Cal.com.

Serviço novo no catálogo sem event type correspondente publica uma página com
calendário morto, sem erro de build. `pnpm cal:setup` fecha isso: compara
catálogo e Cal.com, cria o que falta com `--apply` e relata divergência de
duração ou event type oculto, que ele não corrige sozinho.

### Analytics tem duas travas, não uma

Clarity e GA4 só carregam com a env var preenchida **e** o cookie de consent
aceito. Qualquer uma das duas desligada = script nenhum. Vercel Analytics e
Speed Insights são sempre-ligados. O consent é LGPD, mexer aí é decisão de
produto, não de código.

`/api/track` registra clique first-party no Supabase; sem as chaves ele ainda
redireciona certo, só não loga.

## Gotchas

- **Os CLIs em `scripts/` rodam no type-stripping do Node**, não em bundler.
  Import de arquivo local precisa da extensão `.ts` explícita
  (`../lib/mdx/load-post.ts`). Sem ela o Node não resolve. Pelo mesmo motivo,
  nada de `enum`, `namespace` ou parameter property no grafo desses arquivos.
- **`.velite/` é gerado.** Não edite, não commite. Se `@/content` "não existe",
  falta rodar `velite build`.
- **Traduzir post publicado vai ao ar no merge.** O `.en.mdx` não tem estado de
  rascunho próprio: se o post PT já está público, o irmão EN entra junto.
- **`ANTHROPIC_API_KEY` não está em lugar nenhum do repo** — nem no
  `.env.example`, nem no `.env.development.local`. O `pnpm translate` a exige e
  aborta sem ela; quem for traduzir precisa trazer a própria chave.
- **Chave de CLI não vai pra Vercel.** `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`,
  `TABNEWS_*` e `SUPABASE_TOKEN` são de uso local. Só as `NEXT_PUBLIC_*` e a
  `SUPABASE_SERVICE_ROLE_KEY` existem no deploy.
- **Squash merge faz branch mergeada parecer pendente** no `git branch --merged`.
  Confira pelo PR, não pelo git local.

## Convenções

- Comentário de código em pt-BR, explicando **por que** — o que o código faz já
  está no código. Nome de símbolo e string de UI seguem o idioma do contexto.
- Teste ao lado do arquivo (`foo.ts` + `foo.test.ts`), Vitest com jsdom.
  Query e biblioteca seguem TDD; componente puro de UI pode ser verificado na
  tela.
- Commit em conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, ...),
  descrição em pt-BR.
- Sempre branch + PR, nunca push direto na `main`. Um escopo por PR.

## Docs

- Spec: `docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
- Planos da migração (histórico): `docs/superpowers/plans/`
- Fila editorial: `docs/blog/backlog.md`
- Env vars: `.env.example`
