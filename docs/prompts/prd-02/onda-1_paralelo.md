# Onda 1 — Tech-debt pós-ship (2 agents paralelos)

> **2 agents paralelos** | ~30-45 min
> **Pre-requisito**: PRD 01 `Concluído` (não romper produção durante tech-debt)

---

## Agent 1 — US-001: Migrar `middleware.ts` → `proxy.ts` (Next 16)

```
Implementar US-001 do PRD 02. Ler o task file `docs/tasks/02/US-001_middleware-to-proxy.md` para contexto completo.

Resumo do que fazer:
1. Pre-flight: WebFetch em https://nextjs.org/docs para confirmar o formato canonical da nova API proxy do Next 16 — nome do arquivo (esperado: `proxy.ts` no root), nome do export default (esperado: `proxy`), se `config.matcher` mudou. NÃO assumir — validar direto no doc.
2. Renomear `middleware.ts` → `proxy.ts` no root. Renomear export default de `middleware` para `proxy` (ou o que Next 16 documentar). Preservar toda a lógica interna byte-a-byte — só nomes mudam.
3. Preservar `config.matcher = ["/((?!_next|api|.*\\..*).*)"]`.
4. Rodar `pnpm build` e `pnpm dev` — confirmar que NÃO há mais warning de deprecation relacionado a middleware/proxy.
5. Smoke test manual i18n local (http://localhost:3003):
   - Cookie limpo + Accept-Language en-US → `/` redireciona para `/en`
   - Cookie limpo + Accept-Language pt-BR → `/` fica em `/` (default PT)
   - Cookie NEXT_LOCALE=en → `/` redireciona para `/en`
   - `/posts`, `/en/posts`, `/_next/...`, `/sitemap.xml`, `/favicon.ico` → passam sem redirect
   - Home PT renderiza com locale pt (strings pt no HTML)
   - Home EN renderiza com locale en
6. `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` passam.
7. Commit: `refactor(proxy): migrate middleware to Next 16 proxy API`. Push.
8. Deploy em Vercel (se Onda já tem preview branch) ou direto em main — confirmar que prod não regrediu (lighthouse spot-check opcional).
9. Marcar US-001 Concluída em `docs/prd/INDEX.md` (progresso PRD 02: 1/2).

Arquivos que você PODE modificar:
- `middleware.ts` (deletar)
- `proxy.ts` (criar)
- `next.config.ts` (só se Next 16 exigir)
- `docs/prd/INDEX.md`

NÃO alterar:
- Qualquer arquivo em `components/`, `features/`, `app/`, `lib/`, `content/`, `features/`
- `docs/adr/` (escopo de Agent 2)
- `docs/tasks/02/US-002_*.md`

Risco conhecido — next-intl `x-pathname`:
next-intl 4.9.1 em `i18n/request.ts` lê `headers().get('x-pathname')` server-side para resolver o locale. Se `proxy.ts` tiver semântica de timing diferente (rodar após rendering), o header pode não estar disponível ainda. Fallback esperado: proxy roda ANTES do rendering, igual middleware — confirmar no doc + smoke test.

Se o smoke test i18n falhar (locale errado, redirect não disparado), NÃO forçar merge. Debuggar ou reverter o rename e abrir issue para investigar no doc oficial.

Ao final rodar: `pnpm build` + colar no chat o output procurando por strings "deprecation", "deprecated", "middleware" (case-insensitive) para evidência de que o warning sumiu.
```

---

## Agent 2 — US-002: Decisão (ADR) sobre scrub de credenciais `legacy-php`

```
Implementar US-002 do PRD 02. Ler o task file `docs/tasks/02/US-002_adr-scrub-legacy-php.md` para contexto completo.

Resumo do que fazer:
1. Criar o diretório `docs/adr/` (primeira ADR do projeto).
2. Apresentar ao Vitor as 2 opções (já no task file, §Description):
   - Opção A: manter histórico como está (credenciais inertes pós-rotação no PRD 01 US-004)
   - Opção B: scrub via `git filter-repo` + `git push --force`
3. Pedir decisão explícita ao Vitor: "Opção A (manter) ou Opção B (scrub)?". Esperar resposta clara.
4. Criar `docs/adr/001-credenciais-no-historico-legacy-php.md` usando o template do task file, preencher:
   - Contexto (spec §13 + US-004 do PRD 01)
   - Opções A e B com prós/contras
   - Decisão (A ou B com 2-3 frases de justificativa)
   - Consequências operacionais
   - Data (formato AAAA-MM-DD, hoje)
   - Autor: Vitor
5. Formatar: `pnpm prettier --write docs/adr/`
6. Commit: `docs(adr): 001 credenciais no histórico legacy-php`. Push.

7. SE a decisão foi OPÇÃO A:
   - Nada mais. ADR fecha a US.
   - Marcar US-002 Concluída em `docs/prd/INDEX.md` (progresso 2/2; se US-001 também estiver, fechar PRD 02).

8. SE a decisão foi OPÇÃO B:
   - **COORDENAÇÃO CRÍTICA**: esperar a US-001 (Agent 1) terminar e pushed em main. Se rodar filter-repo antes, o rewrite deleta os commits de US-001 que ainda não chegaram no remote — perda de trabalho.
   - Confirmar com Agent 1 (ou Vitor) que US-001 está mergeada.
   - Instalar git-filter-repo se faltar: `brew install git-filter-repo`
   - Backup: `cd .. && git clone --mirror vitorpereira.ia.br vitorpereira.ia.br.backup-$(date +%Y%m%d)`
   - Voltar ao repo: `git filter-repo --path .vscode/sftp.json --invert-paths`
   - Verificar: `git log --all --full-history -- .vscode/sftp.json` retorna vazio.
   - PEDIR APROVAÇÃO EXPLÍCITA DO VITOR ("force push approved") antes de:
     - `git push --force origin legacy-php`
     - `git push --force origin main`
   - Atualizar ADR com nota "Executado em <data>, backup em ../vitorpereira.ia.br.backup-YYYYMMDD"
   - Commit ADR update, push normal.
   - Marcar US-002 Concluída.

Arquivos que você PODE modificar:
- `docs/adr/001-credenciais-no-historico-legacy-php.md` (criar/editar)
- `docs/prd/INDEX.md`
- Git history (só opção B, com aprovação)

NÃO alterar:
- `middleware.ts`, `proxy.ts`, `next.config.ts` (escopo de Agent 1)
- `docs/tasks/02/US-001_*.md`
- Qualquer arquivo de código

Gotchas:
- `git filter-repo` é MAIS SEGURO que `git filter-branch` (esta última é deprecated). Não caia na tentação de usar filter-branch.
- `brew install git-filter-repo` requer permissão. Se bloquear, usar pip: `pip3 install git-filter-repo`.
- Force push destrói remote refs — se houver forks/clones externos, eles divergem sem aviso. Projeto é solo, baixo risco, mas confirmar antes.
- Depois do force push, `git reflog` local ainda tem os commits antigos. Se precisar recuperar: `git reset --hard HEAD@{N}`. O backup em `../vitorpereira.ia.br.backup-YYYYMMDD` é o safety net principal.

Ao final rodar: se opção A, apenas `pnpm format:check`. Se opção B: validar `git log --all --full-history -- .vscode/sftp.json` retorna vazio E o GitHub retorna 404 em `github.com/vitoropereira/vitorpereira.ia.br/blob/legacy-php/.vscode/sftp.json`.
```

---

## Validação pós-onda

```bash
# US-001 side
# 1. Arquivo proxy.ts existe, middleware.ts não
test -f proxy.ts && ! test -f middleware.ts && echo "rename OK"

# 2. Build sem warning de deprecation
pnpm build 2>&1 | grep -iE "deprec|middleware" | grep -v "Proxy (Middleware)" | head
# esperado: nenhuma saída

# US-002 side
# 3. ADR existe
test -f docs/adr/001-credenciais-no-historico-legacy-php.md && echo "ADR OK"

# 4. Se opção B: arquivo sumiu do histórico
git log --all --full-history -- .vscode/sftp.json | head
# opção A: deve mostrar commits históricos; opção B: vazio

# Shared
# 5. Quality gates verdes
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check

# 6. INDEX.md reflete conclusão
grep "PRD 02" docs/prd/INDEX.md | head -1
# esperado: "2/2 US" + "Concluído"
```

**Checkpoint**: middleware deprecation resolvida + ADR do scrub registrado + PRD 02 `Concluído`. Todos os PRDs ativos do projeto fechados.
