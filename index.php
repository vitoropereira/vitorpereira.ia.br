<?php
$page = $_GET['page'] ?? 'home';
$pageTitle = 'Vitor Pereira - Desenvolvedor & Consultor IA';

switch($page) {
    case 'portfolio':
        $pageTitle = 'Portfolio - Vitor Pereira';
        break;
    case 'blog':
        $pageTitle = 'Blog - Vitor Pereira';
        break;
    case 'about':
        $pageTitle = 'Sobre - Vitor Pereira';
        break;
    case 'contact':
        $pageTitle = 'Contato - Vitor Pereira';
        break;
}

include 'includes/header.php';

switch($page) {
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
?>