# Onda 4 — DNS cutover

> **1 agent** | ~30 min ativo + janela de propagação DNS (até 2h)
> **Pre-requisito**: Onda 3 completa + FTP password rotacionada + aprovação explícita do Vitor

---

## Agent 1 — US-004: DNS cutover para domínio real

```
Implementar US-004 do PRD 01. Ler o task file `docs/tasks/01/US-004_dns-cutover.md` para contexto completo.

ATENÇÃO: Esta é a única ação irreversível/destrutiva do PRD 01. Não executar NENHUM passo de mudança DNS sem ter confirmado:
1. US-003 (Onda 3) está Concluída e Vitor confirmou aceite
2. Senha FTP do hosting PHP antigo foi rotacionada (spec §13)
3. Vitor respondeu "approved" (ou equivalente claro) no chat para este cutover específico

Se qualquer dos 3 não for confirmado, PARAR e pedir explicitamente ao Vitor.

Resumo do que fazer:
1. Checklist de gates (acima) — não avance sem os 3 checks.
2. Adicionar domínio em Vercel Dashboard → projeto `vitorpereira-ia-br` → Settings → Domains → Add Domain → `vitorpereira.ia.br`. Depois adicionar também `www.vitorpereira.ia.br`.
3. Anotar os records DNS EXATOS que a Vercel mostra (eles variam por conta/região — NÃO assumir valores do task file sem verificar no Dashboard).
4. Pedir ao Vitor aprovação explícita para o DNS change:
   "Everything passed acceptance (US-003). FTP password rotated. Ready to cut DNS from PHP to Vercel. Rolling back = waiting for DNS propagation again (up to 48h). Approved?"
   Esperar "approved" literal (ou equivalente claro).
5. Guiar o Vitor no registrar do domínio:
   - Remover A record apontando para IP do hosting PHP antigo
   - Adicionar apex: ANAME/ALIAS → cname.vercel-dns.com (preferido) OU A → 76.76.21.21 (fallback)
   - Adicionar www CNAME → cname.vercel-dns.com
   - TTL temporário baixo (300s) durante janela de cutover
6. Esperar propagação + TLS:
   - Polling com `dig vitorpereira.ia.br +short` para ver IP mudar
   - Vercel Dashboard → Domains → aguardar "Valid Configuration" ✅
   - Usar Monitor ou ScheduleWakeup se demorar — não ficar em sleep loop
7. Validar pós-propagação:
   - `curl -sI https://vitorpereira.ia.br/` — HTTP 200 com headers Vercel
   - `curl -sI https://www.vitorpereira.ia.br/` — HTTP 308 Location: https://vitorpereira.ia.br/
   - Browser incognito abrir os 16 URLs do smoke da Onda 3, agora no domínio real
   - Cadeado TLS válido (não self-signed)
8. Confirmar que robots.txt no domínio real serve `Allow: /` (production scope)
9. Marcar US-004 como Concluída em `docs/prd/INDEX.md` (4/5 US).

Arquivos que você PODE modificar:
- `docs/prd/INDEX.md` (status)
- `docs/tasks/01/US-004_dns-cutover.md` (nota final com timestamp do cutover)

NÃO alterar:
- Nenhum arquivo de código (é puro config externo)
- Nenhum env var na Vercel (já ficou da Onda 2)

Se algo der errado durante a propagação:
- NÃO entrar em pânico. TLS pode demorar 10min-2h depois que DNS propaga.
- Se > 2h sem propagar: comparar records DNS byte-a-byte com o que Vercel mostra.
- Rollback real: voltar A record para IP do PHP antigo e esperar propagar. Enquanto isso, site fica intermitente.
- Cache DNS local no Mac: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`

Gotchas:
- Registro.br (se o domínio for .br) tem interface específica. Pode não suportar ANAME em apex. Use A 76.76.21.21 como fallback.
- HSTS: a primeira vez que browser acessa https:// o header HSTS é cachado. Se algo estragar, limpar em `chrome://net-internals/#hsts`.

Ao final rodar: `dig vitorpereira.ia.br +short` e `dig www.vitorpereira.ia.br +short` — colar os outputs no chat para evidência do cutover.
```

---

## Validação pós-onda

```bash
# 1. DNS resolve para Vercel
dig vitorpereira.ia.br +short
# esperado: 76.76.21.21 ou similar

dig www.vitorpereira.ia.br +short
# esperado: cname.vercel-dns.com. + IP Vercel

# 2. HTTPS respondendo no domínio real
curl -sI https://vitorpereira.ia.br/ | head -3
# esperado: HTTP/2 200, server/x-vercel-id nos headers

# 3. www redirect
curl -sI https://www.vitorpereira.ia.br/ | head -3
# esperado: HTTP/2 308, location: https://vitorpereira.ia.br/

# 4. TLS válido
curl -sSI https://vitorpereira.ia.br/ 2>&1 | grep -i "expire\|TLS"
# validar data de expiry > 60 dias no futuro

# 5. robots.txt production
curl -s https://vitorpereira.ia.br/robots.txt | head -5
# esperado: "User-agent: *\nAllow: /"

# 6. INDEX.md atualizado
grep "PRD 01" docs/prd/INDEX.md | head -1
# esperado: "4/5 US"
```

**Checkpoint**: domínio real servindo Next.js com TLS + US-004 `Concluída`. Avançar para pós-ship.
