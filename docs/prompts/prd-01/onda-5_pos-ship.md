# Onda 5 — Pós-ship: Search Console + validators + uptime

> **1 agent** | ~20-30 min ativo + ~24h para sitemap indexar
> **Pre-requisito**: Onda 4 completa (domínio real servindo o Next.js)

---

## Agent 1 — US-005: Pós-ship — Search Console + validators + uptime

```
Implementar US-005 do PRD 01. Ler o task file `docs/tasks/01/US-005_pos-ship.md` para contexto completo.

Resumo do que fazer:
1. Google Search Console:
   - Guiar o Vitor para abrir https://search.google.com/search-console e adicionar property como "Domain" (cobre apex + www automaticamente): `vitorpereira.ia.br`
   - Google fornece um TXT record (google-site-verification=...). Instruir o Vitor a adicionar no registrar do domínio (tipo TXT, nome @ ou blank, valor = token)
   - Esperar propagação (pode levar até 48h, tipicamente minutos). Voltar ao Search Console e clicar Verify.
   - Após verified: Sitemaps → Add a new sitemap → "sitemap.xml" → aguardar status Success.
2. Re-validar SEO no domínio REAL (não mais a URL provisória):
   - Google Rich Results Test em `https://vitorpereira.ia.br/2026/04/21/hello-world` → BlogPosting OK
   - Twitter Card Validator em mesma URL → summary_large_image preview
   - W3C Feed Validator em `https://vitorpereira.ia.br/rss.xml` e `https://vitorpereira.ia.br/en/rss.xml`
   - Schema.org validator em post URL
3. Lighthouse mobile incognito no domínio real (`/` e post example): Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90, Best Practices ≥ 90.
4. Uptime monitor:
   - Criar conta no UptimeRobot (https://uptimerobot.com) ou HealthChecks.io — free tier suficiente
   - Monitor HTTPS em `https://vitorpereira.ia.br/`
   - Intervalo: 5 minutos
   - Keyword check no HTML response (ex: "Vitor Pereira") para evitar falso positivo de 200 OK vazio
   - Alerta por email para o Vitor (SMS opcional)
   - Confirmar status Up nas 2 primeiras checks consecutivas (esperar ~10min)
5. Confirmação final:
   - Pedir explicitamente ao Vitor: "Tudo pronto. Posso marcar o projeto como shipado?"
   - Esperar confirmação clara ("sim", "shipado", "projeto no ar")
6. Após confirmação:
   - Atualizar `docs/prd/INDEX.md`:
     - PRD 01 status: `Em andamento` → `Concluído`
     - Progresso: `5/5 US`
     - Remover seção de detalhe "## PRD 01: Deploy & go-live" (convenção do INDEX)
   - Marcar US-005 como Concluída no task file

Arquivos que você PODE modificar:
- `docs/prd/INDEX.md` (update final de status + remover detalhe)
- `docs/tasks/01/US-005_pos-ship.md` (nota final)

NÃO alterar:
- Código
- Outros task files
- PRD 02 (é tech-debt, outro tracker)

Gotchas conhecidos:
- Google pode demorar para ver o TXT. `dig vitorpereira.ia.br TXT +short` no Mac para validar propagação local.
- Sitemap com status "Couldn't fetch" geralmente significa sitemap.xml retornou 404, 500 ou redirect. Testar manualmente: `curl -sI https://vitorpereira.ia.br/sitemap.xml` deve retornar 200.
- UptimeRobot free tier: 50 monitors, 5min interval. Mais que suficiente. Se preferir HealthChecks, é pull-based (site precisa pingar o HealthChecks, modelo diferente — menos recomendado para este caso).
- Best Practices Lighthouse < 90 pode ser CSP fraca ou deprecations. Não bloqueia US-005 — sinalizar no chat para PRD futuro se score < 90.

Após confirmação final do Vitor no chat, parabenizar (de forma sóbria) e comunicar que:
- O PRD 01 está Concluído
- PRD 02 (tech-debt) está disponível para execução futura — ver `docs/prompts/prd-02/`
- Legacy-php branch continua acessível via `git show legacy-php:<path>` para arqueologia

Ao final rodar: `git log origin/main..HEAD --oneline` para conferir se há commits não pushados da onda (update do INDEX + task note), e pushar com `git push origin main` se houver.
```

---

## Validação pós-onda

```bash
# 1. Sitemap respondendo em domínio real
curl -sI https://vitorpereira.ia.br/sitemap.xml | head -3
# esperado: HTTP/2 200

# 2. robots.txt permitindo indexação
curl -s https://vitorpereira.ia.br/robots.txt
# esperado contém "Allow: /"

# 3. INDEX.md reflete conclusão
grep "PRD 01" docs/prd/INDEX.md | head -1
# esperado: "Concluído" e "5/5 US"

# 4. Sem detalhe de PRD 01 (convenção do INDEX)
grep -c "## PRD 01:" docs/prd/INDEX.md
# esperado: 0 (foi removido)

# 5. Commits locais sincronizados
git log origin/main..HEAD --oneline | wc -l
# esperado: 0
```

**Checkpoint**: projeto **shipado** — PRD 01 `Concluído`, site indexando no Google, uptime monitor ativo. 🎉
