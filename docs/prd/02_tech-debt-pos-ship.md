# PRD 02: Tech-debt pós-ship

> **PRD**: `docs/prd/02_tech-debt-pos-ship.md`
> **Tasks**: `docs/tasks/02/`
> **Depende de**: PRD 01 (Deploy & Go-Live) estar com status `Concluído`
> **Data**: 2026-04-21

## 1. Introdução

Quitar tech-debt identificado durante a Phase 7 que foi conscientemente adiado para não atrasar o go-live: (i) o warning de depreciação do Next.js 16 em `middleware.ts` (API renomeada para `proxy.ts`); (ii) decisão sobre scrub do `.vscode/sftp.json` do histórico da branch `legacy-php` via `git filter-repo`. Nenhum dos dois bloqueia funcionalidade, mas deixá-los pendentes aumenta custo de manutenção e risco de segurança residual.

## 2. Goals

- Build + runtime Next.js 16 livre de deprecation warnings relacionados a middleware.
- Decisão registrada (e executada, se escolhida) sobre scrub definitivo das credenciais FTP do histórico git público.

## 3. User Stories

### US-001: Migrar `middleware.ts` → `proxy.ts` (Next 16)

**Descrição:** Como engenheiro do projeto, quero substituir o arquivo `middleware.ts` pela nova API `proxy.ts` introduzida no Next 16, para eliminar o deprecation warning e alinhar o código com a direção oficial do framework.

**Contexto atual (abril 2026):** Next 16 renomeou a runtime API de `middleware` para `proxy`. O build atual exibe `Proxy (Middleware)` na route list e emite warning em dev. A API surface é equivalente (mesmo `NextRequest`/`NextResponse`, mesmo matcher config), mas o nome do export e o nome do arquivo mudaram.

**Acceptance Criteria:**

- [ ] Renomear `middleware.ts` → `proxy.ts` (root, não dentro de `app/`)
- [ ] Renomear export default de `middleware` para `proxy` (ou o nome canonical que Next 16 espera — validar em https://nextjs.org/docs com WebFetch antes de codar)
- [ ] Lógica interna preservada byte-a-byte:
  - Bypass `/_next`, `/api`, `/static`, arquivos públicos
  - Detecção `hasLocalePrefix` por segmento
  - Cookie `NEXT_LOCALE` + fallback `Accept-Language` para `/` → `/en` ou stay PT
  - Header `x-pathname` injetado na response para `getRequestConfig` (next-intl helper)
- [ ] `config.matcher` preservado: `["/((?!_next|api|.*\\..*).*)"]`
- [ ] `pnpm build` roda sem warnings de deprecation relacionados a proxy/middleware
- [ ] `pnpm dev` sobe sem warnings
- [ ] Smoke test local após renomear:
  - [ ] `/` com cookie vazio + `Accept-Language: en-US` → redireciona para `/en`
  - [ ] `/` com cookie vazio + `Accept-Language: pt-BR` → fica em `/` (default PT)
  - [ ] `/` com `NEXT_LOCALE=en` → redireciona para `/en`
  - [ ] `/posts` com cookie PT → continua em `/posts`
  - [ ] `/en/posts` em qualquer combo → continua em `/en/posts`
  - [ ] `/api/*`, `/_next/*`, arquivos com extensão (`.xml`, `.ico`, `.png`) passam sem tocar
- [ ] next-intl `getRequestConfig` ainda lê o header `x-pathname` corretamente (páginas PT/EN renderizam com locale certo — verificar home + post)
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` passam

### US-002: Decisão sobre scrub de credenciais do histórico `legacy-php`

**Descrição:** Como Vitor, quero uma decisão explícita e registrada sobre o que fazer com o arquivo `.vscode/sftp.json` no histórico da branch `legacy-php` (continha credenciais FTP do hosting PHP antigo, já rotacionadas no PRD 01 US-004).

**Contexto:** Após a rotação de senha (PRD 01), as credenciais no histórico são **inertes** — não dão acesso a nada. Mas continuam publicamente visíveis em qualquer clone/fork da branch `legacy-php`. Duas opções:

- **(A) Manter como está** — credenciais inertes não oferecem risco direto; rewriting history em branch pública quebra clones existentes de qualquer fork.
- **(B) Scrub via `git filter-repo`** — elimina a referência de todos os commits, requer `git push --force origin legacy-php main`. Destrutivo, exige que qualquer fork refaça clone.

**Acceptance Criteria:**

- [ ] Decisão registrada em ADR (Architecture Decision Record) em `docs/adr/001-credenciais-no-historico-legacy-php.md` com:
  - Contexto (spec §13 + esta US)
  - Opções A e B com prós/contras
  - Decisão tomada e justificativa
  - Data + signatário (Vitor)
- [ ] Se **opção A**: ADR fecha o assunto. Checklist de acceptance termina aqui.
- [ ] Se **opção B**:
  - [ ] Backup local antes do rewrite: `git clone --mirror . ../vitorpereira.ia.br.backup-YYYYMMDD`
  - [ ] Rodar `git filter-repo --path .vscode/sftp.json --invert-paths` (requer `git filter-repo` instalado — `brew install git-filter-repo`)
  - [ ] `git push --force origin legacy-php main` — **requer aprovação explícita do Vitor no chat antes de executar**
  - [ ] Verificar: `git log --all --full-history -- .vscode/sftp.json` retorna vazio
  - [ ] Nenhum outro arquivo tracked foi perdido (`git log --all --oneline | wc -l` antes vs. depois — diff aceitável apenas nos commits que tocavam sftp.json)

## 4. Functional Requirements

- **FR-1**: A migração de `middleware.ts` (US-001) não deve alterar nenhum comportamento observável do usuário final — é refactor puro de nome. Qualquer mudança de comportamento é bug.
- **FR-2**: O ADR (US-002) vive em `docs/adr/` (criar o diretório se não existir). Formato: Markdown simples com seções **Contexto**, **Opções**, **Decisão**, **Consequências**.
- **FR-3**: Rewriting history (US-002 opção B) só pode ocorrer se nenhum colaborador externo tiver clone ativo — projeto é solo, então baixo risco, mas confirmar antes de `--force`.

## 5. Non-Goals

- **Reescrever a lógica de i18n** do middleware/proxy — é refactor de nome, não de comportamento.
- **Adicionar testes E2E para o proxy** — cobertura via smoke test manual é suficiente neste projeto (spec §12.1 limita unit test scope).
- **Scrubar outros arquivos sensíveis do histórico** — só `sftp.json` está sinalizado; se aparecerem outros (chaves privadas, tokens), abrir PRD novo.
- **Migração para Vercel Middleware API v2 ou Edge Runtime específico** — ficar no Node.js runtime padrão que Next 16 escolhe.

## 6. Architecture Considerations

| Camada          | Arquivos afetados                                                     | US                    |
| --------------- | --------------------------------------------------------------------- | --------------------- |
| Runtime routing | `middleware.ts` (deletado) + `proxy.ts` (novo, root)                  | US-001                |
| Config          | `next.config.ts` (só se Next 16 exigir declaração explícita de proxy) | US-001 (se aplicável) |
| Docs            | `docs/adr/001-credenciais-no-historico-legacy-php.md`                 | US-002                |
| Git history     | Branches `main` e `legacy-php` (só se opção B)                        | US-002                |

**Dependências externas:** se opção B, precisa `git filter-repo` instalado localmente (`brew install git-filter-repo`).

## 7. Success Metrics

- `pnpm build` output sem warnings `[Deprecation]` ou equivalente após US-001.
- ADR existe e é citado por qualquer discussão futura sobre o histórico da `legacy-php`.
- Nenhuma regressão funcional detectada no smoke test pós-migração (US-001).

## 8. Open Questions

- **US-001**: Next 16 estável em 16.2.4 — confirmar via release notes (WebFetch https://nextjs.org/blog) se há changes adicionais pedidos além do rename (ex: mudança em `NextResponse.next()` ou matcher semantics). Se sim, ampliar acceptance criteria.
- **US-001**: `next-intl` 4.9.1 depende do header `x-pathname` para `getRequestConfig`. Confirmar que continua funcional sob `proxy.ts` — se `proxy` tiver timing diferente de `middleware` (ex: roda só após rendering), pode quebrar server-side locale. Plano B: mover injeção do header para outra camada.
- **US-002**: Vitor quer evidenciar no ADR exatamente qual dado estava comprometido (hostname + user FTP suficiente, sem a senha literal por higiene)? Padrão OK com ADR contendo só metadados, senha nunca deve aparecer escrita em Markdown.
