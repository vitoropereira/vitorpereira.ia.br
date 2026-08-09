# Divulgação — Masterclass "Seu Funcionário de IA" (11/08/2026)

> Textos prontos para publicação **manual**. Nada aqui foi publicado.
> Escrito em 09/08/2026, com base na análise do acervo do TabNews
> (post do @fernandomorais, 30.223 posts / 119.981 comentários, apuração de 31/07/2026).

## Fatos verificados

Fonte: `https://masterclass.vitorpereira.ia.br/`, lida em 09/08/2026.

| Campo | Valor |
| --- | --- |
| Nome | Masterclass "Seu Funcionário de IA" |
| Data | terça-feira, 11/08/2026 |
| Horário | 20h às 21h30 (1h30) |
| Onde | Ao vivo no Google Meet |
| Preço | Gratuito — sem cadastro, sem cartão |
| Entrada | Grupo do WhatsApp; o link do Meet sai no grupo antes do dia |
| Grupo | https://chat.whatsapp.com/Cn0ZR3VEkYF9cRMNi8PsB3 |
| Contato direto | https://wa.me/5581996733973 |
| Vagas | Limitadas pelo tamanho da sala (sem contador regressivo na página) |

Números citados na landing (usados nos textos abaixo): 3,6M+ interações em ~2.900
grupos; ~700 análises automáticas por dia; 70+ pessoas simultâneas ao vivo; 19+
agentes governados com código, com guardrails anti-injection e gate de abuso;
primeira turma da masterclass com nota média 9,0.

---

## Estratégia (por que dois textos e não um)

Do acervo do TabNews:

- Post promocional cru no feed orgânico é candidato a enterro. Bastam **2 votos
  contra** pra sair do radar, e 69% das 1.836 publicações que perderam relevância
  levaram no máximo 3 votos contra.
- Divulgação direta tem canal próprio: o **post patrocinado**. Custa 100 TabCash
  (`initialTabCash = 100` em `models/content.js`) — a conta `@vitorpereirasaas`
  tem 148, então dá pra fazer um.
- O feed orgânico premia **texto próprio, longo e completo**: acima de 2 mil
  palavras rende 10,80 tabcoins de média, contra 2,22 abaixo de 100. Link externo
  ganha 20% mais moeda mas corta 41% dos comentários.

Por isso: **A** vai no slot patrocinado, **B** é só um rodapé no crosspost orgânico
do post que já está agendado pro dia 11.

---

## A — Post patrocinado (divulgação direta)

**Título:**

```
Masterclass gratuita: um agente autônomo rodando ao vivo, sem demo gravada (ter 11/08, 20h)
```

**Corpo:**

```markdown
Terça, 11/08, das 20h às 21h30, eu vou abrir a tela e deixar um agente autônomo
meu rodando no Telegram, operando um negócio real, ao vivo. Se quebrar, quebra na
frente de todo mundo.

A tese é a mesma que eu já escrevi aqui: chatbot não é agente. A diferença não
está no modelo, está na operação — memória, rotina, acesso a ferramenta e
iniciativa própria. Um responde quando você chama. O outro trabalha enquanto você
dorme.

O que cabe em 1h30:

- **A virada de chave.** Chat × funcionário de IA, e os níveis de autonomia — por
  que quase todo mundo trava no primeiro.
- **Um agente real operando.** No Telegram, na hora, na minha tela. Sem gravação,
  sem mock, sem corte.
- **As peças por baixo.** O que roda onde, quanto custa por mês de verdade, e o
  que você precisa ter pra montar o seu. Pergunta aberta no final.

De onde eu falo: opero agentes em produção. São 3,6M+ interações processadas em
~2.900 grupos num copiloto que construí, ~700 análises automáticas por dia num
pipeline que mantenho, e mais de 19 agentes governados com código, com guardrails
anti-injection e gate de abuso. Já coloquei um agente no ar pra 70+ pessoas
simultâneas, ao vivo, sem rede.

Gratuito, sem cadastro e sem cartão. A turma é pequena porque em 1h30 com pergunta
aberta não dá pra atender mais gente — não tem contador regressivo na página, e
não vai ter.

Detalhe pra quem é da casa: pode trazer sua IA de notas. No dia eu autorizo a
entrada dela.

Entrar no grupo (o link do Meet sai por lá antes do dia):
https://chat.whatsapp.com/Cn0ZR3VEkYF9cRMNi8PsB3

Página com tudo: https://masterclass.vitorpereira.ia.br
```

---

## B — Rodapé para o crosspost orgânico

Vai no fim do crosspost do post "Memória de agente" (agendado pro dia 11/08 às
10h), depois do CTA que a ferramenta já anexa. O post fala de memória; a
masterclass mostra memória rodando. A amarra é honesta.

```markdown
---

**Vou mostrar isso rodando hoje à noite.** Terça, 11/08, 20h às 21h30, no Google
Meet: um agente autônomo meu operando no Telegram, na tela, sem gravação.
Gratuito, sem cadastro, turma pequena.

[Entrar no grupo da turma](https://chat.whatsapp.com/Cn0ZR3VEkYF9cRMNi8PsB3) ·
[detalhes](https://masterclass.vitorpereira.ia.br)
```

---

## Execução

| Quando | O quê | Comando / ação |
| --- | --- | --- |
| 11/08, ~10h | Post "Memória de agente" entra sozinho no site | nada — o `date:` do frontmatter resolve |
| 11/08, ~11h | Crosspost orgânico (pico de tráfego do TabNews) | `pnpm crosspost content/posts/2026/08/11/memoria-de-agente --format full --dry-run`, colar o rodapé **B** no preview, rodar sem `--dry-run` |
| 11/08, ~11h | Post patrocinado com o texto **A** | manual, pela interface do TabNews (gasta 100 dos 148 TabCash) |

`--format full`, não `summary`. O crosspost anterior ("Chatbot não é agente") saiu
com 176 palavras em formato resumo e fechou com 1 tabcoin, zero voto e zero
comentário — exatamente o perfil que o acervo mostra como o que não engaja.
