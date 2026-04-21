# US-005: Pós-ship — Search Console + validators + uptime

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Task**: `docs/tasks/01/US-005_pos-ship.md`
> **Status**: Pendente

## Description

Como Vitor, quero o domínio indexado no Google com sitemap submetido, SEO re-validado no domínio real e um uptime monitor alertando caso o site caia, para ter o mínimo de observabilidade operacional pós-go-live.

## Acceptance Criteria

### Google Search Console

- [ ] Abrir https://search.google.com/search-console
- [ ] **Add property** → Domain property (recomendado — cobre apex + www + http/https automaticamente)
- [ ] Entrar `vitorpereira.ia.br` (sem https://, sem www)
- [ ] Verificação via **DNS TXT record**:
  - Google fornece um TXT como `google-site-verification=…`
  - Adicionar TXT record no registrar do domínio (nome: `@` ou blank, tipo TXT, valor: o token)
  - Voltar ao Search Console e clicar **Verify**
  - Aguardar até 48h se TXT não for visto imediatamente
- [ ] Property aparece como "Verified" no Search Console
- [ ] **Sitemaps** → **Add a new sitemap** → entrar `sitemap.xml` (não a URL completa, só o path)
- [ ] Status do sitemap: **Success** (pode levar até 24h para processar)
- [ ] Nenhum warning crítico tipo "URL not accessible" (warnings de URLs recém-submetidas são esperados nos primeiros dias)

### Re-validação SEO no domínio real

- [ ] Google Rich Results Test em `https://vitorpereira.ia.br/2026/04/21/hello-world` → `BlogPosting` reconhecido
- [ ] Twitter Card Validator em `https://vitorpereira.ia.br/2026/04/21/hello-world` → `summary_large_image` preview
- [ ] W3C Feed Validator em `https://vitorpereira.ia.br/rss.xml` e `https://vitorpereira.ia.br/en/rss.xml` → RSS 2.0 valid
- [ ] Schema.org validator em post URL → estrutura OK

### Lighthouse domínio real

- [ ] Lighthouse mobile (incognito) em `https://vitorpereira.ia.br/`:
  - Performance ≥ 90
  - SEO ≥ 95
  - Accessibility ≥ 90
  - Best Practices ≥ 90
- [ ] Mesmo para `https://vitorpereira.ia.br/2026/04/21/hello-world`

### Uptime monitor

- [ ] Conta criada em https://uptimerobot.com ou https://healthchecks.io (free tier suficiente)
- [ ] Monitor HTTP criado:
  - URL: `https://vitorpereira.ia.br/`
  - Intervalo: 5 minutos
  - Tipo: HTTPS + verificar keyword (ex: "Vitor Pereira" no HTML response — evita falso positivo de "200 OK com página vazia")
- [ ] Alerta configurado para email do Vitor (SMS opcional)
- [ ] Monitor reporta status **Up** nas primeiras 2 checks consecutivas

### Confirmação final

- [ ] Vitor confirma no chat: "projeto no ar", "shipado", "tudo certo" ou equivalente explícito
- [ ] Agente atualiza `docs/prd/INDEX.md`:
  - PRD 01 status → `Concluído`
  - Remover seção de detalhe (convenção do INDEX.md)

## Implementation Notes

### Arquivos afetados

- `docs/prd/INDEX.md` — update final de status
- Nenhum código

### Notas operacionais

- **DNS TXT para verificação**: se já usar Cloudflare/registrar que permite múltiplos TXT na mesma zona, não há conflito com outros TXT (SPF, DKIM). Adicionar como record separado.
- **Sitemap URL vs path**: Search Console aceita os dois, mas path (`sitemap.xml`) evita confusão com trailing slash.
- **Lighthouse Best Practices**: Next 16 pode reclamar de CSP fraca — se aparecer, não é blocker do PRD 01 (aceitamos Best Practices ≥ 90, não 100). Se regredir abaixo de 90, abrir PRD novo.
- **Sentry / error tracking**: mencionado em Open Questions do PRD, fora do escopo desta US.
- **GA4 / Clarity**: já configurados via env vars da US-002. Confirmar na Search Console e GA4 console que os primeiros eventos aparecem em 24-48h.

### Dependências

- Depends on: US-004 (domínio real precisa estar servindo)
- Blocks: nenhuma (US final do PRD 01)

## Testing

- [ ] Manual: Search Console mostra property verificada e sitemap Success
- [ ] Manual: 4 validators SEO passam no domínio real
- [ ] Manual: Lighthouse scores ≥ 90 em ambas páginas
- [ ] Manual: Uptime monitor reporta Up após 10 min
- [ ] Manual: Forçar falha do uptime (ex: desligar a Vercel temporariamente em dev branch e esperar monitor alertar) — **opcional**, confirma o alerting funciona
