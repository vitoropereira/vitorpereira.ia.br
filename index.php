<?php
$page = $_GET['page'] ?? 'home';
$pageTitle = 'Vitor Pereira - Full-Stack Developer | 10+ Anos | JavaScript/TypeScript Specialist';
$pageDescription = 'Full-Stack Developer com 10+ anos de experiência, especializado em JavaScript/TypeScript, React, Next.js, Node.js e automações com IA. CTO e Co-founder.';

switch ($page) {
    case 'portfolio':
        $pageTitle = 'Portfolio - Vitor Pereira | Projetos Full-Stack & AI Automations';
        $pageDescription = 'Conheça os principais projetos desenvolvidos: automações WhatsApp, plataformas SaaS, APIs e soluções com IA. Experiência em React, Next.js, Node.js.';
        break;
    case 'blog':
        $pageTitle = 'Blog - Vitor Pereira | Full-Stack Development & AI Insights';
        $pageDescription = 'Artigos sobre desenvolvimento full-stack, automações com IA, TypeScript, React, Next.js e experiências como CTO e desenvolvedor.';
        break;
    case 'about':
        $pageTitle = 'Sobre Vitor Pereira | CTO & Full-Stack Developer | 10+ Anos Experiência';
        $pageDescription = 'Conheça a trajetória de Vitor Pereira: da aviação para tech, 10+ anos como desenvolvedor, CTO na I.V.Tecnologias, especialista em JavaScript/TypeScript.';
        break;
    case 'contact':
        $pageTitle = 'Contato - Vitor Pereira | Full-Stack Developer & CTO';
        $pageDescription = 'Entre em contato com Vitor Pereira para projetos full-stack, automações com IA, consultoria técnica e liderança de equipes. Recife, PE.';
        break;
}

include 'includes/header.php';

switch ($page) {
    case 'portfolio':
        include 'pages/portfolio.php';
        break;
    case 'blog':
        include 'pages/blog.php';
        break;
    case 'about':
        include 'pages/about.php';
        break;
    case 'contact':
        include 'pages/contact.php';
        break;
    default:
        include 'pages/home.php';
        break;
}

include 'includes/footer.php';
