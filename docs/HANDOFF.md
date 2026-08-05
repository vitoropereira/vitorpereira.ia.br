# HANDOFF — Retomada de sessão

> **Como usar**: na próxima sessão, mande "leia `docs/HANDOFF.md`". Eu entendo onde paramos, o que falta, e te guio no próximo passo.
>
> **Última atualização**: 2026-08-05 — prova na home, portfólio mostrando resultados, pipeline editorial (3 posts/semana) e 6 drafts na fila.

---

## Sessão 2026-08-05 — prova na home + pipeline editorial

**Contexto**: revisão do site à luz dos CVs em `domus/memory/carreira/cv/`. O
diagnóstico apontou que o material mais forte (números git-verified, war stories
do MGM) não aparecia em lugar nenhum do site.

**O que foi feito**:

1. **Faixa de prova na home** (`features/marketing/components/Proof.tsx`, PT+EN) —
   70+ founders simultâneos, ~700 análises/dia, 3,6M+ interações, ~400 deploys
   com 165 testes. O Hero prometia "sem hype, sem demo fake" e não mostrava
   número nenhum.
2. **`results` do portfólio passou a renderizar.** O campo existia em
   `features/portfolio/types.ts` e nos dados desde sempre, mas **nenhum
   componente o exibia** — todo número de todo projeto era dado morto (inclusive
   "R$ 2,7M" do AjudaJá). `ProjectCard` agora mostra os 3 primeiros; MGM e Pixel
   AI Hub ganharam métricas do cv-master.
3. **Pipeline editorial local** — `pnpm new:post` (scaffold) e `pnpm translate`
   (PT→EN via Claude, structured output; o modelo devolve só title/description/
   body e o código remonta o frontmatter, garantindo `date`/`draft`/`tags`
   preservados). Links internos são reescritos pras rotas `/en`.
4. **6 drafts na fila** — 3 war stories do MGM (ban do WhatsApp, evolução de
   filas, IDOR do pentest) + 3 posts fechando as perguntas 4/5/6 da série de
   agentes. Cadência ter/qui/sáb.
5. **`docs/blog/backlog.md`** — fila de pautas até a semana 36 com ângulo e
   material-fonte, banco de ideias e checklist de qualidade.

**Decisões**:

- **Sem cron de CI para tradução.** Um workflow agendado chegou a ser escrito e
  foi descartado a pedido do Vitor: geração é local, sob demanda, com revisão
  antes de publicar. `pnpm translate` precisa de `ANTHROPIC_API_KEY` no ambiente.
- **`cv-master.md` corrigido** (no repo Domus, não neste): ClearSeg é empresa
  própria (sócio-fundador & CTO, 2025–), não produto da I.V. Tec — que ficou
  marcada como encerrada.
- Contato **não** ganhou e-mail/WhatsApp — decisão do Vitor, segue só redes.

**Pendências desta sessão**:

- [ ] A chamada real da API em `pnpm translate` nunca executou (sem
      `ANTHROPIC_API_KEY` no ambiente da sessão). A lógica em volta tem 12 testes;
      a chamada em si não foi validada.
- [ ] Publicar os drafts **em ordem cronológica** — `memoria-de-agente` linka
      para `ferramentas-como-contrato` (draft) e dois posts linkam para
      `idor-a-fronteira-e-o-servidor` (draft). Draft dá 404 em produção.

---

## TL;DR onde paramos

- **Site novo NO AR no domínio real**: https://vitorpereira.ia.br/ serve o Next.js via **Cloudflare → Vercel** (cert Let's Encrypt emitido 2026-05-31 01:55 GMT). **Não é mais o PHP/Apache.**
- **DNS cutover (US-004): FEITO** — verificado por `dig` (NS Cloudflare, IPs proxied) + headers (`x-vercel-id`, `x-powered-by: Next.js`).
- **PRD 01**: 4/5 US concluídas. Falta só **US-005 (pós-ship)**.
- **Regra de deploy**: PR → merge em `main` → Vercel auto-deploy production (domínio real). Sem CLI.

---

## O que foi shippado nesta sessão (2026-05-31)

Smoke manual da US-003 revelou bugs; cada um virou PR → merge em `main`:

| PR | Tipo | O quê |
| --- | --- | --- |
| [#7](https://github.com/vitoropereira/vitorpereira.ia.br/pull/7) | fix | i18n dos cards de projeto (role/`client` agora bilíngue) |
| [#8](https://github.com/vitoropereira/vitorpereira.ia.br/pull/8) | fix | ⌘K crashava ao abrir (faltava `<Command>` root do cmdk) |
| [#9](https://github.com/vitoropereira/vitorpereira.ia.br/pull/9) | fix | **draft vazava via URL direta** → agora 404 em produção (com testes de regressão) |
| [#10](https://github.com/vitoropereira/vitorpereira.ia.br/pull/10) | feat | app icon, apple-touch icon, web manifest, theme-color |
| [#11](https://github.com/vitoropereira/vitorpereira.ia.br/pull/11) | fix | removido `favicon.ico` do scaffold (triângulo Vercel) → aba usa o ícone "VP" |

---

## US-003 — validação manual (estado real)

**Verificado nesta sessão (no alias e/ou domínio real):**

- [x] Smoke das 16 rotas (visual + HTTP 200) — PT e EN
- [x] Console sem erro vermelho (navegação nas rotas principais)
- [x] Theme toggle persiste (dark/light/system)
- [x] Language toggle PT↔EN preserva a rota
- [x] Command palette ⌘K abre e busca (corrigido no #8; busca é por locale)
- [x] Giscus **carrega** nos posts PT e EN
- [x] Drafts não vazam: ausente no listing + **404** na URL direta (corrigido no #9)
- [x] Consent — **pré-consent e Recusar**: GA4/Clarity NÃO carregam (verificado no Network: `clarity` e `googletagmanager` zerados)

**Ainda PENDENTE (manual, só o Vitor consegue):**

- [ ] Consent — **Aceitar**: confirmar que GA4 + Clarity carregam após aceitar; "Gerenciar cookies" reabre o banner
- [ ] **Lighthouse mobile** em `/` e num post → Perf ≥ 90, SEO ≥ 95, A11y ≥ 90 (anotar scores)
- [ ] **Logs Vercel** do último deploy production → nenhum 500
- [ ] Giscus — **postar** 1 comentário de teste (login GitHub) → ver em Discussions → deletar

> Os validators externos de SEO (Rich Results, Twitter Card, W3C Feed, Schema.org) seguem em **US-005**, agora rodando contra o domínio real (que era o pré-requisito).

---

## Próximo passo — US-005 (pós-ship)

Agora **destravado** (domínio real no Vercel). Cobre:

1. **Google Search Console** — adicionar propriedade `vitorpereira.ia.br`, submeter sitemap.
2. **Validators externos** no domínio real: Rich Results Test, Twitter Card Validator, W3C Feed, Schema.org.
3. **Uptime/monitoring** (a definir).
4. Fechar os 4 itens manuais residuais da US-003 acima.

Spec/tasks: `docs/prd/01_deploy-e-go-live.md`, `docs/tasks/01/US-005_pos-ship.md`.

---

## Observações de infra (registrar p/ não esquecer)

- **Cloudflare na frente**: o domínio usa Cloudflare (proxy laranja) → Vercel. O `robots.txt` servido inclui a camada **Content Signals / bloqueio de bots de IA** do Cloudflare (GPTBot, ClaudeBot, CCBot, Google-Extended, etc.) — **não afeta** Googlebot/Bingbot normais (`Allow: /` + `Sitemap:` presentes). Confirmar no dashboard Cloudflare se esse bloqueio foi intencional.
- **`/favicon.ico` agora retorna 404** (removido o `.ico`; o ícone vem do `<link rel="icon">` PNG). Se quiser `.ico` de volta p/ crawlers legados, gerar um multi-tamanho com ferramenta adequada.

---

## Estado verificado (snapshot 2026-05-31)

```bash
$ curl -sI https://vitorpereira.ia.br/ | grep -iE "x-vercel|x-powered|server"
server: cloudflare
x-powered-by: Next.js
x-vercel-id: gru1::iad1::...

$ curl -sI https://vitorpereira.ia.br/2026/04/22/only-pt-draft   # draft
HTTP/2 404

$ git log --oneline origin/main -6
a3da92e fix(icons): remove scaffold favicon.ico so the VP icon shows in tabs (#11)
b822f7b feat(icons): add app icon, apple-touch icon, web manifest and theme-color (#10)
1a7bd80 fix(blog): return 404 for draft posts via direct URL in production (#9)
1070734 fix(search): wrap CommandDialog children in Command root (#8)
8ee39aa fix(portfolio): localize project client/role label for EN (#7)
bee3dce fix(a11y): set html lang dynamically based on locale (#6)
```
