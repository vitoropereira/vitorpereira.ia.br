# Cartão de visita digital (`/card`)

Página standalone pensada para quem escaneia o QR num evento: um trabalho só,
que é passar o contato pro celular da pessoa antes dela ir embora.

| Rota                                 | O que é                                        |
| ------------------------------------ | ---------------------------------------------- |
| `/card`                              | O cartão. Destino do QR.                       |
| `/card/vitor.vcf`                    | vCard 3.0 servido pelo botão "Salvar contato". |
| `/qr`                                | Tela para MOSTRAR o QR no celular. `noindex`.  |
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

**Estado verificado em 23/08/2026** (via `dig`): o domínio está nos
nameservers da Cloudflare (`elijah`/`aron.ns.cloudflare.com`) e **não tem
nenhum registro MX**. Ou seja, ligar o Email Routing não conflita com nada.

Isso mexe no DNS público do domínio, então é o Vitor quem executa:

1. Dashboard da Cloudflare → domínio `vitorpereira.ia.br` → **Email** →
   **Email Routing**
2. **Destination addresses** → adicionar `vop1234@hotmail.com`
3. A Cloudflare manda um e-mail de verificação para o Hotmail — **clicar no
   link** (sem isso nada funciona)
4. **Custom addresses** → criar `contato@` → encaminhar para o destino
5. Aceitar o **"Add records automatically"**, que cria os MX da Cloudflare e o
   TXT de SPF

### Limitação que importa

Email Routing **só encaminha**. Quando alguém escrever para `contato@` e o
Vitor responder pelo Hotmail, a pessoa vai ver `vop1234@hotmail.com` no
remetente. Para _responder como_ `contato@` é preciso configurar "enviar como"
no cliente de e-mail, com um SMTP — o que o Email Routing não fornece.

Se isso incomodar, as saídas são um Google Workspace/Zoho no domínio, ou
deixar o botão de e-mail apontando direto para um endereço que já envia.

**Enquanto o passo 3 não estiver feito, e-mail para `contato@` volta.** Se o
evento chegar antes disso, troque `cardContact.email` para um endereço que já
recebe.

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

- [ ] `lib/card/config.ts` preenchido (WhatsApp, role, orgs, e-mail)
- [ ] `pnpm gen:card-assets` rodado depois de qualquer mudança de URL
- [ ] Deploy em produção feito
- [ ] **Escanear o QR impresso com um iPhone e com um Android** e salvar o
      contato de verdade, para ver como o nome e a foto caem na agenda
- [ ] `/qr` aberto e favoritado no celular, com brilho no máximo
- [ ] QR impresso levado em papel — sinal de evento cai, celular descarrega
