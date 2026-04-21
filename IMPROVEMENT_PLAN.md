# Portfolio Improvement Plan - Vitor Pereira

**Data:** 2025-10-12
**Status:** Planning Phase

---

## 📋 Overview

Plano completo de melhorias do portfólio vitorpereira.ia.br baseado em análise técnica e dados reais dos projetos.

---

## 🎯 Objetivos Principais

1. ✅ Substituir projetos fictícios por projetos reais
2. ✅ Implementar formulário de contato via WhatsApp (uazapi)
3. ✅ Adicionar Microsoft Clarity analytics
4. ✅ Implementar Dark Mode
5. ✅ Migrar Tailwind para build local otimizado
6. ✅ Melhorar SEO (sitemap, schema.org)
7. ✅ Corrigir vulnerabilidade de segurança (credenciais FTP)

---

## 📊 Projetos Reais Identificados

### Projetos Próprios (Owner)

#### 1. **DataClarity IA**

- **URL:** https://www.dataclarityia.com.br
- **Descrição:** Plataforma IA que analisa conversas WhatsApp para insights estratégicos
- **Features:**
  - Análise de sentimento
  - Identificação de palavras-chave e tópicos
  - Resumos automáticos de conversas
  - Monitoramento de qualidade de atendimento
- **Status:** MVP lançando próximo mês
- **Pricing:** R$ 2.998,80/ano (beta testers)
- **Stack:** AI, WhatsApp API, Data Visualization
- **Categoria:** ai, automation

#### 2. **Insight Video IA**

- **URL:** https://www.insightvideoia.com.br
- **Descrição:** Plataforma que transforma vídeos educacionais em recursos de aprendizagem
- **Features:**
  - Transcrição instantânea
  - Geração de e-books, resumos, quizzes
  - Suporte multilíngue
  - Mapas mentais
- **Status:** Em produção (oferece teste grátis)
- **Stack:** AI, Video Processing, Multilingual NLP
- **Categoria:** ai, automation

#### 3. **Calvino**

- **URL:** https://calvino.com.br
- **Descrição:** Chatbot IA especializado para pastores e líderes de igreja
- **Features:**
  - Suporte à pregação expositiva
  - Pesquisa teológica reformada
  - Preparação de sermões
  - Upload e análise de documentos
- **Pricing:** R$ 29,90/mês (7 dias grátis)
- **Stack:** AI, GPT models, Document Processing
- **Categoria:** ai

### Projetos que Trabalha Atualmente

#### 4. **My Group Metrics**

- **URL:** https://mygroupmetrics.com/
- **Descrição:** Ferramenta de gestão e analytics para comunidades WhatsApp
- **Features:**
  - Resumos diários de conversas
  - Relatórios de engajamento
  - Agendamento de mensagens
  - Análise de atividade de membros
- **Metrics:**
  - 250+ gestores de comunidade
  - 190.987+ resumos gerados
  - Crescimento de até 40% no engajamento
- **Pricing:** R$ 890 - R$ 2.999/mês (depende do plano)
- **Stack:** WhatsApp API, Analytics, Bot
- **Categoria:** automation, analytics

#### 5. **Micro-SaaS Brasil**

- **URL:** https://microsaas.com.br/
- **Descrição:** Comunidade e educação sobre criação de Micro-SaaS
- **Features:**
  - Comunidade Pro com mentoria
  - Cursos "Zero to Micro-SaaS" e "Micro-SaaS com AI"
  - Networking entre empreendedores
- **Revenue Potential:** R$ 5k - R$ 50k/mês
- **Stack:** Community Platform, Educational Content
- **Categoria:** education, saas

### Projetos Passados (Não Trabalha Mais)

#### 6. **4trip Agência**

- **URL:** https://4trip.com.br/
- **Descrição:** Agência de turismo receptivo em Alagoas e Pernambuco
- **Services:**
  - Transfers e transporte
  - Tours guiados (Porto de Galinhas, Maragogi, Carneiros)
  - Passeios de buggy e lancha
- **Metrics:**
  - 11.500+ experiências
  - Traveler's Choice TripAdvisor 2023/2024
- **Stack:** React, Node.js, Booking System
- **Categoria:** web, business

#### 7. **AjudaJá**

- **URL:** https://ajudaja.com.br/
- **Descrição:** Plataforma de doações e crowdfunding online
- **Metrics:**
  - R$ 2,7 milhões arrecadados (2025)
  - 124.000+ campanhas
  - 85.000+ usuários engajados
- **Stack:** Web Platform, Payment Integration
- **Categoria:** web, fintech
- **Período:** Ago-Dez 2022

#### 8. **SGCM - Sistema de Gestão de Condomínios Militares**

- **URL:** https://sgcm.com.br/
- **Descrição:** Sistema para gerenciamento de condomínios militares
- **Features:**
  - Apps mobile (iOS/Android)
  - Interface web
  - Suporte WhatsApp
- **Stack:** Mobile (iOS/Android), Web, PHP
- **Categoria:** web, mobile
- **Cliente:** I.V.Tecnologias

---

## 🔧 Melhorias Técnicas Detalhadas

### 1. Atualizar projects.json

**Arquivo:** `data/projects.json`

**Ação:** Substituir projetos fictícios por projetos reais acima

**Estrutura de cada projeto:**

```json
{
    "id": "project-slug",
    "title": "Project Title",
    "excerpt": "Short description (1 linha)",
    "description": "Full description (2-3 linhas)",
    "category": "web|mobile|ai|automation",
    "technologies": ["Tech1", "Tech2", "Tech3"],
    "year": "2024",
    "status": "completed|ongoing|mvp",
    "featured": true|false,
    "client": "Client Name or 'Projeto Próprio'",
    "url": "https://project-url.com",
    "results": [
        "Metric or achievement 1",
        "Metric or achievement 2",
        "Metric or achievement 3"
    ]
}
```

---

### 2. Formulário de Contato WhatsApp (uazapi)

**Arquivo:** `pages/contact.php`

**Integração:**

- Substituir form action por JavaScript
- Enviar dados via fetch para endpoint uazapi
- Formato da mensagem WhatsApp personalizado

**Endpoint necessário:**

- URL da API uazapi
- Token de autenticação
- Número WhatsApp destino

**Perguntas:**

- [ ] Qual a URL do webhook/API da sua instância uazapi?
- [ ] Qual seu número WhatsApp para receber as mensagens?
- [ ] Quer validação de campos antes de enviar?

---

### 3. Microsoft Clarity Analytics

**Arquivos:** `includes/header.php`

**Implementação:**

- Adicionar script do Clarity no `<head>`
- Tracking ID necessário

**Perguntas:**

- [ ] Você já tem uma conta Microsoft Clarity?
- [ ] Precisa criar projeto e pegar o Tracking ID?

---

### 4. Dark Mode

**Arquivos:**

- `includes/header.php` (toggle button)
- `assets/css/custom.css` (dark mode styles)
- `assets/js/main.js` (toggle logic + localStorage)

**Implementação:**

- Toggle button no header
- Classes CSS para dark mode
- Persistência via localStorage
- Transição suave entre modos

**Features:**

- Ícone sol/lua
- Cores dark mode: bg-gray-900, text-gray-100
- Respeitando preferência do sistema (prefers-color-scheme)

---

### 5. Tailwind CSS Build Local

**Arquivos novos:**

- `package.json`
- `tailwind.config.js`
- `postcss.config.js`
- `assets/css/input.css`
- `assets/css/output.css` (gerado)

**Processo:**

1. npm init -y
2. npm install -D tailwindcss postcss autoprefixer
3. npx tailwindcss init
4. Configurar build script
5. Gerar CSS otimizado (apenas classes usadas)

**Benefícios:**

- Redução de ~400KB para ~10-20KB
- Customização total de cores/spacing
- Classes personalizadas

**Build script:**

```json
"scripts": {
  "build:css": "tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --minify",
  "watch:css": "tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch"
}
```

---

### 6. SEO Improvements

#### a) Sitemap.xml dinâmico

**Arquivo novo:** `sitemap.php`

Gerar XML com:

- Páginas estáticas (home, about, portfolio, blog, contact)
- Posts individuais do blog
- Data de última modificação
- Prioridade e frequência de atualização

#### b) Schema.org (JSON-LD)

**Arquivos:** `includes/header.php` ou páginas individuais

**Schemas necessários:**

- Person (página about)
- WebSite (home)
- BlogPosting (posts individuais)
- Organization (footer)

#### c) Meta Tags Otimizadas

- Open Graph para cada página
- Twitter Cards
- Canonical URLs
- Meta description única por página

#### d) robots.txt

**Arquivo novo:** `robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://vitorpereira.ia.br/sitemap.php
```

---

### 7. Segurança - Remover Credenciais FTP

**Arquivos:**

- `.vscode/sftp.json` (remover do git)
- `.gitignore` (adicionar sftp.json)

**Ações:**

1. Adicionar `.vscode/sftp.json` ao `.gitignore`
2. Remover arquivo do histórico git (git filter-branch ou BFG)
3. Alterar senha FTP imediatamente
4. Commit das mudanças

**Comando para remover do histórico:**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .vscode/sftp.json" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📁 Novos Arquivos Necessários

```
vitorpereira.ia.br/
├── package.json (novo)
├── tailwind.config.js (novo)
├── postcss.config.js (novo)
├── sitemap.php (novo)
├── robots.txt (novo)
├── .gitignore (atualizar)
├── assets/
│   └── css/
│       ├── input.css (novo)
│       └── output.css (gerado)
└── api/ (novo - se necessário para uazapi)
    └── contact-handler.php
```

---

## 🎨 Imagens Necessárias

Para cada projeto em projects.json:

1. **Screenshots principais** (1280x720px)
2. **Logos dos projetos** (opcional)
3. **Foto profissional** para página About

**Onde salvar:** `assets/images/projects/`

**Nomeação sugerida:**

- `dataclarityia-hero.jpg`
- `insightvideoia-hero.jpg`
- `calvino-hero.jpg`
- etc.

---

## 🔄 Ordem de Implementação Sugerida

### Fase 1: Correções Críticas (Prioridade Alta)

1. ✅ Remover credenciais FTP do git
2. ✅ Atualizar projects.json com dados reais
3. ✅ Implementar formulário WhatsApp (uazapi)

### Fase 2: Analytics e Performance (Prioridade Média)

4. ✅ Adicionar Microsoft Clarity
5. ✅ Setup Tailwind local (npm)
6. ✅ Build CSS otimizado

### Fase 3: Features e UX (Prioridade Média)

7. ✅ Implementar Dark Mode
8. ✅ Adicionar imagens dos projetos

### Fase 4: SEO (Prioridade Baixa)

9. ✅ Criar sitemap.php
10. ✅ Adicionar Schema.org
11. ✅ Criar robots.txt
12. ✅ Otimizar meta tags

---

## ❓ Perguntas Pendentes

### uazapi Integration

- [ ] URL do webhook/API da instância uazapi?
- [ ] Token de autenticação?
- [ ] Número WhatsApp destino?
- [ ] Formato preferido da mensagem?

### Microsoft Clarity

- [ ] Já tem conta criada?
- [ ] Precisa do Tracking ID?

### Imagens

- [ ] Tem screenshots dos projetos ou precisa que eu capture?
- [ ] Tem logo dos projetos?
- [ ] Tem foto profissional para página About?

### Redes Sociais

- [ ] LinkedIn atualizado?
- [ ] GitHub público?
- [ ] Twitter/X?

---

## 📝 Próximos Passos

1. Você responde as perguntas pendentes acima
2. Eu implemento as mudanças em ordem de prioridade
3. Você testa localmente
4. Deploy para produção

**Tempo estimado total:** 6-8 horas de trabalho
**Tempo por fase:** 1.5-2 horas cada

---

## 💾 Backup Recomendado

Antes de começar:

1. Commit atual: "Backup before major improvements"
2. Export database (se houver)
3. Download completo via FTP

---

## 📊 Métricas de Sucesso

Após implementação, medir:

- ✅ Lighthouse Score (Performance, SEO, Best Practices)
- ✅ Page Load Time (< 2s)
- ✅ CSS Size reduction (de ~400KB para ~20KB)
- ✅ Conversão do formulário de contato
- ✅ Clarity insights (heatmaps, recordings)

---

**Aguardando suas respostas para começar a implementação! 🚀**
