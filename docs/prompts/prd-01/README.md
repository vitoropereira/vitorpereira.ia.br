# PRD 01 — Execution Prompts

5 ondas **estritamente sequenciais** (chain dependency). Não há paralelismo nesta PRD — cada US precisa do output concreto da anterior.

## Visual diagram

```
┌──────────────────────────────┐
│ Onda 1: US-001 Giscus setup  │
│  (Vitor + giscus.app)        │
└──────────────┬───────────────┘
               │ outputs: 4 Giscus IDs
               ▼
┌──────────────────────────────┐
│ Onda 2: US-002 Vercel boot   │
│  (Vercel CLI: link + env ×14)│
└──────────────┬───────────────┘
               │ outputs: projeto linkado + env prod/preview
               ▼
┌──────────────────────────────┐
│ Onda 3: US-003 Deploy prov.  │
│  (vercel --prod + acceptance)│
└──────────────┬───────────────┘
               │ outputs: URL provisória aprovada + Lighthouse ok
               ▼
┌──────────────────────────────┐
│ Onda 4: US-004 DNS cutover   │
│  (FTP rotate + "approved" +  │
│   Registrar + Vercel Dash)   │
└──────────────┬───────────────┘
               │ outputs: domínio real servindo Next.js
               ▼
┌──────────────────────────────┐
│ Onda 5: US-005 Pós-ship      │
│  (Search Console + uptime)   │
└──────────────────────────────┘
```

## Mapa ondas → prompts → dependências

| Onda | Prompt                        | Agents | Task                                         | Dependências                     |
| ---- | ----------------------------- | ------ | -------------------------------------------- | -------------------------------- |
| 1    | `onda-1_giscus-setup.md`      | 1      | US-001 Giscus configurado contra o repo real | Nenhuma                          |
| 2    | `onda-2_vercel-bootstrap.md`  | 1      | US-002 Vercel bootstrap (link + env vars)    | Onda 1 (4 Giscus IDs)            |
| 3    | `onda-3_deploy-provisorio.md` | 1      | US-003 Deploy provisório passando aceite     | Onda 2 (env vars na Vercel)      |
| 4    | `onda-4_dns-cutover.md`       | 1      | US-004 DNS cutover para domínio real         | Onda 3 + FTP rotate + "approved" |
| 5    | `onda-5_pos-ship.md`          | 1      | US-005 Pós-ship — Search Console + uptime    | Onda 4 (domínio real live)       |

## Como usar

1. **Abrir uma sessão do Claude Code por vez** (não dá pra paralelizar — encadeamento estrito).
2. **Colar o prompt da onda atual** no chat. Agente vai ler o task file, guiar o Vitor pelos passos externos (GitHub UI, giscus.app, Vercel Dashboard, registrar DNS), validar cada AC e rodar smoke tests quando aplicável.
3. **Ao final da onda**, agente marca a US como `Concluída` em `docs/prd/INDEX.md` e atualiza o progresso (ex: `1/5 US`).
4. **Rodar validação pós-onda** (comando no pé de cada prompt).
5. **Avançar para a próxima onda** apenas após confirmação de conclusão.

## Por que uma US por onda?

As US do PRD 01 são operacionais (ação externa: Discussions, giscus.app, Vercel Dashboard, DNS registrar). Não há código concorrente que possa ser particionado entre agents. Manter 1 agent por onda reduz coordenação e garante linearidade do checklist.

## Regra de deploy (vale para Ondas 3+)

**Deploy = PR → merge em `main`** via Git integration GitHub↔Vercel. **Não usamos Vercel CLI** neste PRD.

- Bootstrap do projeto Vercel (Onda 2): Dashboard da Vercel, não `vercel link`.
- Deploy provisório (Onda 3): PR em `main` → merge → Vercel deploya em `https://vitorpereira-ia-br.vercel.app`.
- Fixes durante fix loop (Onda 3): sempre em branch separada → PR → merge.
- DNS cutover (Onda 4): Dashboard + registrar + `dig`/`curl` para inspeção. Qualquer mudança de código/docs vai via PR.
- Pós-ship (Onda 5): PRs para qualquer ajuste.

Motivo: trilha de auditoria via PR, gate de CI/Preview antes de production, zero dependência de estado local do Vercel CLI.

## Após completar PRD 01

O PRD 02 (tech-debt) libera e pode rodar. Ver `docs/prompts/prd-02/README.md`.
