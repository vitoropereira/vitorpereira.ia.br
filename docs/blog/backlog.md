# Backlog editorial

> Fila de pautas do blog. Cadência alvo: **3 posts/semana** (ter/qui/sáb).
> Fluxo: Claude gera draft → Vitor lê e ajusta → publica (`draft: false`) → PR.
>
> Última atualização: 2026-08-04.

## Como usar

```bash
pnpm new:post "Título" --date 2026-08-20 --tags agentes,arquitetura
pnpm translate content/posts/2026/08/20/slug   # depois de publicar (precisa de ANTHROPIC_API_KEY)
```

Todo draft nasce com `draft: true` — não vaza em produção. Publicar = trocar pra
`false`. Não há automação de CI: geração é local, sob demanda.

---

## Publicado

| Data | Post | Série |
| --- | --- | --- |
| 2026-05-31 | [Chatbot não é agente](/2026/05/31/chatbot-nao-e-agente) | Agentes #1 |
| 2026-07-18 | [A arquitetura mental de um agente: 7 perguntas](/2026/07/18/arquitetura-mental-do-agente) | Agentes #2 (âncora) |

## Em draft — prontos pra revisão

| Data | Post | Série | Material-fonte |
| --- | --- | --- | --- |
| 2026-07-25 | Ferramentas como contrato | Agentes #3 (pergunta 3) | — |
| 2026-08-04 | Nove números banidos numa noite | War story | MGM: ban WhatsApp → migração Bubble→Next.js em 2 meses + pivot |
| 2026-08-06 | A fila que guarda o payload cru | War story | MGM: RabbitMQ → fila no Postgres com payload raw reprocessável |
| 2026-08-08 | Um pentester leu a conversa de outro cliente | War story | MGM: IDOR achado por hacker ético ~2 meses pós-lançamento |
| 2026-08-11 | Memória de agente: guardar tudo não é ter memória | Agentes #4 (pergunta 4) | Post-âncora + operação da frota |
| 2026-08-13 | Acertou a resposta pelo caminho errado: os 4 eixos | Agentes #5 (pergunta 5) | Post-âncora + pipeline ~700 análises/dia + Scale AI |
| 2026-08-15 | 70 founders ao mesmo tempo | Agentes #6 (pergunta 6) | Agente Sebrae ao vivo: 2.411 msgs / 123 sessões / 70+ simultâneos |

---

## Fila — próximos lotes

### Semana 34 (18–23/08) — fecha a série de agentes

| # | Pauta | Ângulo | Material-fonte |
| --- | --- | --- | --- |
| 1 | **Log de agente não é console.log** | Pergunta 7, fecha a série. Registro de decisão: qual tool, com que argumento, o que voltou, onde falhou. Sem isso o cliente te conta o bug. | Post-âncora §7 + lição "alarme, não dashboard" do post 08/04 |
| 2 | **RLS protege a linha, não a coluna** | Policy `using (auth.uid() = user_id)` deixa o dono escrever *qualquer* coluna — inclusive campos de autoridade do servidor (saldo, score, flags). Fix: `REVOKE UPDATE (coluna)` ou RPC `security definer` com whitelist. | Lição própria, Supabase/Postgres |
| 3 | **O gate de CI que não cobre o que você acha** | "CI verde" só vale se lint e build estão no pipeline. E teste de segurança tem que **afirmar que a escrita não-autorizada falha**, não só que a autorizada passa. | Lição própria |

### Semana 35 (25–30/08) — operação e infra

| # | Pauta | Ângulo | Material-fonte |
| --- | --- | --- | --- |
| 1 | **Frota de IA como código** | 19 agentes governados + supervisor sobre 9 servidores via Tailscale. O que muda quando agente vira infra versionada em vez de script solto. | Pixel: frota + supervisor + multi-tenant isolado |
| 2 | **VPS puro, sem PaaS** | systemd, SSH hardening (key-only, fail2ban, UFW), crons, backups automatizados. O que você aprende operando servidor de agentes 24/7 sem plataforma. | Operação própria |
| 3 | **Copiloto sobre os dados do cliente** | Grounding de contexto em Q&A de linguagem natural — onde resposta plausível-mas-errada é pior que "não sei". | MGM: AI Copilot (autor único), OpenAI + Vercel AI SDK |

### Semana 36 (01–06/09) — IA aplicada a negócio

| # | Pauta | Ângulo | Material-fonte |
| --- | --- | --- | --- |
| 1 | **~700 análises por dia** | Pipeline de sumarização (áudio + LLM, a cada 3 min). Qualidade de output em volume: como se descobre degradação sem ler tudo. | MGM: pipeline + Whisper + loop de revisão |
| 2 | **Revisar código gerado por IA em escala** | O que muda na revisão quando o autor é um modelo: distinguir o que compila do que é correto, mantenível e seguro. | Scale AI — AI Code Reviewer (2024–2025) |
| 3 | **Traduzir agente pra quem não é técnico** | Método da mentoria: como explicar agentes/LLM pra público de negócio sem virar hype nem virar aula de ML. | Mentoria "Funcionário de IA", turma beta nota 9,0 |

---

## Banco de pautas (sem data)

Ideias validadas com material real, aguardando encaixe:

- **Radar → software.** Controle de tráfego aéreo (2007–2022) e o que a disciplina
  de operação crítica ensina sobre decisão sob incerteza em produção. Cuidado:
  fácil virar texto motivacional — só vale com gancho técnico concreto.
- **Broadcast pra 26,6 mil contatos.** O que quebra num disparo desse tamanho:
  rate limit, bounce, reputação de domínio, idempotência.
- **Webhooks de pagamento multi-provedor.** Idempotência, retry, ordem de eventos
  e reconciliação — a parte chata que decide se o dinheiro bate.
- **Multi-tenant com OAuth via Composio.** Isolamento de credencial por cliente
  enterprise numa frota compartilhada.
- **i18n com tooling próprio de auditoria de strings.** pt/en/es no SARCORPS: como
  detectar string órfã e tradução que ficou pra trás.
- **Missão-crítica de verdade.** Padrão IAMSAR e o que muda no design de software
  quando a saída do sistema é uma operação de busca e salvamento.

## Regras de qualidade

Antes de publicar qualquer draft:

- [ ] Todo número no texto é verificável (cv-master ou evidência direta) — nada
      arredondado pra cima
- [ ] Nenhum cliente, pessoa ou empresa exposto sem necessidade
- [ ] Tem pelo menos uma coisa que só quem operou saberia — se o texto poderia
      ter sido escrito lendo docs, não vale publicar
- [ ] Links internos apontam pra posts que existem e estão publicados
- [ ] A tese cabe numa frase, e ela aparece nos primeiros 3 parágrafos
