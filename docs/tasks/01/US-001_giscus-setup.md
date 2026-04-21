# US-001: Giscus configurado contra o repo real

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Task**: `docs/tasks/01/US-001_giscus-setup.md`
> **Status**: Pendente

## Description

Como Vitor, quero que o widget de comentários Giscus carregue nos posts com `comments: true` e publique discussões no meu próprio GitHub, para ter um canal de feedback leitor-me-autor sem depender de plataforma de terceiros.

## Acceptance Criteria

- [ ] GitHub Discussions habilitado em https://github.com/vitoropereira/vitorpereira.ia.br/settings → General → Features → Discussions ✅
- [ ] Categoria `Comments` criada em https://github.com/vitoropereira/vitorpereira.ia.br/discussions (ícone de engrenagem ao lado de "Categories" → New category)
  - Name: `Comments`
  - Description: `Blog post comments powered by Giscus`
  - Format: `Announcement` (só maintainers postam topics; Giscus faz bypass pra comentários)
- [ ] 4 IDs obtidos em https://giscus.app (preencher o campo repo → a página gera os valores automaticamente):
  - `data-repo` → `vitoropereira/vitorpereira.ia.br`
  - `data-repo-id` → `R_kgDO…` (ID opaco)
  - `data-category` → `Comments`
  - `data-category-id` → `DIC_kwDO…`
- [ ] Arquivo `.env.development.local` criado na raiz do repo (gitignored automaticamente — verificar com `git check-ignore .env.development.local`):
  ```env
  NEXT_PUBLIC_SITE_URL=http://localhost:3003
  NEXT_PUBLIC_GISCUS_REPO=vitoropereira/vitorpereira.ia.br
  NEXT_PUBLIC_GISCUS_REPO_ID=<paste R_kgDO…>
  NEXT_PUBLIC_GISCUS_CATEGORY=Comments
  NEXT_PUBLIC_GISCUS_CATEGORY_ID=<paste DIC_kwDO…>
  ```
- [ ] Smoke test local:
  - [ ] `pnpm dev` sobe sem erros
  - [ ] Abrir http://localhost:3003/2026/04/21/hello-world
  - [ ] Scrollar até o fim — Giscus carrega (IntersectionObserver dispara com `rootMargin: 200px`)
  - [ ] Logar no Giscus com GitHub, postar comentário de teste "teste US-001"
  - [ ] Confirmar que o comentário aparece em https://github.com/vitoropereira/vitorpereira.ia.br/discussions como Discussion na categoria `Comments`
  - [ ] Tema do Giscus troca com o theme toggle (dark/light)
  - [ ] Deletar a Discussion de teste após validação (higiene)
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` continuam passando (nada de código precisa mudar)

## Implementation Notes

### Arquivos afetados

- `.env.development.local` (novo, gitignored) — só contém as 5 vars locais
- Nenhum arquivo de código muda — o componente já está pronto

### Código atual (referência)

`features/blog/components/GiscusComments.tsx` já consome as 4 env vars e retorna `null` quando qualquer uma está vazia. Lazy-load via IntersectionObserver. Mapping `pathname` (garante que PT e EN do mesmo post caem em discussions distintas):

```tsx
const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

// se qualquer var vazia → return null
// quando em viewport → renderiza <Giscus mapping="pathname" strict="0" ...>
```

### Dependências

- Depends on: nenhuma (primeira US do PRD)
- Blocks: US-002 (Vercel env vars em produção precisam dos mesmos IDs)

## Testing

- [ ] Manual: Giscus widget carrega no hello-world post (PT + EN)
- [ ] Manual: Comentário posta e aparece na categoria `Comments` do repo
- [ ] Manual: Tema segue o theme toggle do site
