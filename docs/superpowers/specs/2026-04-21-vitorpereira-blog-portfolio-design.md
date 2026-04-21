# Design Doc — vitorpereira.ia.br: Blog + Portfólio em Next.js

**Data:** 2026-04-21
**Autor:** Vitor Onofre Pereira (decisões) + Claude (redação)
**Status:** Aprovado no brainstorm, aguardando revisão antes do writing-plans.
**Substitui:** Portfólio em PHP vanilla arquivado na branch `legacy-php`.

## Marcador [Akita]

Decisões marcadas com **[Akita]** foram adotadas do blog `akitaonrails.com`
(Hugo + Hextra). Essa é uma regra durável: quando uma decisão de arquitetura,
UX ou convenção já foi tomada pelo Akita e faz sentido no nosso caso, usamos
a dele em vez de re-brainstormar. O marcador torna essas decisões auditáveis
— se um dia for questionada, a resposta é "foi escolha do Akita".

## 1. Contexto e objetivo

O site `vitorpereira.ia.br` hoje é um portfólio profissional simples em PHP
vanilla (roteamento por query string, Tailwind via CDN, dados em
`projects.json`, formulário de contato via WhatsApp/uazapi). Está em produção
e preservado na branch `legacy-php` do repositório como backup completo. A
branch `main` foi esvaziada em preparação para esta reescrita.

O novo site é uma reescrita completa em Next.js 15 com foco principal em
**blog técnico bilíngue** estilo `akitaonrails.com`, com portfólio profissional
e páginas institucionais como suporte. Os três cumprem papéis diferentes:

- **Blog (foco principal)** — veículo de conteúdo técnico sobre dev,
  Micro-SaaS, IA e automação. Público: devs, fundadores, clientes
  potenciais dos SaaS do Vitor.
- **Portfólio (secundário)** — vitrine dos oito projetos reais catalogados
  (três SaaS próprios, dois projetos atuais como colaborador, três passados).
- **Páginas institucionais** — home, sobre, contato. Amarram a narrativa.

O público-alvo consome conteúdo em português majoritariamente, mas tradução
para inglês está prevista desde o dia 1 (estilo Akita: PT canônico, EN como
tradução opcional por post).

## 2. Decisões herdadas do Akita

Lista explícita pra referência futura. Qualquer delas pode ser revisitada se
o Vitor quiser divergir do Akita em algum momento.

- **URL bilíngue:** PT na raiz (`/`), EN com prefixo `/en/`.
- **Estrutura de pastas de conteúdo:**
  `content/posts/YYYY/MM/DD/slug/index.mdx` + `index.en.mdx` lado a lado
  (colocation de PT, EN e assets na mesma pasta).
- **Frontmatter mínimo:** `title`, `date` (ISO 8601 com timezone `-03:00`),
  `draft`, `tags`, `description`.
- **Cover de post:** opcional, com fallback.
- **Toggle PT|EN quando tradução não existe:** desabilitado com tooltip,
  não escondido.
- **Homepage EN** mostra só posts traduzidos.
- **Listagem EN** inclui só posts com `index.en.mdx`.
- **Design visual:** minimalista "blog técnico clássico".
- **TOC no post:** lateral em desktop, colapsável em mobile.
- **Largura do conteúdo do post:** `max-w-6xl` (equivalente ao Akita).
- **Categorias especiais:** mecanismo pronto (tag vira página `/slug`), Vitor
  define quais ativar conforme produz conteúdo. Slugs iguais nos dois idiomas.
- **Sem filtro de busca client-side na listagem principal** (busca global via
  command palette ⌘K em vez disso).
- **Shortcode de vídeo** equivalente ao `{{< youtube >}}` do Akita:
  `<Video id="..." />`.
- **RSS 2.0** com full content, 20 posts mais recentes.
- **Schema.org JSON-LD** BlogPosting por post + WebSite no resto.
- **Twitter Cards** com `summary_large_image`.
- **Sem página/modal de detalhe de projeto no MVP** (ficou fora do escopo do
  Akita pois ele não tem portfólio — decisão nossa de manter minimalismo
  análogo no MVP).

## 3. Stack técnica

| Camada                 | Escolha                                            | Por quê                                                                        |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime e framework    | Next.js 15 App Router, TypeScript strict           | Stack padrão moderna, SSG/ISR nativos                                          |
| Styling                | Tailwind CSS v4 + shadcn/ui                        | Componentes copiados (não dependência), Radix primitives, dark mode pronto     |
| Conteúdo               | Velite + MDX                                       | Zod validando frontmatter, tipagem gerada automaticamente, watch rápido em dev |
| i18n                   | `next-intl` 3.x                                    | Suporta padrão "default locale sem prefixo", maduro pro App Router             |
| Dark mode              | `next-themes`                                      | Padrão do ecossistema, integra com shadcn                                      |
| Syntax highlighting    | Shiki + `rehype-pretty-code`                       | Build time (zero JS no cliente), fidelidade de cor do VS Code                  |
| Comentários            | Giscus (GitHub Discussions)                        | Grátis, sem tracking, sem ads, lazy-loaded                                     |
| Busca                  | `cmdk` (shadcn Command) + Fuse.js client-side      | Command palette ⌘K, index pequeno                                              |
| Analytics qualitativo  | Microsoft Clarity                                  | Heatmap + session recording, free ilimitado                                    |
| Analytics quantitativo | Google Analytics 4                                 | Aquisição + funnels                                                            |
| Web vitals             | Vercel Analytics                                   | Plano Hobby grátis, sem cookies, não precisa consent                           |
| Deploy                 | Vercel (Hobby tier)                                | Push-to-deploy, preview branches, ISR, OG dynamic                              |
| Testes                 | Vitest (unit), TypeScript strict, ESLint, Prettier | Typecheck e lint bloqueiam deploy via Vercel build step                        |

## 4. Arquitetura e estrutura de pastas

Organização feature-sliced:

```
vitorpereira.ia.br/
├── app/
│   ├── layout.tsx                    # root: <html>, fonts, providers
│   ├── (site)/
│   │   ├── layout.tsx                # site chrome: header, footer, theme
│   │   ├── page.tsx                  # home PT
│   │   ├── sobre/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── contato/page.tsx
│   │   ├── privacidade/page.tsx
│   │   ├── termos/page.tsx
│   │   ├── tags/[tag]/page.tsx
│   │   ├── posts/page.tsx            # listagem PT (/posts)
│   │   ├── [year]/[month]/[day]/[slug]/page.tsx  # /YYYY/MM/DD/slug (post PT)
│   │   ├── rss.xml/route.ts          # RSS PT
│   │   └── en/
│   │       ├── layout.tsx            # define locale="en" via provider
│   │       ├── page.tsx
│   │       ├── about/page.tsx
│   │       ├── portfolio/page.tsx
│   │       ├── contact/page.tsx
│   │       ├── privacy/page.tsx
│   │       ├── terms/page.tsx
│   │       ├── tags/[tag]/page.tsx
│   │       ├── posts/page.tsx        # listagem EN (/en/posts)
│   │       ├── [year]/[month]/[day]/[slug]/page.tsx  # post EN
│   │       └── rss.xml/route.ts      # RSS EN
│   ├── sitemap.ts                    # special file, app root
│   ├── robots.ts                     # special file, app root
│   └── opengraph-image.tsx           # OG default dinâmico
├── features/
│   ├── blog/
│   │   ├── components/               # PostCard, PostList, Toc, Tags…
│   │   ├── lib/                      # queries: getPostsByLocale, etc.
│   │   ├── mdx/                      # MDXComponents, Callout, Video, …
│   │   └── types.ts
│   ├── portfolio/
│   │   ├── components/               # ProjectCard, ProjectFilter
│   │   ├── data/projects.ts
│   │   └── types.ts
│   └── marketing/
│       └── components/               # Hero, Specialties, LatestPosts…
├── components/
│   ├── ui/                           # shadcn
│   ├── layout/                       # Header, Footer, LangToggle, ThemeToggle
│   ├── analytics/                    # ClarityScript, GAScript, ConsentBanner
│   ├── search/                       # CommandPalette
│   └── seo/                          # JsonLd, metadata helpers
├── lib/
│   ├── i18n/                         # config, routeMap.ts, messages/{pt,en}.json
│   ├── siteConfig.ts                 # name, url, social, featuredCategories…
│   └── utils.ts                      # cn(), formatDate()
├── content/
│   ├── posts/YYYY/MM/DD/slug/
│   │   ├── index.mdx                 # PT (canônico)
│   │   ├── index.en.mdx              # EN (opcional)
│   │   └── assets/*.jpg
│   └── pages/                        # MDX das páginas institucionais
├── public/
│   ├── og-default.png
│   ├── favicon/
│   └── images/projects/              # covers dos projetos
├── docs/superpowers/specs/           # este doc
├── tests/                            # Vitest
├── middleware.ts                     # next-intl locale detection
├── velite.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json                     # strict, path aliases
├── vitest.config.ts
└── package.json
```

**Aliases TS:** `@/features/...`, `@/components/...`, `@/lib/...`,
`@/content` (gerado pelo Velite). Nenhum código de feature importa de outra
feature diretamente; compartilhamento passa por `components/` ou `lib/`.

## 5. Pipeline de conteúdo (Velite + MDX)

### 5.1 Schema Zod dos posts

```ts
posts: {
  slug: string,                      // derivado da pasta YYYY/MM/DD/slug
  locale: "pt" | "en",               // derivado do nome do arquivo
  title: string,                     // obrigatório
  description: string,               // obrigatório — usado em meta e excerpt fallback
  date: Date,                        // ISO 8601 com timezone -03:00
  updated?: Date,
  draft: boolean (default false),
  tags: string[] (default []),
  cover?: Image,                     // path relativo, vira URL otimizada
  comments: boolean (default false), // opt-in pra Giscus
  readingTime: number,               // calculado (200 wpm)
  excerpt: string,                   // calculado, 160 chars
  body: { code, toc, headings[] },
  translationSlug?: string,          // ponte PT ↔ EN
  permalink: string                  // /YYYY/MM/DD/slug/ (ou com /en/)
}
```

### 5.2 Convenção de idioma

- `index.mdx` → `locale: "pt"`
- `index.en.mdx` → `locale: "en"`
- Dois irmãos com mesma pasta compartilham `slug` e automaticamente recebem
  `translationSlug` um apontando pro outro.
- Post EN sem irmão PT é permitido mas incomum; PT sem irmão EN é o default.

### 5.3 Plugins de processamento

- **Remark:** `remark-gfm`
- **Rehype:** `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code` com
  Shiki. Temas claro e escuro sincronizados com `next-themes`.

### 5.4 Componentes MDX customizados

Registrados em `features/blog/mdx/MDXComponents.tsx`, expostos globalmente no
renderizador MDX:

| Componente                                               | Uso                                          | Notas                            |
| -------------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| `<Callout type="info\|warn\|success\|note">`             | Caixa destacada                              |                                  |
| `<Video id="..." />`                                     | YouTube embed 16:9 responsivo                | [Akita]                          |
| `<Tweet id="..." />`                                     | Embed via `react-tweet`                      |                                  |
| `<Image />`                                              | Wrapper de `next/image` com blur placeholder |                                  |
| `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` | shadcn Tabs                                  | Multi-linguagem no código, p.ex. |

Blocos de código suportam sintaxe estendida via rehype-pretty-code:
` ```ts title="foo.ts" {2,5-7} showLineNumbers `

### 5.5 Assets do post

Colocation estilo Akita:

```
content/posts/2026/04/20/agentes-llm/
├── index.mdx
├── index.en.mdx
└── assets/
    ├── cover.jpg
    └── diagrama-fluxo.png
```

Referências relativas (`./assets/cover.jpg`) resolvem para URLs otimizadas.
`next/image` aplica blur placeholder automaticamente.

### 5.6 Queries expostas

Em `features/blog/lib/queries.ts` (server-only, build-time):

- `getPostsByLocale(locale, { limit?, tag?, category?, includeDrafts? })`
- `getPostBySlug(locale, slug)`
- `getAllTags(locale)`
- `getRelatedPosts(post, n)` — ordena por overlap de tags, desempata por
  data, completa com mais recentes se houver menos que `n`.

### 5.7 Regras de exibição bilíngue

- **Listagem PT** (`/posts`): todos os posts PT não-draft.
- **Listagem EN** (`/en/posts`): só posts com `index.en.mdx` não-draft.
- **Homepage EN**: últimos 20 posts traduzidos.
- **Homepage PT**: últimos 20 posts PT.
- **Sem rolling window** tipo 2-year cutoff do Akita (ele faz isso pra
  otimizar dev em Hugo; Next.js não precisa).

### 5.8 Drafts

- `draft: true` → post fica fora de produção (listagens, tags, RSS, sitemap,
  homepage).
- Em dev (`next dev`), drafts aparecem com badge amarelo "DRAFT" no card e no
  topo do post individual.
- Filtro baseado em `process.env.NODE_ENV`.

## 6. Rotas, i18n e layouts

### 6.1 Biblioteca

`next-intl` 3.x. Configuração:

- `defaultLocale: "pt"` (sem prefixo)
- `locales: ["pt", "en"]`
- `localePrefix: "as-needed"` (PT sem prefixo, EN com `/en/`)

### 6.2 Tabela de URLs

| Rota            | PT                                   | EN                     |
| --------------- | ------------------------------------ | ---------------------- |
| Home            | `/`                                  | `/en/`                 |
| Sobre           | `/sobre`                             | `/en/about`            |
| Portfólio       | `/portfolio`                         | `/en/portfolio`        |
| Contato         | `/contato`                           | `/en/contact`          |
| Privacidade     | `/privacidade`                       | `/en/privacy`          |
| Termos          | `/termos`                            | `/en/terms`            |
| Listagem posts  | `/posts`                             | `/en/posts`            |
| Post individual | `/YYYY/MM/DD/slug/`                  | `/en/YYYY/MM/DD/slug/` |
| Tag             | `/tags/{tag}`                        | `/en/tags/{tag}`       |
| Categoria       | `/{slug}`                            | `/en/{slug}`           |
| RSS             | `/rss.xml`                           | `/en/rss.xml`          |
| Sitemap         | `/sitemap.xml` (único, com hreflang) |

Slugs de páginas institucionais traduzidos (SEO melhor). Slugs de posts e
tags iguais nos dois idiomas (consistência com Akita e simplicidade).

### 6.3 Middleware

`middleware.ts` na raiz:

- Detecta idioma na primeira visita via `Accept-Language` + cookie
  `NEXT_LOCALE`.
- Redirecionamento `307` de `/` para `/en/` quando locale preferido é EN.
- Respeita cookie (não redireciona de novo).
- Matcher exclui `/_next/*`, imagens, APIs.

### 6.4 Layouts

- **Root layout** (`app/layout.tsx`): `<html lang>` dinâmico, fonts via
  `next/font`, providers globais (`ThemeProvider`, `NextIntlClientProvider`),
  `<Analytics />` e `<SpeedInsights />` da Vercel.
- **Site layout** (`app/(site)/layout.tsx`): Header, Footer, consent banner
  mount.
- **EN layout** (`app/(site)/en/layout.tsx`): apenas define locale="en" via
  provider; estrutura visual idêntica ao PT.

### 6.5 LangToggle

- Lê `pathname` e locale atual.
- Calcula URL equivalente no outro idioma:
  - **Post:** usa `translationSlug` do Velite. Se não existir,
    **botão desabilitado com tooltip** "Tradução não disponível" [Akita].
  - **Página institucional:** mapeia via `lib/i18n/routeMap.ts` (`/sobre` ↔
    `/en/about`).
- Clicar atualiza cookie `NEXT_LOCALE`.
- Acessível: `aria-label`, indica idioma atual.

### 6.6 Mensagens de UI

`lib/i18n/messages/pt.json` e `en.json`. Strings de navegação, labels,
rodapé, mensagens do sistema (ex: "Tradução não disponível"). Conteúdo
editorial **não** passa por aqui — vai direto no MDX.

## 7. Blog — features e componentes

### 7.1 Listagem (`/posts`, `/en/posts`)

- Título grande
- Lista de `PostCard` em ordem de data descrescente
- Paginação numerada, 20 posts por página, `?page=N`
- **Sem filtro de busca inline** [Akita] — busca vive no command palette
- Drafts não aparecem em produção

### 7.2 `PostCard`

- Cover (se existir) lateral em desktop, topo em mobile
- Título (link)
- Data locale-aware
- Reading time
- Excerpt (description do frontmatter, fallback pros primeiros 160 chars)
- Tags (até 3, "+N" se houver mais)

### 7.3 Post individual

- Container centralizado `max-w-6xl` [Akita]
- Cover no topo com blur placeholder (se existir)
- Metadados: data, reading time, tags
- **TOC** [Akita]: sidebar em desktop (sticky, scrollspy), colapsável em mobile
- Conteúdo MDX renderizado
- **Giscus no final** se `comments: true` no frontmatter (opt-in). Lazy-load
  via Intersection Observer.
- **Posts relacionados** (3): overlap de tags, desempate por data, preenche
  com mais recentes.
- LangToggle habilitado se tradução existir.

### 7.4 Página de tag (`/tags/[tag]`, `/en/tags/[tag]`)

- Título: "Posts com a tag `{tag}`" (PT) / "Posts tagged `{tag}`" (EN)
- Lista paginada (mesma paginação que listagem principal)

### 7.5 Categorias especiais

Mecanismo pronto; ativação via `featuredCategories: []` em
`lib/siteConfig.ts`. Cada categoria mapeia uma tag para uma URL top-level
(`/saas`, `/ia`, etc.). Vitor define quais habilitar conforme produz
conteúdo — o MVP entra com a lista vazia.

**Nota de implementação:** como o App Router não permite catch-all
dinâmico conflitando com as rotas institucionais, cada categoria ativada
precisa de uma rota explícita: `app/(site)/{category}/page.tsx` (PT) e
`app/(site)/en/{category}/page.tsx` (EN). Cada arquivo é uma stub que
delega a um `CategoryPageRenderer` compartilhado em
`features/blog/components/`. Documentação e template desse fluxo fazem parte
da entrega do pipeline de conteúdo (passo do plano).

### 7.6 Command palette (⌘K / `/`)

- Componente `CommandPalette` usando shadcn `Command` (baseado em `cmdk`)
- Atalho global: `⌘K` (macOS) / `Ctrl+K` (Windows/Linux) ou `/`
- Index client-side via Fuse.js (nome, descrição, tags, slug dos posts do
  locale atual)
- Index gerado em build time, incluído no primeiro carregamento (~20-40KB)
- Resultados mostram: título, data, tags; Enter navega ao post.

### 7.7 Drafts em dev

- Aparecem com badge amarelo em listagens e topo do post.
- Em produção: invisíveis.

## 8. Portfólio e páginas institucionais

### 8.1 Schema dos projetos

`features/portfolio/types.ts`:

```ts
type Project = {
  id: string;
  title: string;
  excerpt: { pt: string; en: string };
  description: { pt: string; en: string };
  category: ProjectCategory;
  technologies: string[];
  year: string;
  status: "completed" | "ongoing" | "mvp";
  featured: boolean;
  client: string | null;
  url: string | null;
  results: { pt: string[]; en: string[] };
  cover: string | null; // relativo a /public/images/projects/
};

type ProjectCategory =
  | "web"
  | "mobile"
  | "ai"
  | "automation"
  | "analytics"
  | "saas"
  | "education"
  | "fintech"
  | "business";
```

### 8.2 Projetos a migrar

Do `IMPROVEMENT_PLAN.md` da branch `legacy-php`:

1. **DataClarity IA** (próprio, MVP) — https://dataclarityia.com.br
2. **Insight Video IA** (próprio, ongoing) — https://insightvideoia.com.br
3. **Calvino** (próprio, ongoing) — https://calvino.com.br
4. **My Group Metrics** (atual, ongoing) — https://mygroupmetrics.com
5. **Micro-SaaS Brasil** (atual, ongoing) — https://microsaas.com.br
6. **4trip** (passado, completed) — https://4trip.com.br
7. **AjudaJá** (passado, completed) — https://ajudaja.com.br
8. **SGCM** (passado, completed, cliente I.V.Tecnologias) — https://sgcm.com.br

EN dos projetos começa como cópia placeholder escrita por Claude baseada no
PT; Vitor revisa conforme tempo.

### 8.3 Home (`/` e `/en/`)

Seções:

1. Hero — nome, título, tagline
2. Especialidades (3-4 cards com ícones: AI, Automation, Web/SaaS, …)
3. Projetos em destaque (`featured: true`, até 4 em grid)
4. Últimos posts do blog (3-5 mais recentes, linka `/posts`)
5. Links de redes sociais
6. CTA de contato

### 8.4 Sobre (`/sobre` e `/en/about`)

- Escrita em MDX (`content/pages/sobre.mdx` + `sobre.en.mdx`)
- Conteúdo inicial migrado do `pages/about.php` da branch `legacy-php`, com
  cópia em inglês escrita por Claude baseada no PT.

### 8.5 Portfólio (`/portfolio` e `/en/portfolio`)

- Grid de `ProjectCard`
- Filtro por categoria (shadcn `ToggleGroup`)
- Filtro por status ("Atuais", "Passados", "Todos")
- Ordenação default: featured primeiro + mais recentes
- **`ProjectCard`:** cover, título, ano, status badge, excerpt, tecnologias,
  link externo pro URL do projeto.
- **Sem página/modal de detalhe no MVP** — quem quer ver mais clica no link
  externo.

### 8.6 Contato (`/contato` e `/en/contact`)

- Página simples com cards de links pras 6 redes sociais
- Sem formulário, sem email, sem WhatsApp
- Copy: "Sou mais ativo nessas redes —"

### 8.7 `lib/siteConfig.ts`

Fonte única de verdade:

```ts
{
  name: "Vitor Pereira",
  url: "https://vitorpereira.ia.br",
  tagline: {
    pt: "Dev full-stack com 10+ anos de experiência construindo SaaS, automação e produtos com IA.",
    en: "Full-stack dev with 10+ years building SaaS, automation, and AI products.",
  },
  author: {
    name: "Vitor Onofre Pereira",
    url: "https://vitorpereira.ia.br/sobre",
  },
  social: {
    linkedin: "https://www.linkedin.com/in/vitor-onofre-pereira/",
    github: "https://github.com/vitoropereira",
    instagram: "https://www.instagram.com/vitorpereirasaas/",
    x: "https://x.com/VITORONOFRE",
    youtube: "https://www.youtube.com/@vitoropereira",
    tabnews: "https://www.tabnews.com.br/vitorpereirasaas",
  },
  featuredCategories: [] as string[],
  defaultLocale: "pt",
  locales: ["pt", "en"] as const,
  postsPerPage: 20,
}
```

## 9. SEO

### 9.1 Metadata API (Next.js 15)

Cada página exporta `generateMetadata()` ou `metadata`. Tags geradas:

- `<title>` no padrão `{pageTitle} — {siteName}`
- `<meta description>`
- Canonical por página, no idioma correto
- Open Graph (title, description, image, url, type, locale)
- Twitter Cards (`summary_large_image`, `site=@VITORONOFRE`, `creator`)
- `<link rel="alternate" hreflang>` para PT, EN, e `x-default`=PT
- Favicons

### 9.2 Open Graph images

- Post com cover → usa a cover (redimensionada 1200x630)
- Post sem cover → `app/opengraph-image.tsx` gera dinamicamente (título +
  data sobre fundo padrão) via `ImageResponse`
- Páginas institucionais → OG gerada dinamicamente com nome da página, ou
  estática em `public/og-default.png` como fallback

### 9.3 Schema.org JSON-LD [Akita]

Componente `<JsonLd>` em `components/seo/`:

| Tipo de página | Schema                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Post           | `BlogPosting` (headline, author, datePublished, dateModified, image, publisher, mainEntityOfPage, inLanguage) |
| Home / resto   | `WebSite` (name, url, potentialAction=SearchAction, inLanguage)                                               |
| Sobre          | `WebSite` + `Person` (author com `sameAs` pras 6 redes sociais)                                               |

Autor = publisher (blog pessoal).

### 9.4 RSS [Akita]

- `/rss.xml` (PT) e `/en/rss.xml` (EN)
- RSS 2.0, 20 posts mais recentes, full content
- Route handlers em `app/(site)/rss.xml/route.ts` e
  `app/(site)/en/rss.xml/route.ts`
- `<link rel="alternate" type="application/rss+xml">` no `<head>` pra
  discovery

### 9.5 Sitemap

- `app/sitemap.ts` — único XML com todas as URLs dos dois idiomas
- Cada URL emite `<xhtml:link rel="alternate" hreflang>` apontando a versão
  no outro idioma
- Tags, categorias, e páginas institucionais incluídas

### 9.6 robots.txt

- `app/robots.ts`
- Allow all em produção
- **Disallow all** quando `NODE_ENV !== "production"` ou `VERCEL_ENV !==
"production"` — bloqueia indexação de previews da Vercel

### 9.7 Performance

- SSG por default → LCP rápido
- `next/font` → zero CLS
- `next/image` → lazy, otimizado, blur placeholder
- Shiki build time → zero hydration de JS de highlight
- Giscus lazy via Intersection Observer
- Consent banner não bloqueia render inicial

## 10. Analytics e LGPD

### 10.1 Ferramentas

| Ferramenta         | Papel                            | Consent obrigatório |
| ------------------ | -------------------------------- | ------------------- |
| Vercel Analytics   | Web Vitals, page views agregadas | Não (sem cookies)   |
| Microsoft Clarity  | Heatmap, session recording       | **Sim**             |
| Google Analytics 4 | Aquisição, funnels               | **Sim**             |

Vercel Analytics sempre ligado. Clarity e GA4 carregam **apenas após
consentimento explícito**.

### 10.2 Consent banner

- Fixo no rodapé da primeira visita
- **Dois botões:** "Aceitar" e "Recusar"
- **Aceitar** → cookie `consent=accepted` (1 ano) → Clarity e GA4 carregam
- **Recusar** → cookie `consent=rejected` (1 ano) → Clarity e GA4 não carregam
- Após clique, banner some permanentemente (até cookie expirar ou ser limpo)
- **Link "Gerenciar cookies" no rodapé** do site sempre visível — permite
  reabrir e trocar decisão
- Link pra `/privacidade` no banner
- Texto PT: "Usamos cookies pra entender como o site é usado e melhorar sua
  experiência. Você pode aceitar ou recusar."
- Texto EN equivalente

### 10.3 Implementação

- `components/analytics/ConsentBanner.tsx` — UI
- `components/analytics/ClarityScript.tsx` — checa cookie, injeta script via
  `next/script` com `strategy="afterInteractive"` só se aceito
- `components/analytics/GAScript.tsx` — idem
- `lib/consent.ts` — helpers de leitura e escrita do cookie

### 10.4 Políticas legais

- `/privacidade` e `/en/privacy` — política gerada por Claude baseada em
  padrões LGPD/GDPR comuns
- `/termos` e `/en/terms` — termos de uso gerados por Claude
- Ambas em MDX pra Vitor editar fácil
- Advogado revisa quando Vitor puder — não bloqueia o deploy inicial

## 11. Deploy

### 11.1 Vercel (Hobby tier)

- Projeto conectado ao repo GitHub `vitorpereira.ia.br` (branch `main`)
- Push em `main` → deploy produção automático
- PRs → deploy de preview com URL `vitorpereira-ia-br-git-<branch>.vercel.app`
  (bloqueadas por `robots.txt`)
- Build: `velite build && next build`
- Install: `pnpm install` (prefere pnpm; npm/yarn funcionam também)

### 11.2 Variáveis de ambiente

| Variável                         | Escopo               | Pra que               |
| -------------------------------- | -------------------- | --------------------- |
| `NEXT_PUBLIC_SITE_URL`           | Production + Preview | Canonical URLs, OG    |
| `NEXT_PUBLIC_GA_ID`              | Production           | Google Analytics 4 ID |
| `NEXT_PUBLIC_CLARITY_ID`         | Production           | Microsoft Clarity ID  |
| `NEXT_PUBLIC_GISCUS_REPO`        | Production           | Repositório do Giscus |
| `NEXT_PUBLIC_GISCUS_REPO_ID`     | Production           |                       |
| `NEXT_PUBLIC_GISCUS_CATEGORY`    | Production           | Categoria "Comments"  |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | Production           |                       |

Todas `NEXT_PUBLIC_` porque são consumidas no client. Valores são públicos
por natureza.

### 11.3 Migração de domínio

1. Deploy inicial em URL Vercel provisória (`*.vercel.app` ou
   `novo.vitorpereira.ia.br`)
2. Testes completos, ajustes
3. Aprovação explícita do Vitor
4. DNS do domínio apontando pra Vercel
5. Site PHP antigo pode ser desligado (branch `legacy-php` continua como
   arquivo)

### 11.4 Giscus setup

- Repositório: `vitorpereira.ia.br` (mesmo do site)
- Discussions habilitado, categoria dedicada "Comments" (renomeação da
  "Announcements" padrão)
- IDs obtidos via https://giscus.app, salvos nas env vars

## 12. Qualidade de código

- TypeScript `strict: true`
- ESLint com `next/core-web-vitals`
- Prettier + `prettier-plugin-tailwindcss`
- Vitest pra testes unit
- Scripts em `package.json`:
  - `dev`
  - `build` — `velite build && next build`
  - `lint`
  - `typecheck` — `tsc --noEmit`
  - `format`
  - `test`
- Build da Vercel executa `build` — falha em typecheck ou lint bloqueia
  deploy.

### 12.1 Escopo de testes no MVP

- **Unit:** queries do blog (`getPostsByLocale`, `getAllTags`,
  `getRelatedPosts`) — garantem filtro de drafts, ordering, resolução de
  locale
- **Sem component/e2e no MVP** — adicionar conforme necessidade

## 13. Pendências herdadas do PHP

- **Senha FTP comprometida:** `.vscode/sftp.json` está no histórico git da
  branch `legacy-php`. Ação urgente: **Vitor troca a senha FTP no servidor
  antigo**. Quando o domínio migrar pra Vercel, o FTP sai de cena
  naturalmente, mas a senha precisa ser trocada antes.

## 14. Fora do escopo do MVP (YAGNI explícito)

Registro pra não haver surpresa:

- Página/modal de detalhe de projeto individual (`/portfolio/[slug]`)
- Formulário de contato com email/Resend
- WhatsApp/uazapi (removido)
- Newsletter
- CMS headless (MDX em arquivos basta)
- Página dedicada `/busca` (command palette cobre)
- Testes de componente e e2e
- Internacionalização pra idiomas além de PT/EN
- Monorepo (ficamos em single app)
- Admin panel
- PostHog ou outros analytics além dos três escolhidos

## 15. Critérios de sucesso do MVP

1. ✅ Site faz build e deploy na Vercel sem erros.
2. ✅ Home, listagem de posts, post individual, sobre, portfólio, contato,
   políticas legais funcionam em PT e EN.
3. ✅ Toggle PT|EN funciona, desabilita quando tradução não existe.
4. ✅ Pelo menos 1 post de exemplo renderiza corretamente nos dois idiomas
   com TOC, syntax highlighting, Giscus (se `comments: true`), related posts.
5. ✅ Dark mode funciona (persistência, transição).
6. ✅ RSS, sitemap, robots, Schema.org, OG, Twitter Cards — todos validam
   em validators públicos (Google Rich Results Test, Twitter Card Validator,
   W3C Feed Validator).
7. ✅ Consent banner aparece na primeira visita; Clarity e GA4 só carregam
   após aceite; Vercel Analytics sempre ativo.
8. ✅ Command palette abre com ⌘K e encontra posts.
9. ✅ Drafts visíveis em dev, invisíveis em produção.
10. ✅ Lighthouse Performance ≥90, SEO ≥95, Accessibility ≥90 nas páginas
    principais.
11. ✅ Domínio `vitorpereira.ia.br` apontado pra Vercel após aprovação
    explícita do Vitor.

## 16. Próximos passos

1. Vitor revisa este doc. Mudanças são feitas aqui antes de avançar.
2. Após aprovação, Claude invoca `superpowers:writing-plans` pra gerar plano
   de implementação detalhado (tasks, ordem, dependências, critérios de
   aceite por task).
3. Execução via `subagent-driven-development` ou manual, fase a fase.
