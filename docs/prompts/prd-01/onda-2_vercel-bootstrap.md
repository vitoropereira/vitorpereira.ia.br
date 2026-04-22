# Onda 2 — Vercel bootstrap

> **1 agent** | ~15-20 min
> **Pre-requisito**: Onda 1 completa (4 Giscus IDs em mãos + GA4/Clarity IDs do Vitor)

---

## Agent 1 — US-002: Vercel bootstrap (link + env vars)

```
Implementar US-002 do PRD 01. Ler o task file `docs/tasks/01/US-002_vercel-bootstrap.md` para contexto completo.

Resumo do que fazer:
1. Garantir Vercel CLI instalada (`pnpm add -g vercel` ou usar via npx). Se não houver, avisar o Vitor — instalação global precisa de permissão.
2. Rodar `vercel login` (comando interativo — avisar o Vitor para digitar "! vercel login" no prompt do Claude Code).
3. Rodar `vercel link` na raiz do repo (interativo — "! vercel link"):
   - Set up project? Yes
   - Scope: conta pessoal do Vitor
   - Existing project? No, create new
   - Name: vitorpereira-ia-br
   - Framework: Next.js (auto-detect)
   - Root directory: ./
   - Modify settings? No
4. Adicionar 7 env vars em scope `production` via `vercel env add`. Os valores vêm do Vitor:
   - NEXT_PUBLIC_SITE_URL = https://vitorpereira.ia.br
   - NEXT_PUBLIC_GA_ID = <pedir ao Vitor o G-XXXXXXXXXX>
   - NEXT_PUBLIC_CLARITY_ID = <pedir ao Vitor o 10-char>
   - NEXT_PUBLIC_GISCUS_REPO = vitoropereira/vitorpereira.ia.br
   - NEXT_PUBLIC_GISCUS_REPO_ID = <da Onda 1>
   - NEXT_PUBLIC_GISCUS_CATEGORY = Comments
   - NEXT_PUBLIC_GISCUS_CATEGORY_ID = <da Onda 1>
5. Repetir as 7 vars em scope `preview`, trocando apenas NEXT_PUBLIC_SITE_URL para https://vitorpereira-ia-br.vercel.app.
6. Rodar `vercel env ls` — confirmar 14 entries (7 prod + 7 preview).
7. NÃO fazer deploy ainda — isso é Onda 3.
8. Marcar US-002 como Concluída em `docs/prd/INDEX.md` e atualizar progresso (2/5 US).

Arquivos afetados:
- `.vercel/` é criada automaticamente pela CLI. JÁ está gitignored — NÃO commitar.
- `docs/prd/INDEX.md` (update de status)

NÃO alterar:
- `.env.example` (já tem as 7 vars documentadas)
- `.env.development.local` (da Onda 1)
- Código — consumidores já estão wired nas Phases 1-6

Gotchas conhecidos:
- Cada `vercel env add` é interativo: precisa ser rodado com `!` pelo Vitor, OU usar stdin: `echo "valor" | vercel env add NAME production`. Prefira o stdin approach se o Vitor compartilhar os valores no chat — é 7× mais rápido.
- IDs do Giscus, GA, Clarity são todos NEXT_PUBLIC_ (safe to expose). Não tratá-los como secrets — entrar normalmente.
- Se `vercel env ls` mostrar entries duplicadas (ex: uma no prod e uma no production scope), pode ser que você adicionou com scope errado; rodar `vercel env rm <NAME> <scope>` pra limpar.

Ao final rodar: `vercel env ls` e colar o output no chat para audit final.
```

---

## Validação pós-onda

```bash
# 1. Vercel project linkado
test -f .vercel/project.json && echo "linked" || echo "NOT LINKED"

# 2. Listar env vars (output deve ter 14 linhas de var além do header)
vercel env ls

# 3. Pull das env vars para sanity (arquivo temporário, não commitar)
vercel env pull .env.vercel.check && grep -c "NEXT_PUBLIC_" .env.vercel.check && rm .env.vercel.check
# esperado: pelo menos 7 (production scope só)
```

**Checkpoint**: US-002 `Concluída` + `.vercel/` linkada + 14 env vars configuradas. Avançar.
