<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#1e40af',
                        accent: '#f59e0b',
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="assets/css/custom.css">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg fixed w-full top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold text-primary">Vitor Pereira</a>
                    <span class="ml-2 text-sm text-gray-600">IA & Development</span>
                </div>

                <div class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-primary transition-colors <?php echo ($page == 'home') ? 'text-primary font-semibold' : ''; ?>">Início</a>
                    <a href="?page=portfolio" class="text-gray-700 hover:text-primary transition-colors <?php echo ($page == 'portfolio') ? 'text-primary font-semibold' : ''; ?>">Portfolio</a>
                    <a href="?page=blog" class="text-gray-700 hover:text-primary transition-colors <?php echo ($page == 'blog') ? 'text-primary font-semibold' : ''; ?>">Blog</a>
                    <a href="?page=about" class="text-gray-700 hover:text-primary transition-colors <?php echo ($page == 'about') ? 'text-primary font-semibold' : ''; ?>">Sobre</a>
                    <a href="?page=contact" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors">Contato</a>
                </div>

                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" class="text-gray-700 hover:text-primary">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
            <div class="px-2 pt-2 pb-3 space-y-1">
                <a href="/" class="block px-3 py-2 text-gray-700 hover:text-primary">Início</a>
                <a href="?page=portfolio" class="block px-3 py-2 text-gray-700 hover:text-primary">Portfolio</a>
                <a href="?page=blog" class="block px-3 py-2 text-gray-700 hover:text-primary">Blog</a>
                <a href="?page=about" class="block px-3 py-2 text-gray-700 hover:text-primary">Sobre</a>
                <a href="?page=contact" class="block px-3 py-2 text-gray-700 hover:text-primary">Contato</a>
            </div>
        </div>
    </nav>

    <main class="pt-16"><?php // Offset for fixed navbar ?>