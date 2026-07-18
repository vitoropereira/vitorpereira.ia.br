import type { Project } from "../types";

export const projects: Project[] = [
  {
    id: "clearseg",
    title: "ClearSeg",
    excerpt: {
      pt: "Cobrança recorrente por IA para corretoras de seguros — do arquivo à baixa do boleto.",
      en: "AI-powered recurring billing for insurance brokers — from file to reconciliation.",
    },
    description: {
      pt: "Plataforma para corretoras de seguros: a IA lê os boletos, classifica e extrai os dados, dispara a cobrança no prazo certo com a marca da corretora e reúne a carteira inteira num painel. O segurado acessa boletos e documentos num portal white-label.",
      en: "Platform for insurance brokers: AI reads and classifies the invoices, extracts the data, sends billing on time under the broker's brand, and consolidates the whole book of business in one dashboard. Policyholders access invoices and documents in a white-label portal.",
    },
    category: "ai",
    technologies: ["IA / OCR", "Next.js", "Node.js", "PostgreSQL", "Automação"],
    year: "2025",
    status: "ongoing",
    featured: true,
    client: {
      pt: "Produto próprio · Sócio-fundador & CTO",
      en: "Own product · Co-founder & CTO",
    },
    url: "https://clearseg.com.br",
    results: {
      pt: [
        "Leitura de boletos por IA (classifica, extrai, detecta duplicatas)",
        "Cobrança recorrente no prazo, com a marca da corretora",
        "Portal white-label para o segurado + painel de carteira",
      ],
      en: [
        "AI invoice reading (classify, extract, detect duplicates)",
        "On-time recurring billing under the broker's brand",
        "White-label policyholder portal + book-of-business dashboard",
      ],
    },
    cover: null,
  },
  {
    id: "sarcorps",
    title: "SARCORPS",
    excerpt: {
      pt: "Tecnologia especializada em Busca e Salvamento (SAR) para aviação e defesa.",
      en: "Specialized Search and Rescue (SAR) technology for aviation and defense.",
    },
    description: {
      pt: "Plataforma missão-crítica de gestão de operações de busca e salvamento (padrão internacional IAMSAR), para organizações que planejam, coordenam, executam ou apoiam missões SAR. Assistente LLM in-app e motor Python de dados geoespaciais, com segurança de dados em ambiente multi-tenant sensível.",
      en: "Mission-critical Search and Rescue operations platform (international IAMSAR standard) for organizations that plan, coordinate, run, or support SAR missions. In-app LLM assistant and a Python geospatial data engine, with data security for a sensitive multi-tenant environment.",
    },
    category: "business",
    technologies: ["Nuxt / Vue", "TypeScript", "Supabase", "RLS", "Python"],
    year: "2025",
    status: "ongoing",
    featured: true,
    client: { pt: "Sócio-fundador · Co-lead full-stack", en: "Co-founder · Full-stack co-lead" },
    url: "https://www.sarcorps.com.br/pt",
    results: {
      pt: [
        "Plataforma SAR no padrão internacional IAMSAR",
        "Segurança multi-tenant: RLS / SECURITY DEFINER, JWT, sanitização de PII",
        "i18n pt/en/es com tooling próprio + acessibilidade (WCAG)",
      ],
      en: [
        "SAR platform on the international IAMSAR standard",
        "Multi-tenant security: RLS / SECURITY DEFINER, JWT, PII sanitization",
        "pt/en/es i18n with custom tooling + accessibility (WCAG)",
      ],
    },
    cover: null,
  },
  {
    id: "pixel-ai-hub",
    title: "Pixel AI Hub",
    excerpt: {
      pt: "Agentes de IA que trabalham na sua empresa 24/7, sem equipe técnica.",
      en: "AI agents that work for your business 24/7, no technical team required.",
    },
    description: {
      pt: "Plataforma da Pixel Educação para colocar IA para trabalhar nas empresas: agentes autônomos (WhatsApp/Telegram) para go-to-market, onboarding e diagnóstico, sobre uma plataforma core event-driven, com camada de segurança própria (guardrails anti-injection, gate de abuso, isolamento de dados) e uma frota de IA governada como código.",
      en: "Pixel Educação's platform for putting AI to work in companies: autonomous agents (WhatsApp/Telegram) for go-to-market, onboarding, and diagnosis, on top of an event-driven core platform, with a custom security layer (anti-injection guardrails, abuse gate, data isolation) and an AI fleet governed as code.",
    },
    category: "ai",
    technologies: ["Node.js", "TypeScript", "PostgreSQL", "n8n", "WhatsApp API"],
    year: "2026",
    status: "ongoing",
    featured: true,
    client: {
      pt: "Pixel Educação · Engenheiro de Software",
      en: "Pixel Educação · Software Engineer",
    },
    url: "https://aihub.pixeleducacao.com.br",
    results: {
      pt: [
        "Agentes de IA autônomos com camada de segurança própria",
        "Plataforma core event-driven multi-provedor de pagamentos",
        "Frota de IA como código + infra multi-tenant isolada",
      ],
      en: [
        "Autonomous AI agents with a custom security layer",
        "Event-driven core platform with multi-provider payments",
        "AI fleet as code + isolated multi-tenant infra",
      ],
    },
    cover: null,
  },
  {
    id: "mygroupmetrics",
    title: "My Group Metrics",
    excerpt: {
      pt: "Analytics e IA in-product para comunidades de WhatsApp em escala.",
      en: "In-product analytics and AI for WhatsApp communities at scale.",
    },
    description: {
      pt: "SaaS de analytics de grupos de WhatsApp (dashboard Next.js + backend Node/Express). Fui o engenheiro principal e autor único do AI Copilot — Q&A em linguagem natural sobre os dados de cada cliente — e do pipeline de sumarização por IA que transforma volume de mensagens em decisão.",
      en: "WhatsApp group analytics SaaS (Next.js dashboard + Node/Express backend). I was the principal engineer and sole author of the AI Copilot — natural-language Q&A over each client's data — and of the AI summarization pipeline that turns message volume into decisions.",
    },
    category: "analytics",
    technologies: ["Next.js", "Node.js", "OpenAI", "n8n", "PostgreSQL"],
    year: "2024–2026",
    status: "completed",
    featured: true,
    client: {
      pt: "My Group Metrics · Engenheiro Principal",
      en: "My Group Metrics · Principal Engineer",
    },
    url: "https://mygroupmetrics.com/",
    results: {
      pt: [
        "AI Copilot: Q&A em linguagem natural sobre os dados do cliente",
        "Pipeline de resumos automáticos por IA (áudio + LLM)",
        "Analytics de grupos de WhatsApp em escala",
      ],
      en: [
        "AI Copilot: natural-language Q&A over the client's data",
        "Automatic AI summarization pipeline (audio + LLM)",
        "WhatsApp group analytics at scale",
      ],
    },
    cover: null,
  },
  {
    id: "dataclarityia",
    title: "DataClarity IA",
    excerpt: {
      pt: "Transforme conversas de WhatsApp em inteligência de negócio com IA.",
      en: "Turn WhatsApp conversations into business intelligence with AI.",
    },
    description: {
      pt: "Plataforma que analisa conversas de WhatsApp com IA: extrai insights, identifica padrões, gera resumos automáticos e monitora qualidade — transformando dados de conversa em decisões estratégicas.",
      en: "Platform that analyzes WhatsApp conversations with AI: extracts insights, identifies patterns, generates automatic summaries, and monitors quality — turning conversation data into strategic decisions.",
    },
    category: "ai",
    technologies: ["OpenAI", "NLP", "Python", "Data Analytics", "WhatsApp API"],
    year: "2024",
    status: "ongoing",
    featured: true,
    client: { pt: "Produto próprio", en: "Own product" },
    url: "https://www.dataclarityia.com.br",
    results: {
      pt: [
        "Análise de sentimento e identificação de tópicos",
        "Resumos automáticos e monitoramento de qualidade",
        "Insights acionáveis a partir de conversas",
      ],
      en: [
        "Sentiment analysis and topic identification",
        "Automatic summaries and quality monitoring",
        "Actionable insights from conversations",
      ],
    },
    cover: null,
  },
  {
    id: "chatmatrix",
    title: "chatMatrix",
    excerpt: {
      pt: "Chatbot de IA + WhatsApp oficial + CRM para vender e atender 24/7.",
      en: "AI chatbot + official WhatsApp + CRM to sell and support 24/7.",
    },
    description: {
      pt: "Plataforma de automação de vendas e atendimento no WhatsApp: chatbot com IA integrado ao WhatsApp oficial e a um CRM, para responder, qualificar e vender a qualquer hora.",
      en: "Sales and support automation platform for WhatsApp: an AI chatbot integrated with official WhatsApp and a CRM, to respond, qualify, and sell around the clock.",
    },
    category: "ai",
    technologies: ["IA / LLM", "WhatsApp API", "CRM", "Node.js", "Automação"],
    year: "2025",
    status: "ongoing",
    featured: true,
    client: { pt: "Produto próprio", en: "Own product" },
    url: "https://www.chatmatrix.com.br",
    results: {
      pt: [
        "Chatbot de IA sobre o WhatsApp oficial",
        "CRM integrado para qualificação e vendas",
        "Atendimento e vendas 24/7",
      ],
      en: [
        "AI chatbot on official WhatsApp",
        "Integrated CRM for qualification and sales",
        "24/7 support and sales",
      ],
    },
    cover: null,
  },
  {
    id: "auralooks",
    title: "Aura Looks",
    excerpt: {
      pt: "Estilista virtual com IA: envie uma peça e receba 3 looks completos.",
      en: "AI virtual stylist: send one item and get 3 complete outfits.",
    },
    description: {
      pt: "App de moda com IA: o usuário envia uma peça do próprio guarda-roupa e recebe três looks completos montados por inteligência artificial, desbloqueando o potencial do que já tem.",
      en: "AI fashion app: the user sends one item from their own wardrobe and receives three complete outfits assembled by AI, unlocking the potential of what they already own.",
    },
    category: "ai",
    technologies: ["IA / Visão", "LLM", "Next.js", "Node.js"],
    year: "2025",
    status: "ongoing",
    featured: true,
    client: { pt: "Produto próprio", en: "Own product" },
    url: "https://www.auralooks.com.br/",
    results: {
      pt: [
        "3 looks completos gerados por IA a partir de 1 peça",
        "Recomendação de estilo personalizada",
        "Experiência mobile-first",
      ],
      en: [
        "3 complete AI-generated outfits from 1 item",
        "Personalized style recommendation",
        "Mobile-first experience",
      ],
    },
    cover: null,
  },
  {
    id: "calvino",
    title: "Calvino — Assistente IA Teológico",
    excerpt: {
      pt: "IA para pastores reformados: pregação expositiva e pesquisa teológica.",
      en: "AI for reformed pastors: expository preaching and theological research.",
    },
    description: {
      pt: "Ferramenta de IA focada em teologia reformada: apoio à pregação expositiva, análise exegética, esboços de sermão, pesquisa teológica e análise de documentos, com assistentes personalizados.",
      en: "AI tool focused on reformed theology: support for expository preaching, exegetical analysis, sermon outlines, theological research, and document analysis, with personalized assistants.",
    },
    category: "ai",
    technologies: ["OpenAI", "Document AI", "React", "Node.js"],
    year: "2024",
    status: "ongoing",
    featured: true,
    client: { pt: "Produto próprio", en: "Own product" },
    url: "https://calvino.com.br",
    results: {
      pt: [
        "Apoio à pregação expositiva e análise exegética",
        "Modelo de assinatura ativo",
        "Assistentes de IA personalizados para pastores",
      ],
      en: [
        "Support for expository preaching and exegetical analysis",
        "Active subscription model",
        "Personalized AI assistants for pastors",
      ],
    },
    cover: null,
  },
  {
    id: "insightvideoia",
    title: "Insight Video IA",
    excerpt: {
      pt: "Transforme vídeos educacionais em e-books, resumos e quizzes com IA.",
      en: "Turn educational videos into e-books, summaries, and quizzes with AI.",
    },
    description: {
      pt: "Plataforma que usa IA para transcrever vídeos educacionais e gerar automaticamente materiais didáticos: e-books, resumos, quizzes interativos e mapas mentais, com suporte multilíngue.",
      en: "Platform that uses AI to transcribe educational videos and automatically generate teaching materials: e-books, summaries, interactive quizzes, and mind maps, with multilingual support.",
    },
    category: "ai",
    technologies: ["OpenAI", "Video Processing", "NLP", "React", "Python"],
    year: "2024",
    status: "completed",
    featured: false,
    client: { pt: "Produto próprio", en: "Own product" },
    url: "https://www.insightvideoia.com.br",
    results: {
      pt: [
        "Transcrição automática com alta precisão",
        "Geração automática de materiais educacionais",
        "Suporte a múltiplos idiomas",
      ],
      en: [
        "Automatic transcription with high accuracy",
        "Automatic generation of teaching materials",
        "Multilingual support",
      ],
    },
    cover: null,
  },
  {
    id: "microsaas-brasil",
    title: "Micro-SaaS Brasil",
    excerpt: {
      pt: "Comunidade e educação sobre criação de negócios Micro-SaaS.",
      en: "Community and education on building Micro-SaaS businesses.",
    },
    description: {
      pt: "Plataforma educacional e comunidade de indie hackers focada em ensinar a criar, lançar e escalar Micro-SaaS: cursos práticos, mentoria, networking e automações por trás da operação e da distribuição de produtos digitais.",
      en: "Educational platform and indie-hacker community focused on teaching how to build, launch, and scale Micro-SaaS: practical courses, mentorship, networking, and the automation behind the operation and distribution of digital products.",
    },
    category: "saas",
    technologies: ["Next.js", "Automação", "Community", "SaaS"],
    year: "2023–2026",
    status: "completed",
    featured: false,
    client: { pt: "Produto próprio", en: "Own product" },
    url: "https://microsaas.com.br/",
    results: {
      pt: [
        "Cursos 'Zero to Micro-SaaS' e 'Micro-SaaS com AI'",
        "Comunidade ativa de empreendedores",
        "Automações de operação e distribuição",
      ],
      en: [
        "'Zero to Micro-SaaS' and 'Micro-SaaS with AI' courses",
        "Active community of entrepreneurs",
        "Operation and distribution automation",
      ],
    },
    cover: null,
  },
  {
    id: "4trip",
    title: "4trip Agência Receptiva",
    excerpt: {
      pt: "Plataforma de turismo receptivo no Nordeste (co-founder, exited).",
      en: "Inbound tourism platform in Northeast Brazil (co-founder, exited).",
    },
    description: {
      pt: "Plataforma completa para agência de turismo receptivo especializada em destinos do Nordeste: reservas, gestão de tours, transfers, integração com parceiros e pagamentos online. Co-fundei e depois deixei o projeto (exited).",
      en: "Full platform for an inbound tourism agency specializing in Northeast Brazil: bookings, tour management, transfers, partner integrations, and online payments. I co-founded and later exited the project.",
    },
    category: "web",
    technologies: ["React", "Node.js", "Express", "MongoDB"],
    year: "2020–2025",
    status: "completed",
    featured: false,
    client: { pt: "Co-founder (exited)", en: "Co-founder (exited)" },
    url: "https://4trip.com.br/",
    results: {
      pt: [
        "11.500+ experiências realizadas",
        "Traveler's Choice TripAdvisor 2023 e 2024",
        "Porto de Galinhas, Maragogi e Carneiros",
      ],
      en: [
        "11,500+ experiences delivered",
        "Traveler's Choice TripAdvisor 2023 and 2024",
        "Porto de Galinhas, Maragogi, and Carneiros",
      ],
    },
    cover: null,
  },
  {
    id: "ajudaja",
    title: "AjudaJá — Plataforma de Doações",
    excerpt: {
      pt: "Crowdfunding online focado em impacto social (co-founder).",
      en: "Online crowdfunding focused on social impact (co-founder).",
    },
    description: {
      pt: "Plataforma de crowdfunding e doações online focada em impacto social: criação rápida de campanhas, integração com redes sociais, tracking transparente de doações e gestão de arrecadações.",
      en: "Crowdfunding and online donations platform focused on social impact: fast campaign creation, social media integration, transparent donation tracking, and fundraising management.",
    },
    category: "fintech",
    technologies: ["React", "Node.js", "Payment Gateway"],
    year: "2022",
    status: "completed",
    featured: false,
    client: {
      pt: "Co-founder (2022)",
      en: "Co-founder (2022)",
    },
    url: "https://ajudaja.com.br/",
    results: {
      pt: [
        "R$ 2,7 milhões arrecadados",
        "124.000+ campanhas impulsionadas",
        "85.000+ usuários engajados",
      ],
      en: [
        "R$ 2.7M raised",
        "124,000+ campaigns boosted",
        "85,000+ engaged users",
      ],
    },
    cover: null,
  },
  {
    id: "sgcm",
    title: "SGCM — Gestão de Condomínios",
    excerpt: {
      pt: "Sistema completo para gestão de condomínios (web + mobile).",
      en: "Full management system for condominiums (web + mobile).",
    },
    description: {
      pt: "Plataforma web e mobile para gestão de condomínios: controle de moradores, gestão financeira, comunicação interna, reservas de áreas comuns e suporte via WhatsApp.",
      en: "Web and mobile platform for condominium management: resident control, financial management, internal communication, amenity reservations, and WhatsApp support.",
    },
    category: "web",
    technologies: ["PHP", "MySQL", "React Native", "iOS", "Android"],
    year: "2015–2024",
    status: "completed",
    featured: false,
    client: {
      pt: "I.V. Tecnologias Web",
      en: "I.V. Tecnologias Web",
    },
    url: "https://sgcm.com.br/",
    results: {
      pt: [
        "Apps iOS e Android",
        "Interface web responsiva completa",
        "Gestão de múltiplos condomínios",
      ],
      en: [
        "iOS and Android apps",
        "Full responsive web interface",
        "Management of multiple condominiums",
      ],
    },
    cover: null,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

export function getProjectsByStatus(
  status: "all" | "current" | "past",
): Project[] {
  if (status === "all") return projects;
  if (status === "current")
    return projects.filter((p) => p.status !== "completed");
  return projects.filter((p) => p.status === "completed");
}
