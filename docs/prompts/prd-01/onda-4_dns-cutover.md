# Onda 4 — DNS cutover

> **1 agent** | ~30 min ativo + janela de propagação DNS (até 2h)
> **Pre-requisito**: Onda 3 completa + FTP password rotacionada + aprovação explícita do Vitor

---

## Fluxo operacional (sem CLI)

> **IMPORTANTE**: como nas Ondas 2 e 3, **não usamos Vercel CLI**. Tudo nesta onda é feito via:
> - **Vercel Dashboard** (adicionar domínio, ver status de validação, emissão de cert TLS)
> - **Registrar do domínio** (atualizar A/ANAME/CNAME records)
> - **Terminal local** apenas para `dig`/`curl` (inspeção, não mutação)
> - **PR em `main`** caso algum fix de código seja necessário (mesma regra da Onda 3)

---

## Agent 1 — US-004: DNS cutover para domínio real

```
Implementar US-004 do PRD 01. Ler o task file `docs/tasks/01/US-004_dns-cutover.md` para contexto completo.

ATENÇÃO: Esta é a única ação irreversível/destrutiva do PRD 01. Não executar NENHUM passo de mudança DNS sem ter confirmado:
1. US-003 (Onda 3) está Concluída e Vitor confirmou aceite
2. Senha FTP do hosting PHP antigo foi rotacionada (spec §13)
3. Vitor respondeu "approved" (ou equivalente claro) no chat para este cutover específico

Se qualquer dos 3 não for confirmado, PARAR e pedir explicitamente ao Vitor.

CONTEXTO CRÍTICO: Não usamos Vercel CLI em ponto nenhum. Adicionar domínio = UI do Dashboard. Validar configuração = UI do Dashboard. Se por algum motivo precisar ajustar algum arquivo do repo durante esta onda (raro), o caminho é PR em `main` (Vercel auto-deploya via Git integration).

Resumo do que fazer:
1. Checklist de gates (acima) — não avance sem os 3 checks.

2. Adicionar domínio no Vercel Dashboard:
   - Acessar https://vercel.com → projeto `vitorpereira-ia-br` → Settings → Domains.
   - Clicar **Add Domain** → digitar `vitorpereira.ia.br` → Add.
   - Vercel exibe a configuração DNS requerida — ANOTAR os valores EXATOS (eles variam por conta/região; NÃO assumir valores do task file sem verificar no Dashboard).
   - Adicionar também `www.vitorpereira.ia.br` no mesmo fluxo (Vercel normalmente configura como redirect 308 para o apex automaticamente).

3. Pedir ao Vitor aprovação explícita para o DNS change:
   "Everything passed acceptance (US-003). FTP password rotated. Ready to cut DNS from PHP to Vercel. Rolling back = waiting for DNS propagation again (up to 48h). Approved?"
   Esperar "approved" literal (ou equivalente claro).

4. Guiar o Vitor no registrar do domínio (.ia.br é registrado via Registro.br):
   - Remover A record apontando para IP do hosting PHP antigo
   - Adicionar apex: ANAME/ALIAS → `cname.vercel-dns.com` (preferido) OU A → `76.76.21.21` (fallback universal — Registro.br historicamente não suporta ANAME em apex, então A fixo costuma ser o caminho)
   - Adicionar www CNAME → `cname.vercel-dns.com`
   - TTL temporário baixo (300s) durante janela de cutover; após validado, voltar para default

5. Esperar propagação + TLS:
   - Polling com `dig vitorpereira.ia.br +short` e `dig www.vitorpereira.ia.br +short` para ver IP/CNAME mudarem
   - Vercel Dashboard → Domains → aguardar "Valid Configuration" ✅ em ambos os domínios
   - Usar Monitor ou ScheduleWakeup se demorar — não ficar em sleep loop

6. Validar pós-propagação:
   - `curl -sI https://vitorpereira.ia.br/` — HTTP 200 com headers Vercel (`x-vercel-id`, `server: Vercel`)
   - `curl -sI https://www.vitorpereira.ia.br/` — HTTP 308 Location: https://vitorpereira.ia.br/
   - Browser incognito abrir os 16 URLs do smoke da Onda 3, agora no domínio real
   - Cadeado TLS válido (não self-signed, não expired)

7. Confirmar que robots.txt no domínio real serve `Allow: /`:
   - `curl -s https://vitorpereira.ia.br/robots.txt`
   - esperado: `User-agent: *\nAllow: /` (VERCEL_ENV=production no domínio real)

8. Marcar US-004 como Concluída em `docs/prd/INDEX.md` (4/5 US) via PR em `main` (não commit direto):
   - Branch: `docs/us-004-complete`
   - Commit: `docs(prd): mark US-004 DNS cutover as concluída`
   - PR → aguardar CI verde → merge `--squash --delete-branch`

Arquivos que você PODE modificar (em PR → main):
- `docs/prd/INDEX.md` (status)
- `docs/tasks/01/US-004_dns-cutover.md` (nota final com timestamp do cutover e evidências `dig`/`curl`)

NÃO fazer:
- Rodar Vercel CLI (`vercel`, `vercel domains`, etc.).
- Commit direto em `main` sem PR.
- Alterar código (é puro config externo).
- Alterar env var na Vercel (já ficou da Onda 2).

Se algo der errado durante a propagação:
- NÃO entrar em pânico. TLS pode demorar 10min-2h depois que DNS propaga.
- Se > 2h sem propagar: comparar records DNS byte-a-byte com o que Vercel mostra no Dashboard.
- Rollback real: voltar A record para IP do PHP antigo e esperar propagar. Enquanto isso, site fica intermitente.
- Cache DNS local no Mac: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`

Gotchas:
- Registro.br (domínio .ia.br é BR) tem interface específica e normalmente NÃO suporta ANAME em apex. Use A `76.76.21.21` como fallback direto.
- HSTS: a primeira vez que browser acessa https:// o header HSTS é cachado. Se algo estragar, limpar em `chrome://net-internals/#hsts`.
- "Valid Configuration" na Vercel pode oscilar durante a propagação (aparece e some algumas vezes). Isso é normal — estabiliza quando TTL global dos resolvers atualiza.

Ao final rodar:
- `dig vitorpereira.ia.br +short` e `dig www.vitorpereira.ia.br +short`
- `curl -sI https://vitorpereira.ia.br/ | head -5`
Colar os outputs no chat para evidência do cutover.
```

---

## Validação pós-onda

```bash
# 1. DNS resolve para Vercel
dig vitorpereira.ia.br +short
# esperado: 76.76.21.21 (ou o IP que a Vercel mostrar no Dashboard)

dig www.vitorpereira.ia.br +short
# esperado: cname.vercel-dns.com. seguido do IP Vercel

# 2. HTTPS respondendo no domínio real
curl -sI https://vitorpereira.ia.br/ | head -5
# esperado: HTTP/2 200, header x-vercel-id, server: Vercel

# 3. www redirect
curl -sI https://www.vitorpereira.ia.br/ | head -5
# esperado: HTTP/2 308, location: https://vitorpereira.ia.br/

# 4. TLS válido
curl -sSI https://vitorpereira.ia.br/ 2>&1 | grep -i "expire\|TLS"
# validar data de expiry > 60 dias no futuro

# 5. robots.txt production
curl -s https://vitorpereira.ia.br/robots.txt | head -5
# esperado: "User-agent: *\nAllow: /"

# 6. Certificate chain OK (sanity)
echo | openssl s_client -servername vitorpereira.ia.br -connect vitorpereira.ia.br:443 2>/dev/null | openssl x509 -noout -issuer -subject -dates
# esperado: Issuer=Let's Encrypt, Subject=CN=vitorpereira.ia.br, datas OK

# 7. INDEX.md atualizado (via PR merged)
grep "PRD 01" docs/prd/INDEX.md | head -1
# esperado: "4/5 US"
git log origin/main --oneline -3 | grep "US-004"
# esperado: commit de docs presente em origin/main
```

**Checkpoint**: domínio real servindo Next.js com TLS + US-004 `Concluída`. Avançar para pós-ship.
