# US-002: Vercel bootstrap (link + env vars)

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Task**: `docs/tasks/01/US-002_vercel-bootstrap.md`
> **Status**: Concluída (via dashboard — sem CLI)

## Description

Como Vitor, quero o projeto conectado na Vercel com todas as env vars de produção preenchidas, para que deploys automáticos funcionem em cada push na branch `main` e previews nas PRs.

## Acceptance Criteria

- [ ] Vercel CLI instalado globalmente: `pnpm add -g vercel` (ou via `npx vercel` em cada comando)
- [ ] `vercel login` autenticado (browser flow)
- [ ] `vercel link` executado a partir da raiz do repo:
  - Set up project? **Yes**
  - Scope: conta pessoal do Vitor
  - Existing project? **No, create new**
  - Name: `vitorpereira-ia-br`
  - Framework preset: **Next.js** (auto-detect espera)
  - Root directory: `./`
  - Want to modify settings? **No**
- [ ] `.vercel/` criada localmente (já gitignored — confirmar com `cat .gitignore | grep vercel`)
- [ ] 7 env vars em scope `production` via `vercel env add <NAME> production`:
  ```
  NEXT_PUBLIC_SITE_URL=https://vitorpereira.ia.br
  NEXT_PUBLIC_GA_ID=<G-XXXXXXXXXX>                    # da conta GA4 do Vitor
  NEXT_PUBLIC_CLARITY_ID=<10-char alphanumeric>       # da conta Clarity do Vitor
  NEXT_PUBLIC_GISCUS_REPO=vitoropereira/vitorpereira.ia.br
  NEXT_PUBLIC_GISCUS_REPO_ID=<R_kgDO…>                # da US-001
  NEXT_PUBLIC_GISCUS_CATEGORY=Comments
  NEXT_PUBLIC_GISCUS_CATEGORY_ID=<DIC_kwDO…>          # da US-001
  ```
- [ ] Mesmas 7 vars em scope `preview` (troca apenas `NEXT_PUBLIC_SITE_URL=https://vitorpereira-ia-br.vercel.app`; resto idêntico ao production)
- [ ] `vercel env ls` lista todas as 14 entries (7 prod + 7 preview)
- [ ] `.vercel/project.json` presente e válido (não fazer commit — é gitignored)

## Implementation Notes

### Arquivos afetados

- `.vercel/` (criado automaticamente pela CLI, gitignored)
- Nenhum commit esperado — é setup remoto

### Código atual (referência)

As 7 env vars já estão documentadas em `.env.example`:

```env
NEXT_PUBLIC_SITE_URL=https://vitorpereira.ia.br
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_GISCUS_REPO=
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=
NEXT_PUBLIC_GISCUS_CATEGORY_ID=
```

O código que consome:

- `components/analytics/GAScript.tsx` → `NEXT_PUBLIC_GA_ID` (+ dupla gate com cookie `consent=accepted`)
- `components/analytics/ClarityScript.tsx` → `NEXT_PUBLIC_CLARITY_ID` (+ consent gate)
- `features/blog/components/GiscusComments.tsx` → as 4 `NEXT_PUBLIC_GISCUS_*`
- `lib/siteConfig.ts` + `app/sitemap.ts` + `app/robots.ts` → `NEXT_PUBLIC_SITE_URL`

### Notas operacionais

- **Comando interativo**: cada `vercel env add` pergunta o valor no prompt. Pode também usar stdin: `echo "valor" | vercel env add NAME production`.
- **IDs públicos**: todas são `NEXT_PUBLIC_*` por design — seguro ter nas env vars sem encryption especial.
- **Preview vs production**: `robots.ts` já retorna `Disallow: /` quando `VERCEL_ENV !== "production"`, então previews não indexam mesmo compartilhando os mesmos Giscus IDs.

### Dependências

- Depends on: US-001 (precisa dos 4 Giscus IDs)
- Blocks: US-003 (deploy exige env vars no lugar)

## Testing

- [ ] `vercel env ls` lista as 14 entries esperadas
- [ ] `vercel env pull .env.vercel.local` (comando opcional, debug) produz um arquivo com todas as vars preenchidas
