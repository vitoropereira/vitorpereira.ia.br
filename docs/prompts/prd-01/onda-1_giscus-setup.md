# Onda 1 — Giscus setup

> **1 agent** | ~10-15 min
> **Pre-requisito**: Nenhum (primeira onda do PRD 01)

---

## Agent 1 — US-001: Giscus configurado contra o repo real

```
Implementar US-001 do PRD 01. Ler o task file `docs/tasks/01/US-001_giscus-setup.md` para contexto completo.

Resumo do que fazer:
1. Guiar o Vitor para habilitar GitHub Discussions no repo (github.com/vitoropereira/vitorpereira.ia.br/settings) e criar a categoria "Comments" com format "Announcement".
2. Guiar o Vitor em https://giscus.app para obter os 4 IDs (data-repo, data-repo-id, data-category, data-category-id). NÃO especular os valores — esperar o Vitor colar no chat.
3. Criar o arquivo `.env.development.local` na raiz com os 4 IDs + NEXT_PUBLIC_SITE_URL=http://localhost:3003. Confirmar que está gitignored: rodar `git check-ignore .env.development.local` — deve retornar o próprio path.
4. Rodar `pnpm dev` (use run_in_background) e pedir ao Vitor para abrir http://localhost:3003/2026/04/21/hello-world, scrollar ao fim, verificar que Giscus carrega, postar um comentário de teste e confirmar que aparece em https://github.com/vitoropereira/vitorpereira.ia.br/discussions.
5. Após validado, pedir para o Vitor deletar a Discussion de teste (higiene). Matar o dev server.
6. NÃO tocar em código — o componente `features/blog/components/GiscusComments.tsx` já consome as env vars. Se o widget não carregar, é problema de config, não de código.

Arquivos que você pode modificar:
- `.env.development.local` (criar — gitignored)
- `docs/prd/INDEX.md` (marcar US-001 como Concluída ao final, atualizar progresso PRD 01 para 1/5)

NÃO alterar:
- `features/blog/components/GiscusComments.tsx` (já funciona com env vars)
- Qualquer arquivo em `components/analytics/` (escopo de outras US)

Os 4 valores do Giscus são PÚBLICOS (aparecem no HTML do widget), mas ficam em `.env.development.local` para flexibilidade. Commitar acidentalmente não é vazamento sério, mas evite — arquivo é gitignored por padrão.

Ao final rodar: `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` para confirmar que nada quebrou (não deveria — não mudamos código).
```

---

## Validação pós-onda

```bash
# 1. Confirmar que .env.development.local existe e tem as 4 vars + SITE_URL
test -f .env.development.local && grep -c "NEXT_PUBLIC_GISCUS_" .env.development.local
# esperado: 4

# 2. Confirmar que está gitignored (não aparece em git status)
git status --short | grep -c "env.development.local"
# esperado: 0

# 3. Build continua verde (não deveria mudar nada)
pnpm build

# 4. INDEX.md atualizado
grep -A 7 "^## PRD 01:" docs/prd/INDEX.md | grep "US-001"
# deve mostrar "Concluída"
```

**Checkpoint**: US-001 `Concluída` no INDEX + Vitor tem 4 IDs anotados para usar na Onda 2. Avançar.
