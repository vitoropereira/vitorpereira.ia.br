# PRD Index — vitorpereira.ia.br

Rastreador leve do status de cada PRD. **Single source of truth** para saber o que está em andamento e o que foi concluído. Specs completas moram em `docs/superpowers/specs/` e planos de fase em `docs/superpowers/plans/` — estes PRDs os complementam para tracking.

## Convenções

- Numeração sequencial zero-padded: `01_nome.md`, `02_nome.md`.
- Tasks por PRD: `docs/tasks/XX/` (uma task file por US quando a implementação começar).
- Status possíveis: `Draft` → `Aprovado` → `Em andamento` → `Concluído` (ou `Cancelado`).

## PRDs

| #   | PRD                                              | Tema                                                                                            | Status       | Progresso |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------ | --------- |
| 01  | [Deploy & go-live](./01_deploy-e-go-live.md)     | Fechar Phase 7: Giscus + Vercel + DNS cutover + pós-ship                                        | Em andamento | 2/5 US    |
| 02  | [Tech-debt pós-ship](./02_tech-debt-pos-ship.md) | Migração `middleware.ts` → `proxy.ts` (Next 16); scrub de credenciais do histórico `legacy-php` | Em andamento | 0/2 US    |

## Moments em que o INDEX deve ser atualizado

| Evento                   | Ação                                                    |
| ------------------------ | ------------------------------------------------------- |
| PRD criado               | Adicionar linha com status `Draft` e progresso `0/N US` |
| PRD aprovado pelo Vitor  | Mudar status para `Aprovado`                            |
| Primeira US em andamento | Mudar status para `Em andamento`                        |
| US concluída             | Incrementar contador de progresso (ex: `2/5 US`)        |
| Todas as US concluídas   | Mudar status para `Concluído`                           |
| PRD engavetado           | Mudar status para `Cancelado`                           |

---

## PRD 01: Deploy & go-live

| US     | Título                                          | Status   | Branch/PR |
| ------ | ----------------------------------------------- | -------- | --------- |
| US-001 | Giscus configurado contra o repo real           | Concluída | local-only (env) |
| US-002 | Vercel bootstrap (link + env vars)              | Concluída | dashboard (no CLI) |
| US-003 | Deploy provisório passando aceite completo      | Pendente | —         |
| US-004 | DNS cutover para domínio real                   | Pendente | —         |
| US-005 | Pós-ship — Search Console + validators + uptime | Pendente | —         |

---

## PRD 02: Tech-debt pós-ship

| US     | Título                                                           | Status   | Branch/PR |
| ------ | ---------------------------------------------------------------- | -------- | --------- |
| US-001 | Migrar `middleware.ts` → `proxy.ts` (Next 16)                    | Pendente | —         |
| US-002 | Decisão (ADR) sobre scrub de credenciais do histórico legacy-php | Pendente | —         |
