# US-004: DNS cutover para domínio real

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Task**: `docs/tasks/01/US-004_dns-cutover.md`
> **Status**: Pendente

## Description

Como Vitor, quero o domínio `vitorpereira.ia.br` apontando para a Vercel em vez do servidor PHP antigo, para que o público acesse a nova versão Next.js. **Esta é a única ação destrutiva/irreversível do PRD e requer aprovação explícita do Vitor ("approved") antes de qualquer alteração de DNS.**

## Acceptance Criteria

### Gate de segurança (ANTES de tocar DNS)

- [ ] Senha FTP do hosting PHP antigo rotacionada pelo Vitor no painel do provedor
- [ ] Vitor confirma no chat que a senha foi trocada

### Configuração no Vercel Dashboard

- [ ] Abrir https://vercel.com → projeto `vitorpereira-ia-br` → Settings → Domains
- [ ] Clicar **Add Domain** → digitar `vitorpereira.ia.br` → Add
- [ ] Vercel exibe a configuração DNS requerida (copiar os valores exatos — eles variam por projeto/região)
- [ ] Adicionar também `www.vitorpereira.ia.br` no mesmo fluxo

### Aprovação do Vitor

- [ ] Agente pergunta: "Everything passed acceptance (US-003). Ready to cut DNS over. Rolling back = esperar propagação de novo (até 48h). Approved?"
- [ ] Vitor responde com **"approved"** (ou equivalente claro) registrado no chat

### Atualização dos registros DNS (no registrar do domínio)

- [ ] Remover A record atual apontando para o IP do hosting PHP antigo
- [ ] Adicionar **uma das duas opções** conforme suporte do registrar:
  - **Opção A (preferida se suportado)**: ANAME/ALIAS em `vitorpereira.ia.br` → `cname.vercel-dns.com`
  - **Opção B (fallback universal)**: A record em `vitorpereira.ia.br` → `76.76.21.21` (Vercel default apex IP)
- [ ] CNAME em `www.vitorpereira.ia.br` → `cname.vercel-dns.com`
- [ ] TTL temporariamente baixo (300s ou menos) durante a janela de cutover, volta ao default após validado

### Verificação pós-propagação

- [ ] Vercel Dashboard → Domains → ambos `vitorpereira.ia.br` e `www.vitorpereira.ia.br` mostram **"Valid Configuration"** ✅
- [ ] Certificado TLS (Let's Encrypt) emitido automaticamente pela Vercel (ícone de cadeado no browser)
- [ ] `dig vitorpereira.ia.br` retorna IP da Vercel (não o do PHP antigo)
- [ ] `dig www.vitorpereira.ia.br CNAME` retorna `cname.vercel-dns.com`
- [ ] `https://vitorpereira.ia.br/` serve o Next.js novo (verificar header `x-vercel-id` em Response Headers)
- [ ] `https://www.vitorpereira.ia.br/` redireciona 308 (ou 301) para `https://vitorpereira.ia.br/`
- [ ] Spot-check dos 16 URLs da US-003 agora no domínio real (todas respondem 200 com conteúdo correto)
- [ ] `robots.txt` no domínio real retorna `Allow: /` (production, não preview)

## Implementation Notes

### Rollback plan

Se algo der errado na propagação:

1. Não entre em pânico — Vercel Dashboard mostra erros específicos ("DNS not found", "cert issue", etc.)
2. Se o site ainda não estiver servindo em ≤ 2h, conferir:
   - Records DNS no registrar (copiar/colar exato do Vercel Dashboard)
   - TTL antigo ainda pode estar em cache (usar `dig +trace vitorpereira.ia.br`)
3. Rollback "real" = voltar A record para o IP do PHP antigo, esperar propagar
4. Enquanto propaga, site pode ficar intermitente — comunicar Vitor se crítico

### Notas operacionais

- **Apex vs www**: alguns registrars brasileiros (registro.br) não suportam ALIAS/ANAME em apex. Nesse caso, usar A record fixo `76.76.21.21`. Se Vercel mudar o IP no futuro, precisa reconfigurar manualmente.
- **Cloudflare**: **opção** de colocar Cloudflare em DNS-only (gray cloud) para usar CNAME flattening no apex. Fora do escopo deste PRD, registrado em §8 Open Questions do PRD 01.
- **Janela de propagação**: TLS pode levar de 10 minutos a 2 horas para ser emitido depois que DNS propaga.

### Dependências

- Depends on: US-003 (aceite completo) + gate FTP rotacionado
- Blocks: US-005 (pós-ship exige domínio real)

## Testing

- [ ] Manual: `dig` retorna IPs Vercel em PT e EN (testar de outra máquina se possível para evitar cache local)
- [ ] Manual: `curl -I https://vitorpereira.ia.br/` → 200 com headers Vercel
- [ ] Manual: browser incognito em `https://vitorpereira.ia.br/` e `https://www.vitorpereira.ia.br/` → ambos funcionam
- [ ] Manual: TLS válido (não self-signed, não expired)
