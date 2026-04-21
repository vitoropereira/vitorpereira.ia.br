# US-002: Decisão (ADR) sobre scrub de credenciais do histórico `legacy-php`

> **PRD**: `docs/prd/02_tech-debt-pos-ship.md`
> **Task**: `docs/tasks/02/US-002_adr-scrub-legacy-php.md`
> **Status**: Pendente

## Description

Como Vitor, quero uma decisão explícita e registrada sobre o que fazer com o arquivo `.vscode/sftp.json` no histórico da branch `legacy-php` (continha credenciais FTP do hosting PHP antigo, já rotacionadas no PRD 01 US-004).

## Acceptance Criteria

### Etapa 1 — Criar ADR (sempre executada)

- [ ] Diretório `docs/adr/` criado (primeira ADR do projeto)
- [ ] Arquivo `docs/adr/001-credenciais-no-historico-legacy-php.md` criado com as seções:
  - **Contexto**: referência à spec §13 + explicação de que senha foi rotacionada no PRD 01 US-004, então credenciais no histórico são **inertes**
  - **Opções** (A manter / B scrub com `git filter-repo`) com prós e contras claros
  - **Decisão**: A ou B, com justificativa em 2-3 frases
  - **Consequências**: o que muda operacionalmente (se A: nada; se B: forks precisam re-clonar)
  - **Data**: data da decisão
  - **Autor**: Vitor
- [ ] ADR formata linter: `pnpm prettier --write docs/adr/`
- [ ] Commit: `docs(adr): 001 credenciais no histórico legacy-php`

### Etapa 2 — Se a decisão for **Opção A (manter)**

- [ ] Nada mais a fazer. ADR fecha o assunto.
- [ ] Atualizar `docs/prd/INDEX.md` PRD 02 progresso: US concluída.

### Etapa 3 — Se a decisão for **Opção B (scrub via `git filter-repo`)**

- [ ] `git filter-repo` instalado localmente: `brew install git-filter-repo` (confirmar com `git filter-repo --version`)
- [ ] Backup completo do repo antes do rewrite:
  ```bash
  cd /Users/vop12/projects/
  git clone --mirror vitorpereira.ia.br vitorpereira.ia.br.backup-$(date +%Y%m%d)
  ```
- [ ] Confirmar que não há colaboradores externos com clones ativos (projeto solo, mas vale perguntar em público se postou algum fork)
- [ ] Rodar `git filter-repo` na raiz do repo:
  ```bash
  cd /Users/vop12/projects/vitorpereira.ia.br
  git filter-repo --path .vscode/sftp.json --invert-paths
  ```
- [ ] Verificar que o arquivo sumiu do histórico:
  ```bash
  git log --all --full-history -- .vscode/sftp.json
  # deve retornar vazio
  ```
- [ ] Verificar que nenhum outro arquivo tracked foi perdido:
  ```bash
  git log --all --oneline | wc -l   # antes e depois — diff esperado: só commits que tocavam sftp.json
  git ls-files | wc -l               # total de tracked files não deve cair inesperadamente
  ```
- [ ] **Aprovação explícita do Vitor no chat** ("force push approved") antes de:
  ```bash
  git push --force origin legacy-php
  git push --force origin main
  ```
- [ ] Confirmar no GitHub que `vitoropereira/vitorpereira.ia.br@legacy-php:.vscode/sftp.json` retorna 404
- [ ] Comunicar qualquer fork existente (abrir issue sinalizando, se aplicável)
- [ ] ADR atualizado com nota "Executado em <data>, backup em `../vitorpereira.ia.br.backup-YYYYMMDD`"

## Implementation Notes

### Arquivos afetados

- `docs/adr/001-credenciais-no-historico-legacy-php.md` — novo (sempre)
- Histórico de `main` e `legacy-php` — só se opção B (destrutivo)

### Template ADR sugerido

```markdown
# ADR 001: Credenciais no histórico da branch `legacy-php`

**Status**: Aceito
**Data**: 2026-MM-DD
**Autor**: Vitor

## Contexto

A branch `legacy-php` preserva o código do site antigo (PHP/Tailwind-CDN).
Durante o rewrite, `.vscode/sftp.json` foi commitado com credenciais FTP
do hosting PHP. A senha foi rotacionada no PRD 01 US-004, mas o arquivo
continua visível no histórico público do GitHub.

## Opções consideradas

### Opção A — Manter como está

- Prós: zero risco operacional; credenciais inertes pós-rotação; preserva
  histórico intacto para arqueologia futura.
- Contras: hostname + username FTP continuam visíveis (info disclosure menor);
  um scanner automatizado pode tentar reativar a conta se o hosting expirar
  o lockout de senha.

### Opção B — Scrub via `git filter-repo`

- Prós: remove a referência definitivamente.
- Contras: rewrite de histórico força `git push --force`, quebra clones
  existentes; repo precisa de backup; protege só contra info disclosure futuro.

## Decisão

[A ou B, com 2-3 frases de justificativa.]

## Consequências

[O que muda operacionalmente. Se B: forks e clones precisam `git reset --hard`
ou re-clonar.]
```

### Por que ADR em vez de só commitar o fix?

ADRs são registros permanentes de decisões arquiteturais que futuramente
serão questionadas. "Por que o sftp.json ainda está lá?" em 2027 merece uma
resposta rastreável.

### Dependências

- Depends on: PRD 01 US-004 (senha FTP rotacionada — pré-condição para a decisão fazer sentido)
- Blocks: nenhuma

## Testing

- [ ] Manual: ADR renderiza OK em `github.com/vitoropereira/vitorpereira.ia.br/blob/main/docs/adr/001-credenciais-no-historico-legacy-php.md`
- [ ] Se opção B: manual — confirmar via browser que GitHub retorna 404 para o arquivo no histórico
