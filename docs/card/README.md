# Cartão de visita digital (`/card`)

Página standalone pensada para quem escaneia o QR num evento: um trabalho só,
que é passar o contato pro celular da pessoa antes dela ir embora.

| Rota                               | O que é                                        |
| ---------------------------------- | ---------------------------------------------- |
| `/card`                            | O cartão. Destino do QR.                       |
| `/card/vitor.vcf`                  | vCard 3.0 servido pelo botão "Salvar contato". |
| `/qr`                              | Tela para MOSTRAR o QR no celular. `noindex`.  |
| `public/card/qr-card.svg` / `.png` | O mesmo QR para imprimir em crachá/adesivo.    |

## 1. Antes do evento — preencher

Tudo que precisa de decisão humana está em **`lib/card/config.ts`**, marcado
com `PREENCHER`. Nada mais no código precisa mudar.

| Campo                         | O que fazer                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cardContact.whatsapp`        | Número em E.164 sem `+`, ex.: `"5541999998888"`. Enquanto for `null`, o botão do WhatsApp simplesmente não aparece e o vCard sai sem `TEL` — a página não quebra. |
| `cardContact.whatsappPrefill` | Mensagem que já vem digitada quando a pessoa abre a conversa. Hoje menciona o Startup Summit; troque depois do evento.                                            |
| `cardIdentity.role`           | Vai no `TITLE` do vCard — é o que aparece embaixo do nome na agenda de quem salvar. Hoje está num placeholder genérico.                                           |
| `cardIdentity.orgs`           | Lista vazia = nenhuma organização no vCard. Preencha se quiser ClearSeg/SARCORPS ali.                                                                             |
| `cardContact.email`           | Ver a seção 3.                                                                                                                                                    |

## 2. Regenerar o QR

O QR é pré-gerado e commitado — não é montado em runtime.

```
pnpm gen:card-assets
```

Isso reescreve `public/card/qr-card.svg`, `qr-card.png` (1024px) e
`lib/card/photo.generated.ts` (a foto embutida no vCard).

Para apontar o QR para outra URL:

```
pnpm gen:card-assets --url https://vitorpereira.ia.br/card?ref=cracha
```

O QR usa correção de erro nível **H** (~30% da área pode estar danificada e
ele ainda lê) porque crachá amassa e adesivo descasca.

## 3. `contato@vitorpereira.ia.br` — Cloudflare Email Routing

**Ativo desde 23/08/2026.** O e-mail do cartão é o do domínio; a Cloudflare
encaminha para a caixa pessoal. Verificado por `dig` e por teste de entrega
real (mensagem enviada de outro endereço chegou no destino):

```
MX   5  route3.mx.cloudflare.net
     30 route1.mx.cloudflare.net
     52 route2.mx.cloudflare.net
TXT  v=spf1 include:_spf.mx.cloudflare.net ~all
```

Por que o endereço do domínio e não o pessoal: `/card` é página pública ligada
a QR impresso. Endereço exposto ali vira alvo de scraping em caráter
permanente, e e-mail pessoal não se rotaciona. `contato@` desliga ou redireciona
pelo painel, sem tocar na caixa pessoal.

### Limitação que continua valendo

Email Routing **só encaminha**. Ao responder pela caixa pessoal, o destinatário
vê o endereço pessoal no remetente — o Routing resolve o _receber_, não o
_responder como_. Para responder como `contato@` é preciso um SMTP, que ele não
fornece: seria Google Workspace ou Zoho no domínio.

### Se precisar refazer

1. Dashboard da Cloudflare → domínio → **Email** → **Email Routing**
2. **Destination addresses** → adicionar a caixa de destino
3. Clicar no link de verificação que chega nessa caixa — é o passo que trava
4. **Custom addresses** → criar `contato@` → apontar para o destino
5. Aceitar **"Add records automatically"** (MX + TXT de SPF)

Depois de configurar, **mandar um e-mail de teste de outro endereço e conferir
que chegou**, lixo eletrônico incluso. Painel configurado não é entrega
funcionando, e a falha aqui é silenciosa: o endereço engole mensagem sem avisar.

## 4. Medição

`/card` fica fora do grupo `(site)`, então não tem GA, Clarity nem banner de
consentimento. A medição vem do Vercel Analytics, que já está no root layout e
é cookieless:

- **pageview** de `/card` — quantas pessoas escanearam
- evento **`card_click`** com `target` (`vcard`, `whatsapp`, `email`,
  `linkedin`, …) — o que elas clicaram

O QR aponta para `/card?ref=qr`, então dá para separar quem veio do QR de quem
chegou pelo link.

## 5. Checklist do dia

- [x] `lib/card/config.ts` preenchido (WhatsApp, role, e-mail)
- [x] Email Routing ativo e testado com entrega real
- [ ] `pnpm gen:card-assets` rodado depois de qualquer mudança de URL
- [ ] Deploy em produção feito
- [ ] **Escanear o QR impresso com um iPhone e com um Android** e salvar o
      contato de verdade, para ver como o nome e a foto caem na agenda
- [ ] `/qr` aberto e favoritado no celular, com brilho no máximo
- [ ] QR impresso levado em papel — sinal de evento cai, celular descarrega
