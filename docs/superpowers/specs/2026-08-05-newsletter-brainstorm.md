# Brainstorm — Newsletter (estado, não spec)

**Data:** 2026-08-05
**Autor:** Vitor (com Claude Code)
**Status:** 🟡 **Brainstorm em andamento** — desenho editorial fechado, técnico-jurídico não começou
**Não é** um spec de implementação. Três dos cinco itens abertos dependem de decisão do Vitor
(um deles, jurídica). Escrever plano agora seria prematuro.

> **Como retomar:** mande "leia `docs/superpowers/specs/2026-08-05-newsletter-brainstorm.md`".
> O desenho editorial está fechado; continue pelas **Questões abertas**.

---

## 1. Ponto de partida

Newsletter estava em **"Fora do escopo do MVP (YAGNI explícito)"** no spec original
(`2026-04-21-vitorpereira-blog-portfolio-design.md` §14), junto com formulário de
contato/Resend. Não existe nada implementado: zero provider, zero tabela, zero lista.

A única menção no site é condicional, na política de privacidade:

> Revise com seu advogado antes de considerá-lo final, especialmente se o site
> começar a receber formulários de contato, newsletter ou processar pagamentos.

## 2. A virada que definiu o desenho

A pergunta inicial era: *"o que faria alguém assinar, em vez de acompanhar o blog?"* —
partindo do pressuposto de que a newsletter precisa ser exclusiva (ler antes, ou ler
o que não é publicado).

**O Vitor derrubou o pressuposto:** ninguém acompanha blog proativamente. O blog não
é a alternativa concorrente — ele é o arquivo canônico; o e-mail é a entrega.

Consequência: a newsletter **não precisa ser exclusiva**. Ela é o cano de distribuição
do que já está sendo escrito. Isso derruba o custo de "quarto formato" que era a
principal objeção contra fazê-la.

## 3. Decisões fechadas

| Decisão | Valor | Por quê |
| --- | --- | --- |
| Cadência | **1 e-mail/semana** | 3/semana (um por post) cansa; semanal respeita a caixa |
| Empacotamento | **Principal completo + 2 chamadas** | ~1.300 palavras, 5-6 min de leitura |
| E-mail carrega | **Texto completo** | e-mail não é indexado → **zero custo de SEO** |
| LinkedIn carrega | **Resumo + link** | é página indexável e se auto-canonicaliza |
| Padrão | **POSSE** — lista própria é canônica | mesmo do TabNews (`2026-07-18-tabnews-syndication-design.md`) |
| Custo alvo | **~10 min/semana** | em cima do que já se escreve; sustentabilidade > qualidade marginal |

### 3.1 A assimetria de SEO (não é óbvia — não perder)

A lição verificada no spec do TabNews — **não espelhar conteúdo completo em plataforma
de alta autoridade**, porque ela se auto-canonicaliza e cria disputa de conteúdo
duplicado — **não se aplica a e-mail**. Newsletter não é indexada pelo Google.

Mas **continua valendo pro LinkedIn Newsletter**, que é página indexável com autoridade
altíssima. Daí os dois canais carregarem coisas diferentes:

| Canal | Conteúdo | Indexado? |
| --- | --- | --- |
| E-mail (lista própria) | texto completo | não → seguro |
| LinkedIn Newsletter | resumo + link | sim → mandar completo competiria com o próprio post |

### 3.2 A conta que matou a "antologia"

Medido nos posts reais do repo (corpo, sem frontmatter):

| Post | Palavras |
| --- | --- |
| Memória de agente | 1.173 |
| Os 4 eixos | 1.186 |
| Limites do agente | 1.026 |
| **Semana 33 somada** | **3.385** |

Posts têm 900–1.400 palavras. Três inteiros num e-mail = **~3.400 palavras, ~15 min de
leitura**. É antologia, não newsletter.

### 3.3 Os três empacotamentos considerados

| Opção | Tamanho | Trabalho novo/semana | Veredito |
| --- | --- | --- | --- |
| Antologia (3 completos) | ~3.400 palavras | zero | ❌ quase ninguém termina |
| **Principal + chamadas** | ~1.300 palavras | ~10 min | ✅ **escolhida** |
| Consolidado (3 reescritos como 1) | ~1.300 palavras novas | 1-2 h | ❌ melhor produto, pior sistema |

Sobre o consolidado — era a ideia original do Vitor e é legitimamente melhor como peça.
Foi descartado por **sustentabilidade**: na primeira semana corrida ele não sai, e
newsletter que falha uma semana perde o hábito do leitor. Vale revisitar se a cadência
de 3 posts/semana se provar folgada.

## 4. Infra existente que serve

A parte cara já está feita:

| Peça | Estado | Onde |
| --- | --- | --- |
| Supabase em produção | ✅ | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` já na Vercel (o `/api/track` depende deles) |
| Padrão de migration | ✅ | `supabase/migrations/0001_vitor_syndication.sql` — tabelas `vitor_*`, RLS deny-all + `REVOKE` |
| Rota server-side que escreve no banco | ✅ | `app/api/track/route.ts` — precedente exato, gated no service_role, com filtro de bot |
| Medição de clique first-party | ✅ | `/api/track` serve pros links da newsletter sem código novo |
| Banner de consent LGPD | ✅ | já gata GA4/Clarity |
| RSS bilíngue | ✅ | 2 feeds válidos |
| Resend + React Email | ✅ | competência existente (usado na Pixel; newsletter semanal automatizada + broadcast ~26,6k) |

**Falta de fato:** tabela de assinantes, rota de inscrição, double opt-in, comando de envio.

## 5. Questões abertas

Em ordem de bloqueio:

1. **[BLOQUEADOR — jurídico] Política de privacidade sair do template.**
   Coletar e-mail = dado pessoal com base legal em consentimento. O documento atual é
   template e ele mesmo avisa que precisa de revisão de advogado antes de receber
   newsletter. **Decisão do Vitor, não técnica.**
2. **LGPD operacional:** double opt-in, prova de consentimento (timestamp), descadastro
   em 1 clique.
3. **Envio:** comando local (`pnpm newsletter`, como `crosspost`) ou automatizado?
   O repo tem precedente forte de CLI local sob demanda — e a decisão anterior de
   descartar o cron de tradução foi nessa direção.
4. **Timing:** envia no dia do post principal, ou fecha a semana?
5. **Captura:** onde entra o formulário de inscrição no site (fim de post? home? página
   própria?).

## 6. Não decidido de propósito

- Provider de envio (Resend é o natural pela competência existente, mas não foi cravado).
- Se a versão EN tem newsletter própria — o `/en` hoje tem **zero posts publicados**,
  então a pergunta é prematura.
- Métrica de sucesso (abertura? clique? crescimento de lista?).

---

## Referências

- `docs/superpowers/specs/2026-07-18-tabnews-syndication-design.md` — padrão POSSE, achado
  verificado sobre conteúdo duplicado
- `docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md` §14 — YAGNI original
- `docs/blog/backlog.md` — cadência editorial e fluxo de publicação agendada
