# Kit YouTube — Vitor Pereira (@vitoropereira)

Assets de marca do canal, gerados na **Onda 2** do rebrand.
Sistema visual: dark tech premium, azul elétrico `#24C8FF`, voz de terminal — "IA aplicada em sistemas reais".

> Fonte da verdade da marca: [`docs/superpowers/specs/2026-07-04-vitor-pereira-rebrand-design.md`](../superpowers/specs/2026-07-04-vitor-pereira-rebrand-design.md) (§6 Kit YouTube).

## Arquivos

| Arquivo | Tamanho | Onde usar |
|---|---|---|
| `vitorpereira-youtube-banner-2560x1440.png` | 2560×1440 | Arte do canal (YouTube Studio → Personalização → Banner). Conteúdo-chave dentro da área segura 1546×423. |
| `vitorpereira-youtube-avatar-800x800.png` | 800×800 | Foto do canal (o YouTube recorta em círculo). |
| `vitorpereira-thumbnail-exemplo1-agentes.png` | 1280×720 | Exemplo do template — pilar "agentes & automações". |
| `vitorpereira-thumbnail-exemplo2-sistemas.png` | 1280×720 | Exemplo do template — pilar "sistemas reais / bastidor de CTO". |
| `foto-vitor-recorte-transparente.png` | PNG alpha | Foto sem fundo (reutilizável em qualquer arte). |

## Template de thumbnail (reutilizável)

Estrutura fixa — a cada vídeo troca-se só o conteúdo:

- **Esquerda:** chamada em mono ciano (ex.: "agentes na prática") + título em sans-bold MAIÚSCULO, **1 palavra em ciano**.
- **Fundo:** código / logs / arquitetura reais como **prova** (tela + bastidor).
- **Direita:** recorte do Vitor.
- **Canto sup. esq.:** `vp▮`.
- **Regras:** sem seta amarela, sem cara de choque, sem hype. O sentimento é *"esse cara construiu isso"*.

Filtro editorial (o que vira vídeo): ver §4 do documento mestre.

## Como regenerar / criar novas thumbnails

Os PNGs foram renderizados a partir de artboards HTML (tamanhos exatos) via Chrome headless,
com recorte de fundo por `rembg`. O pipeline não está versionado aqui (vive no scratch da sessão);
peça ao Claude Code "gera a thumbnail do vídeo sobre X" que ele reconstrói a partir deste sistema.

## Pendências / notas

- **Camiseta:** a foto atual é camiseta azul royal (perto do índigo institucional da ClearSeg). Lê como "camiseta azul", usável — mas o ideal para o kit definitivo é uma foto de **camiseta escura**.
- **Aplicação no canal:** feita manualmente pelo Vitor no YouTube Studio (não automatizado).
