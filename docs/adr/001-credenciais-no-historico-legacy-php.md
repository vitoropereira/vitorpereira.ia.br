# ADR 001: Credenciais no histórico da branch `legacy-php`

**Status**: Aceito
**Data**: 2026-10-10
**Autor**: Vitor

## Contexto

A branch `legacy-php` preserva o código do site antigo (PHP/Tailwind-CDN).
Durante o rewrite, `.vscode/sftp.json` foi commitado com credenciais FTP do
hosting PHP. O arquivo está listado em
`docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
§13 ("Pendências herdadas do PHP") e a rotação da senha foi o escopo do
PRD 01 US-004.

A senha foi rotacionada, então as credenciais no histórico são **inertes**.
O arquivo continua visível no histórico público do GitHub. Por higiene, esta
ADR não reproduz hostname, usuário nem senha; só referencia o caminho
`.vscode/sftp.json`.

## Opções consideradas

### Opção A — Manter como está

- Prós: zero risco operacional; credenciais inertes pós-rotação; preserva o
  histórico intacto para arqueologia futura.
- Contras: hostname e usuário FTP continuam visíveis (info disclosure menor);
  um scanner automatizado ganha um alvo para brute force ou password
  spraying contra a conta, caso ela seja reativada.

### Opção B — Scrub via `git filter-repo`

- Prós: remove a referência definitivamente.
- Contras: rewrite de histórico força `git push --force` em `main` e
  `legacy-php`, quebra clones existentes; exige backup do repo; protege só
  contra info disclosure futuro.

## Decisão

**Opção A — manter o histórico.** As credenciais já foram rotacionadas e não
dão acesso a nada. Reescrever o histórico e fazer force push em `main` e
`legacy-php` tem custo e risco maiores que o ganho, que se resume a esconder
hostname e usuário de um hosting que não é mais usado.

## Consequências

- Nada muda operacionalmente; nenhum histórico é reescrito.
- `.vscode/sftp.json` continua versionado na ponta de `legacy-php` (junto
  com `.vscode/sftp.vitor.test.json`, não avaliado aqui) e alcançável pelo
  histórico da `main` (commits 156cd70, 73a908c e a4c1fc2). A Opção B exigiria
  force push nas duas branches e, para ser completa, cobrir também o segundo
  arquivo.
- Revisitar esta decisão só se o hosting antigo voltar a ser usado ou se a
  conta FTP for reativada.
- Qualquer discussão futura sobre "por que o `sftp.json` ainda está lá?"
  se resolve apontando para esta ADR.
