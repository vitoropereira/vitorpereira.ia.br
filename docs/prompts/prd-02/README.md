# PRD 02 — Execution Prompts

1 onda com **2 agents em paralelo** (arquivos distintos, sem conflito).

## Visual diagram

```
┌─────────────────────────── Onda 1 (paralelo) ───────────────────────────┐
│                                                                          │
│  ┌────────────────────────────┐    ┌──────────────────────────────────┐ │
│  │ Agent 1                    │    │ Agent 2                          │ │
│  │ US-001 middleware→proxy    │    │ US-002 ADR scrub legacy-php      │ │
│  │ (rename + smoke i18n)      │    │ (decisão + ADR; opcional filter- │ │
│  │                            │    │  repo se Vitor escolher opção B) │ │
│  └────────────┬───────────────┘    └──────────────┬───────────────────┘ │
│               │                                    │                     │
└───────────────┼────────────────────────────────────┼─────────────────────┘
                ▼                                    ▼
        Coordenação SE opção B em US-002: esperar US-001 merge antes
        de `git push --force` (reescreve histórico inclui commits de US-001).
```

## Mapa onda → prompts → dependências

| Onda | Prompt               | Agents | Tasks                                | Dependências                          |
| ---- | -------------------- | ------ | ------------------------------------ | ------------------------------------- |
| 1    | `onda-1_paralelo.md` | 2      | US-001 middleware→proxy + US-002 ADR | PRD 01 `Concluído` (não quebrar prod) |

## Conflitos e coordenação

**Arquivos afetados por cada agent:**

| Agent  | Arquivos                                                                                |
| ------ | --------------------------------------------------------------------------------------- |
| US-001 | `middleware.ts` (del) + `proxy.ts` (novo, root) + eventual `next.config.ts`             |
| US-002 | `docs/adr/001-credenciais-no-historico-legacy-php.md` (novo) + git history (só opção B) |

**Zero overlap de arquivos** — pode rodar em paralelo em 2 sessões do Claude Code.

**Ressalva opção B**: se US-002 resultar em `git filter-repo` + force push, precisa rodar DEPOIS do merge de US-001 — caso contrário o rewrite apaga os novos commits da US-001 que ainda não chegaram no remote. Explicitado no prompt da US-002.

## Como usar

1. **Abrir 2 sessões separadas do Claude Code**, uma pra cada agent.
2. **Colar o prompt correspondente em cada sessão** — agents trabalham independentemente.
3. Agent 1 finaliza rename de middleware e faz smoke test i18n.
4. Agent 2 conduz decisão com o Vitor sobre opção A/B e cria o ADR.
5. **Opção A**: ADR sozinho fecha US-002, agent termina. **Opção B**: coordenar com Agent 1 para force push só após US-001 mergeada.
6. Rodar validação pós-onda (comandos no pé de `onda-1_paralelo.md`).

## Após completar PRD 02

Projeto encerrado em `Concluído` para todos os PRDs. Backlog de novos trabalhos abre via novos PRDs numerados (03+).
