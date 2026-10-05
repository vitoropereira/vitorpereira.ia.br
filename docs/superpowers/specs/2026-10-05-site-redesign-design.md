# Redesign do site — motion, imagens e didática

**Data:** 2026-10-05
**Autor:** Vitor + Claude (brainstorming)
**Status:** Design aprovado em conversa; aguardando revisão desta spec.
**Base:** `origin/main` em `14acd4f`. Identidade do rebrand de 2026-07-04 (`2026-07-04-vitor-pereira-rebrand-design.md`) mantida: dark, mono, azul `#24C8FF`, "sem hype".

---

## 1. Objetivo

Deixar o site moderno, bonito e **didático**: quem chega entende o que está vendo e o que o Vitor faz, sem precisar saber o vocabulário técnico.

### Público (decisão: C)

| Onde | Fala com | Didática significa |
|---|---|---|
| Home + página do Agente Operacional | gestor/dono de empresa (comprador) | o que é um agente, o que ele faz no meu negócio, como funciona, qual o risco |
| Blog + posts | dev/técnico (audiência do rebrand) | leitura confortável, navegação, bastidor |

### Diagnóstico do estado atual (produção, 2026-10-05)

- Nenhuma animação (entrada, hover, scroll).
- Nenhuma imagem na home. **2 de 17 posts públicos têm capa** (`chatbot-nao-e-agente`, `arquitetura-mental-do-agente`; os outros 2 dos 19 são rascunho). **0 de 15 projetos têm `cover`.**
- Hero só com texto; não mostra o que é um agente operacional.
- Copy da home usa jargão sem explicar (RLS, guardrails, in-product, event-driven).
- 7 seções da home com o mesmo tratamento visual (borda + texto), sem ritmo.
- Página de post: coluna de texto larga demais em monitor grande (~150 caracteres por linha).

A infraestrutura de imagem já existe e está vazia: `ProjectCard` renderiza `cover` de `/images/projects/`, o schema do Velite aceita `cover`, e `pnpm gen:cover` (Gemini "Nano Banana", `GOOGLE_API_KEY`) já gera e anexa ao frontmatter.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Intensidade do motion | **Sóbrio e funcional** — entrada no scroll, hover, contadores, hero animado. Sem parallax, sem transição de página, sem cursor interativo |
| Técnica do motion | **CSS-first + um componente `<Reveal>`** (IntersectionObserver). Zero dependência nova. Seções continuam Server Components |
| Didática da home | Diagrama "como funciona" animado + antes/depois **qualitativo** + FAQ |
| Hero | Log de agente animado, **3 cenários fictícios e neutros alternando** |
| Estilo das imagens geradas | **Seguir o 3D render premium das 2 capas existentes** (blocos foscos, gradiente grafite→cinza claro, fios azuis `#24C8FF`). Decisão revista ao descobrir as capas existentes; substitui a escolha inicial "abstrato técnico" |
| Projetos | **Print real dos sites**, não ilustração |

### Restrições de conteúdo

- **Nenhum exemplo de venda usa fluxo de empresa do Vitor** (ClearSeg, SARCORPS, Pixel, MGM). Essas empresas aparecem só como card de portfólio. Os cenários do hero e do antes/depois são genéricos e fictícios, com rótulo "exemplo de execução" / "exemplo".
- **Nenhum número inventado.** O antes/depois é qualitativo. Números só os que já estão publicados (Proof e portfólio).
- "Sobre" usa só o conteúdo atual de `content/pages/sobre.mdx` e a foto real `public/vitor.png`.

### Fora de escopo

Consent e analytics (decisão de produto/LGPD), rotas e `routeMap`, conteúdo dos posts, embed do Cal.com, Giscus, modo de motion "expressivo".

## 3. Entrega em 4 PRs

Cada PR sai de `origin/main` atualizado, num worktree próprio, e só abre depois que o anterior foi mergeado (exceto ③, que é independente de ① e ②).

| PR | Escopo | Depende de |
|---|---|---|
| ① | Fundação de motion + tokens | — |
| ② | Home redesenhada e didática | ① |
| ③ | Imagens: prints dos projetos + capas dos posts | — |
| ④ | Páginas internas + header/footer | ①, ③ |

## 4. PR ① — Fundação de motion

### Componentes (`components/motion/`)

- **`Reveal.tsx`** (client): envolve filhos (que podem ser Server Components). IntersectionObserver com `threshold` ~0.15, dispara **uma vez** e desconecta. Props: `as` (tag), `delay` (ms), `variant` (`fade-up` padrão, `fade`). Aplica `data-revealed` e a animação é CSS.
- **`Stagger.tsx`** ou prop `stagger` em `Reveal`: atraso incremental pros filhos diretos (grids de cards).
- **`CountUp.tsx`** (client): anima de 0 ao valor quando entra na tela. Recebe o texto final (`"3,6M+"`, `"~700"`) e extrai a parte numérica respeitando prefixo/sufixo e separador do locale. O **texto final está no HTML do servidor** (SEO e leitor de tela); a animação só substitui visualmente depois de hidratar. `aria-hidden` na versão animada, `sr-only` com o valor final.

### Tokens e CSS (`app/globals.css`)

- `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--dur-fast` (150ms), `--dur-base` (300ms), `--dur-slow` (600ms).
- Keyframes `fade-up`, `fade`, `draw` (pra `stroke-dashoffset` de SVG), `blink` (cursor).
- Estado inicial oculto só existe **com JS** (classe no `<html>` setada antes da pintura), pra que sem JS o conteúdo apareça normal.
- **`@media (prefers-reduced-motion: reduce)`**: desliga tudo num lugar só — Reveal mostra direto, CountUp mostra o valor final, log do hero mostra o cenário inteiro estático.

### Hover padrão de card

Utilitário (ex.: `.card-interactive`): translateY(-2px) + borda indo pra `--brand` com baixa opacidade + transição `--dur-base`. Foco de teclado (`:focus-visible`) recebe o mesmo destaque.

### Testes

- `Reveal`: renderiza filhos; aplica `data-revealed` quando o observer dispara (mock de IntersectionObserver); com `prefers-reduced-motion` revela de imediato.
- `CountUp`: valor final presente no HTML inicial; parse de `70+`, `~700`, `3,6M+`, `~400`; reduced-motion mostra só o final.

## 5. PR ② — Home

Ordem final das seções (PT e EN):

| # | Seção | Componente | Status |
|---|---|---|---|
| 1 | Hero | `Hero` | reescrito |
| 2 | Proof | `Proof` | + CountUp |
| 3 | Como funciona | `HowItWorks` | **novo** |
| 4 | Antes / depois | `BeforeAfter` | **novo** |
| 5 | O que eu faço | `Specialties` | copy sem jargão + Reveal |
| 6 | Projetos em destaque | `FeaturedProjects` | prints (vem do PR ③; até lá, fallback sem imagem) |
| 7 | Casos + últimos posts | `CaseStudies`, `LatestPosts` | capas + primeiro item em destaque |
| 8 | FAQ | `Faq` | **novo** |
| 9 | CTA final | `ContactCTA` | mantém |

### 5.1 Hero

- Grid 2 colunas no desktop (texto | janela de log); empilha no mobile (log abaixo dos CTAs, mais baixo).
- Texto: mantém headline, pitch e os dois CTAs atuais.
- **`AgentLog`** (client): janela estilo terminal, título com nome do agente e indicador "● ao vivo" pulsando, rótulo pequeno "exemplo de execução". Linhas aparecem uma a uma (~600ms entre linhas), cursor piscando; ao terminar um cenário, pausa ~2.5s, limpa e passa ao próximo. Pausa quando a aba não está visível ou o hero sai da tela.
- Três cenários (dados em arquivo separado, bilíngue, todos fictícios):
  1. **Atendimento:** mensagem no WhatsApp → pedido identificado → dados conferidos no sistema → resposta enviada.
  2. **Financeiro:** nota fiscal recebida → valores conferidos com o pedido → divergência encontrada → aguardando aprovação → aprovado, lançamento feito.
  3. **Operação:** planilha nova no Drive → linhas validadas → algumas com erro → responsável avisado.
- Cada linha tem horário, ícone de tipo (entrada, leitura, alerta, aprovação humana, concluído) e texto. A linha de **aprovação humana** sempre aparece em pelo menos dois cenários — é a mensagem central.
- Reduced-motion: mostra o cenário 1 completo, estático.
- Altura fixa da janela pra não causar layout shift (CLS).

### 5.2 Como funciona (`HowItWorks`)

- Título orientado ao gestor (ex.: "Como um agente trabalha no seu processo").
- 5 passos, SVG/HTML em código:
  1. **Algo chega** — mensagem, e-mail, arquivo, pedido.
  2. **O agente entende** — lê, extrai, confere com as regras.
  3. **Age nas suas ferramentas** — as que a empresa já usa; não precisa trocar sistema.
  4. **Você aprova o que é sensível** — ações irreversíveis esperam uma pessoa.
  5. **Tudo fica registrado** — dá pra auditar o que foi feito e por quê.
- Desktop: linha horizontal conectando os passos, desenhada com `draw` conforme entra na tela; passos revelam em stagger. Mobile: vertical.
- Sem jargão (proibido nesta seção: RLS, guardrail, LLM, webhook, event-driven).

### 5.3 Antes / depois (`BeforeAfter`)

- Duas colunas, "Hoje" × "Com um agente", processo genérico. Sem números.
- Hoje: alguém copia dado entre sistemas; confere à mão; o erro aparece tarde; ninguém sabe o que foi feito.
- Com agente: executa sozinho o repetitivo; para e pergunta no que é sensível; erro aparece na hora; tudo registrado.
- Rótulo de exemplo. Reveal lado a lado.

### 5.4 O que eu faço

Mantém os 4 itens; descrições reescritas em linguagem de negócio (o termo técnico pode aparecer entre parênteses, nunca sozinho). Cards com `.card-interactive` e Reveal em stagger.

### 5.5 Casos + últimos posts

- `CaseStudies`: primeiro caso em card grande com capa; demais em grid com capa pequena.
- `LatestPosts`: cards com capa e data. Fallback sem capa: bloco com gradiente da marca e o título.

### 5.6 FAQ (`Faq`)

Acordeão acessível (`<details>`/`<summary>` ou o Accordion do `@base-ui/react` já instalado; teclado e leitor de tela funcionando). Perguntas, respostas derivadas do conteúdo já publicado na página do Agente Operacional:

- Isso substitui minha equipe?
- E se a IA errar?
- Preciso trocar os sistemas que uso?
- Quanto tempo leva e quanto custa? (prazo 21–30 dias e preços vêm de `features/booking/services.ts`, mesma fonte da página de serviço)
- Meus dados ficam seguros?

Gera JSON-LD `FAQPage`. O mesmo componente é reutilizado na página do serviço (PR ④).

### Testes

`AgentLog` (renderiza cenário; reduced-motion estático; troca de cenário com timers falsos), `HowItWorks` (5 passos nos dois idiomas), `Faq` (abre/fecha, JSON-LD presente). Testes existentes de `Hero`, `CaseStudies`, `ContactCTA` atualizados.

## 6. PR ③ — Imagens

### 6.1 Prints dos projetos

- Script `scripts/gen-screenshots.ts` (`pnpm gen:screenshots [--only <id>]`), local, nunca na Vercel. Lê `url` de cada projeto em `features/portfolio/data/projects.ts`, abre em Chrome headless com viewport 1440×900 via CDP `Emulation.setDeviceMetricsOverride` (não `--window-size`), espera carregar, fecha banner de cookie se houver (recusando), captura a primeira dobra e salva `public/images/projects/<id>.webp` (largura 1280, via `sharp`, já dependência).
- Preenche `cover: "<id>.webp"` nos 15 projetos. Se um site não carregar, o projeto fica sem `cover` e o script relata.
- Regras do script seguem o gotcha do repo: type-stripping do Node, imports com `.ts`.
- `ProjectCard` ganha moldura de janela de navegador (3 bolinhas + domínio) e zoom leve no hover.
- **Portão:** os prints passam pelo Vitor antes do commit (um site pode estar com banner, erro ou conteúdo que ele não quer exibir).

### 6.2 Capas dos 15 posts públicos sem capa

- Arquivo `content/cover-style.txt` com o **preâmbulo de estilo**, extraído do `cover.prompt.txt` de `arquitetura-mental-do-agente`: render 3D premium 16:9, iluminação de estúdio suave, blocos 3D arredondados e foscos sobre gradiente de grafite quase-preto (esquerda) a cinza claro (direita), fios finos em azul elétrico `#24C8FF` com nós de luz, poucos pontos âmbar; proibido texto, letras, números, robôs, rostos, cérebros azuis, matrix, clichê de placa de circuito; referência Vercel / Linear / Raycast.
- Cada post ganha `cover.prompt.txt` = preâmbulo + uma metáfora visual do tema (escrita por Claude a partir do post).
- Geração: `pnpm gen:cover --post <dir> --attach-frontmatter --ref <as 2 capas existentes>`. As 2 capas existentes não são regeradas.
- `gen:cover` passa a concatenar `content/cover-style.txt` automaticamente; `pnpm new:post` passa a criar o `cover.prompt.txt` por padrão.
- PT e EN compartilham a mesma capa (o `--attach-frontmatter` já escreve nos dois).
- A capa alimenta: card do blog, card de caso, topo do post e imagem OG.
- Rascunhos (`hello-world`, `only-pt-draft`) ficam sem capa.
- **Portão:** folha de contato com as 15 capas novas (mais as 2 existentes, pra comparar) pro Vitor vetar; só as vetadas são regeradas.
- Custo estimado: menos de US$ 2 no total (modelo Flash).

## 7. PR ④ — Páginas internas + header/footer

| Página | Mudanças |
|---|---|
| Post | Coluna de leitura `max-w-[70ch]`; capa no topo; barra de progresso de leitura; TOC com scroll-spy (item ativo destacado); botão copiar em bloco de código; "Posts relacionados" em cards com capa |
| Blog (`/posts`, `/en/posts`) | Grid de cards com capa; primeiro post da página 1 em destaque; chips de tag no topo |
| Tags | Mesmo grid do blog |
| Agente Operacional | Reusa `HowItWorks` e `Faq`; `Map → Evaluate → Deploy → Operate` vira linha do tempo de 4 etapas; "faz / não faz sentido" lado a lado com ✓/✗ |
| Portfólio | Prints com moldura; Reveal em stagger |
| Sobre | Foto em destaque + linha do tempo de carreira, só com fatos do `sobre.mdx` |
| Contato / Agendar | Hierarquia e espaçamento; embed do Cal.com intocado |
| Header | Translúcido com blur depois de rolar; link ativo marcado; menu mobile revisado |
| Footer | Navegação, redes, tagline |

Geral: contraste WCAG AA nos dois temas, `:focus-visible` em todo interativo, nenhuma rolagem horizontal em 375px.

## 8. Verificação (todo PR)

1. `pnpm lint && pnpm typecheck && pnpm test` verdes.
2. `pnpm build` verde.
3. Screenshot real (dev server) em desktop 1440 e mobile 375, tema escuro e claro, PT e EN, das páginas tocadas — olhado antes de entregar.
4. Reduced-motion conferido (emulação no Chrome).
5. Lighthouse da home sem regressão de Performance e CLS em relação à produção atual.

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Animação piorar CLS/LCP | Altura fixa no log do hero; animação só de `opacity`/`transform`; conteúdo no HTML do servidor |
| Capas geradas incoerentes entre si | Preâmbulo fixo + `--ref` da primeira capa + portão de aprovação |
| Print de site com conteúdo indesejado | Portão de aprovação antes do commit |
| Copy didática soar genérica | Conteúdo derivado do que o Vitor já publicou na página de serviço; revisão dele no PR ② |
| Conteúdo sem JS sumir | Estado oculto só com a classe de JS presente |
