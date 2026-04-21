import type { Project } from "../types";

export const projects: Project[] = [
  {
    id: "dataclarityia",
    title: "DataClarity IA",
    excerpt: {
      pt: "Plataforma IA que analisa conversas WhatsApp para insights estratégicos de negócio",
      en: "AI platform that analyzes WhatsApp conversations for strategic business insights",
    },
    description: {
      pt: "Sistema avançado de análise de conversas WhatsApp com IA, oferecendo identificação de palavras-chave, análise de sentimento, resumos automáticos e monitoramento de qualidade em tempo real para transformar dados em decisões estratégicas.",
      en: "Advanced AI-powered WhatsApp conversation analysis system offering keyword identification, sentiment analysis, automatic summaries, and real-time quality monitoring to turn data into strategic decisions.",
    },
    category: "ai",
    technologies: ["OpenAI", "WhatsApp API", "Python", "Data Analytics", "NLP"],
    year: "2024",
    status: "mvp",
    featured: true,
    client: "Projeto Próprio",
    url: "https://www.dataclarityia.com.br",
    results: {
      pt: [
        "MVP em lançamento com 10 beta testers",
        "Análise de sentimento em tempo real",
        "Identificação automática de tópicos e tendências",
      ],
      en: [
        "MVP launching with 10 beta testers",
        "Real-time sentiment analysis",
        "Automatic topic and trend identification",
      ],
    },
    cover: null,
  },
  {
    id: "insightvideoia",
    title: "Insight Video IA",
    excerpt: {
      pt: "Transforme vídeos educacionais em e-books, resumos e quizzes com IA",
      en: "Turn educational videos into e-books, summaries, and quizzes with AI",
    },
    description: {
      pt: "Plataforma que utiliza IA para transcrever vídeos educacionais e gerar automaticamente materiais didáticos diversos como e-books, resumos, quizzes interativos e mapas mentais. Suporte multilíngue e edição flexível de conteúdo gerado.",
      en: "Platform that uses AI to transcribe educational videos and automatically generate teaching materials such as e-books, summaries, interactive quizzes, and mind maps. Multilingual support and flexible editing of generated content.",
    },
    category: "ai",
    technologies: ["OpenAI", "Video Processing", "NLP", "React", "Python"],
    year: "2024",
    status: "completed",
    featured: true,
    client: "Projeto Próprio",
    url: "https://www.insightvideoia.com.br",
    results: {
      pt: [
        "Transcrição instantânea com alta precisão",
        "Geração automática de materiais educacionais",
        "Suporte a múltiplos idiomas",
      ],
      en: [
        "Instant transcription with high accuracy",
        "Automatic generation of educational materials",
        "Multilingual support",
      ],
    },
    cover: null,
  },
  {
    id: "calvino",
    title: "Calvino — Assistente IA Teológico",
    excerpt: {
      pt: "Chatbot especializado para pastores com pesquisa teológica reformada",
      en: "Specialized chatbot for pastors with reformed theological research",
    },
    description: {
      pt: "Assistente de IA focado em teologia reformada, oferecendo suporte à pregação expositiva, pesquisa teológica, preparação de sermões e análise de documentos. Inclui modelos avançados de IA e assistentes personalizados.",
      en: "AI assistant focused on reformed theology, offering support for expository preaching, theological research, sermon preparation, and document analysis. Includes advanced AI models and personalized assistants.",
    },
    category: "ai",
    technologies: ["OpenAI", "GPT-4", "Document AI", "React", "Node.js"],
    year: "2024",
    status: "completed",
    featured: true,
    client: "Projeto Próprio",
    url: "https://calvino.com.br",
    results: {
      pt: [
        "R$ 29,90/mês — modelo de assinatura ativo",
        "Conversas ilimitadas e upload de documentos",
        "Suporte prioritário para pastores e teólogos",
      ],
      en: [
        "R$ 29.90/month active subscription model",
        "Unlimited conversations and document uploads",
        "Priority support for pastors and theologians",
      ],
    },
    cover: null,
  },
  {
    id: "mygroupmetrics",
    title: "My Group Metrics",
    excerpt: {
      pt: "Analytics e gestão de comunidades WhatsApp com crescimento de até 40%",
      en: "Analytics and management for WhatsApp communities with up to 40% growth",
    },
    description: {
      pt: "Ferramenta completa de gestão e analytics para comunidades WhatsApp, oferecendo resumos diários, relatórios de engajamento, identificação de hot topics, agendamento de mensagens e análise detalhada de atividade de membros.",
      en: "Complete management and analytics tool for WhatsApp communities, offering daily summaries, engagement reports, hot-topic identification, message scheduling, and detailed member activity analysis.",
    },
    category: "automation",
    technologies: [
      "WhatsApp API",
      "N8N",
      "Analytics",
      "Bot",
      "Data Visualization",
    ],
    year: "2024",
    status: "completed",
    featured: true,
    client: "My Group Metrics (Desenvolvedor)",
    url: "https://mygroupmetrics.com/",
    results: {
      pt: [
        "250+ gestores de comunidade utilizando",
        "190.987+ resumos gerados",
        "Crescimento de até 40% no engajamento",
      ],
      en: [
        "250+ community managers using it",
        "190,987+ summaries generated",
        "Up to 40% engagement growth",
      ],
    },
    cover: null,
  },
  {
    id: "microsaas-brasil",
    title: "Micro-SaaS Brasil",
    excerpt: {
      pt: "Comunidade e educação sobre criação de negócios Micro-SaaS",
      en: "Community and education on building Micro-SaaS businesses",
    },
    description: {
      pt: "Plataforma educacional e comunidade focada em ensinar empreendedores a criar, lançar e escalar Micro-SaaS. Oferece cursos práticos, mentoria, networking e suporte completo da ideia ao lançamento.",
      en: "Educational platform and community focused on teaching entrepreneurs how to build, launch, and scale Micro-SaaS. Offers practical courses, mentorship, networking, and full support from idea to launch.",
    },
    category: "saas",
    technologies: [
      "Next.js",
      "Community Platform",
      "Educational Content",
      "SaaS",
    ],
    year: "2024",
    status: "ongoing",
    featured: true,
    client: "Micro-SaaS Brasil (Desenvolvedor)",
    url: "https://microsaas.com.br/",
    results: {
      pt: [
        "Cursos 'Zero to Micro-SaaS' e 'Micro-SaaS com AI'",
        "Comunidade ativa de empreendedores",
        "Potencial de receita R$ 5k-50k/mês para alunos",
      ],
      en: [
        "'Zero to Micro-SaaS' and 'Micro-SaaS with AI' courses",
        "Active entrepreneur community",
        "Revenue potential of R$ 5k-50k/month for students",
      ],
    },
    cover: null,
  },
  {
    id: "4trip",
    title: "4trip Agência Receptiva",
    excerpt: {
      pt: "Agência de turismo receptivo em Alagoas e Pernambuco",
      en: "Inbound tourism agency in Alagoas and Pernambuco",
    },
    description: {
      pt: "Plataforma completa para agência de turismo receptivo especializada em destinos do Nordeste, incluindo sistema de reservas, gestão de tours, transfers, integração com parceiros e plataforma de pagamentos online.",
      en: "Full platform for an inbound tourism agency specializing in Northeast Brazil destinations, including booking system, tour management, transfers, partner integrations, and online payments.",
    },
    category: "web",
    technologies: ["React", "Node.js", "Express", "MongoDB", "API Integration"],
    year: "2020-2024",
    status: "completed",
    featured: true,
    client: "4trip Agência (Co-founder)",
    url: "https://4trip.com.br/",
    results: {
      pt: [
        "11.500+ experiências realizadas",
        "Traveler's Choice TripAdvisor 2023 e 2024",
        "Cobertura completa: Porto de Galinhas, Maragogi, Carneiros",
      ],
      en: [
        "11,500+ experiences delivered",
        "Traveler's Choice TripAdvisor 2023 and 2024",
        "Full coverage: Porto de Galinhas, Maragogi, Carneiros",
      ],
    },
    cover: null,
  },
  {
    id: "ajudaja",
    title: "AjudaJá — Plataforma de Doações",
    excerpt: {
      pt: "Crowdfunding online que arrecadou R$ 2,7 milhões em 2025",
      en: "Online crowdfunding that raised R$ 2.7M in 2025",
    },
    description: {
      pt: "Plataforma de crowdfunding e doações online focada em impacto social, permitindo criação rápida de campanhas, integração com redes sociais, tracking transparente de doações e gestão completa de arrecadações.",
      en: "Crowdfunding and online donations platform focused on social impact, allowing fast campaign creation, social media integration, transparent donation tracking, and full fundraising management.",
    },
    category: "fintech",
    technologies: ["React", "Node.js", "Payment Gateway", "Social Integration"],
    year: "2022",
    status: "completed",
    featured: false,
    client: "AjudaJá (Co-founder, Aug-Dec 2022)",
    url: "https://ajudaja.com.br/",
    results: {
      pt: [
        "R$ 2,7 milhões arrecadados em 2025",
        "124.000+ campanhas impulsionadas",
        "85.000+ usuários engajados",
      ],
      en: [
        "R$ 2.7M raised in 2025",
        "124,000+ campaigns boosted",
        "85,000+ engaged users",
      ],
    },
    cover: null,
  },
  {
    id: "sgcm",
    title: "SGCM — Sistema de Gestão de Condomínios",
    excerpt: {
      pt: "Sistema completo para gerenciamento de condomínios militares",
      en: "Full management system for military condominiums",
    },
    description: {
      pt: "Plataforma web e mobile para gestão de condomínios militares, incluindo controle de moradores, gestão financeira, comunicação interna, reservas de áreas comuns e suporte via WhatsApp.",
      en: "Web and mobile platform for military condominium management, including resident control, financial management, internal communication, amenity reservations, and WhatsApp support.",
    },
    category: "web",
    technologies: ["PHP", "MySQL", "React Native", "iOS", "Android"],
    year: "2015-2024",
    status: "completed",
    featured: false,
    client: "I.V.Tecnologias Web Ltda",
    url: "https://sgcm.com.br/",
    results: {
      pt: [
        "Apps disponíveis iOS e Android",
        "Interface web responsiva completa",
        "Gestão de múltiplos condomínios militares",
      ],
      en: [
        "Apps available on iOS and Android",
        "Full responsive web interface",
        "Management of multiple military condominiums",
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
