<?php
$posts = [
    [
        'id' => 'n8n-automacao-whatsapp',
        'title' => 'Automatizando WhatsApp Business com N8N e OpenAI',
        'excerpt' => 'Como criar automações inteligentes para WhatsApp usando N8N, OpenAI e webhooks para otimizar atendimento.',
        'date' => '2024-09-25',
        'readTime' => '8 min',
        'category' => 'Automação',
        'tags' => ['N8N', 'WhatsApp', 'OpenAI', 'Automação', 'ChatBot'],
        'content' => 'Guia completo para implementar automações WhatsApp...'
    ],
    [
        'id' => 'typescript-react-next',
        'title' => 'TypeScript + React + Next.js: Stack Moderna para SaaS',
        'excerpt' => 'Explorando as melhores práticas para desenvolver aplicações SaaS escaláveis com TypeScript, React e Next.js.',
        'date' => '2024-09-20',
        'readTime' => '10 min',
        'category' => 'Frontend',
        'tags' => ['TypeScript', 'React', 'Next.js', 'SaaS', 'Desenvolvimento'],
        'content' => 'Implementação completa de stack moderna...'
    ],
    [
        'id' => 'openai-api-integracao',
        'title' => 'Integrando OpenAI API em Aplicações JavaScript',
        'excerpt' => 'Implementação prática de ChatGPT e outras APIs da OpenAI em aplicações web modernas.',
        'date' => '2024-09-15',
        'readTime' => '6 min',
        'category' => 'Inteligência Artificial',
        'tags' => ['OpenAI', 'API', 'JavaScript', 'IA', 'ChatGPT'],
        'content' => 'Tutorial completo de integração OpenAI...'
    ],
    [
        'id' => 'micro-saas-desenvolvimento',
        'title' => 'Desenvolvendo Micro-SaaS: Da Ideia ao Launch',
        'excerpt' => 'Experiências reais desenvolvendo múltiplas soluções Micro-SaaS: tecnologias, desafios e estratégias.',
        'date' => '2024-09-10',
        'readTime' => '12 min',
        'category' => 'Empreendedorismo',
        'tags' => ['Micro-SaaS', 'Startup', 'Produto', 'Desenvolvimento'],
        'content' => 'Jornada completa de desenvolvimento SaaS...'
    ],
    [
        'id' => 'cto-lideranca-tecnica',
        'title' => 'Lições de 10 Anos como CTO: Liderança Técnica',
        'excerpt' => 'Insights práticos sobre liderança técnica, gestão de equipes e tomada de decisões arquiteturais.',
        'date' => '2024-09-05',
        'readTime' => '9 min',
        'category' => 'Liderança',
        'tags' => ['CTO', 'Liderança', 'Gestão', 'Arquitetura', 'Carreira'],
        'content' => 'Experiências reais de liderança técnica...'
    ],
    [
        'id' => 'transicao-carreira-tech',
        'title' => 'Da Aviação para Tech: Minha Transição de Carreira',
        'excerpt' => 'Como a experiência no controle de tráfego aéreo me preparou para uma carreira bem-sucedida em tecnologia.',
        'date' => '2024-08-30',
        'readTime' => '7 min',
        'category' => 'Carreira',
        'tags' => ['Carreira', 'Transição', 'Tech', 'Aviação', 'História'],
        'content' => 'Jornada de transição profissional...'
    ],
    [
        'id' => 'scale-ai-code-review',
        'title' => 'Experiência como AI Code Reviewer na Scale AI',
        'excerpt' => 'Insights sobre revisão de código gerado por IA, qualidade de código e o futuro da programação assistida.',
        'date' => '2024-08-25',
        'readTime' => '5 min',
        'category' => 'Inteligência Artificial',
        'tags' => ['Scale AI', 'Code Review', 'IA', 'Qualidade', 'Programação'],
        'content' => 'Experiências reais revisando código IA...'
    ]
];

$currentPost = $_GET['post'] ?? null;
$selectedCategory = $_GET['category'] ?? 'all';

if ($currentPost) {
    $post = array_filter($posts, function($p) use ($currentPost) {
        return $p['id'] === $currentPost;
    });
    $post = reset($post);
}

$categories = array_unique(array_column($posts, 'category'));
?>

<?php if ($currentPost && $post): ?>
    <article class="section-padding bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
                <a href="?page=blog" class="text-primary hover:text-secondary font-semibold">← Voltar ao Blog</a>
            </div>

            <header class="mb-12 fade-in">
                <div class="flex items-center text-sm text-gray-500 mb-4">
                    <span class="bg-primary text-white px-3 py-1 rounded-full text-xs"><?php echo $post['category']; ?></span>
                    <span class="mx-3">•</span>
                    <time><?php echo date('j \d\e F \d\e Y', strtotime($post['date'])); ?></time>
                    <span class="mx-3">•</span>
                    <span><?php echo $post['readTime']; ?> de leitura</span>
                </div>

                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                    <?php echo $post['title']; ?>
                </h1>

                <p class="text-xl text-gray-600 leading-relaxed">
                    <?php echo $post['excerpt']; ?>
                </p>

                <div class="flex flex-wrap gap-2 mt-6">
                    <?php foreach ($post['tags'] as $tag): ?>
                        <span class="tech-tag"><?php echo $tag; ?></span>
                    <?php endforeach; ?>
                </div>
            </header>

            <div class="prose prose-lg max-w-none fade-in">
                <div class="bg-gray-50 border-l-4 border-primary p-6 mb-8">
                    <p class="text-gray-700 italic">
                        Este é um exemplo de conteúdo de blog post. Você pode substituir este conteúdo
                        pelo texto real do seu artigo. O sistema suporta HTML completo para formatação avançada.
                    </p>
                </div>

                <h2>Introdução</h2>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>

                <h2>Desenvolvimento</h2>
                <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>

                <h3>Exemplo de Código</h3>
                <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto"><code>function exemploFuncao() {
    console.log('Este é um exemplo de código');
    return 'Resultado da função';
}</code></pre>

                <h2>Conclusão</h2>
                <p>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
                    totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
            </div>

            <div class="mt-12 pt-8 border-t border-gray-200 fade-in">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-2">Compartilhar artigo:</p>
                        <div class="flex gap-4">
                            <a href="#" class="text-gray-600 hover:text-primary">Twitter</a>
                            <a href="#" class="text-gray-600 hover:text-primary">LinkedIn</a>
                            <a href="#" class="text-gray-600 hover:text-primary">Facebook</a>
                        </div>
                    </div>
                    <a href="?page=contact" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors">
                        Discutir este artigo
                    </a>
                </div>
            </div>
        </div>
    </article>

<?php else: ?>
    <section class="section-padding bg-white">
        <div class="container">
            <div class="text-center mb-16">
                <h1 class="text-5xl font-bold text-gray-900 mb-6 fade-in">Blog</h1>
                <p class="text-xl text-gray-600 fade-in max-w-3xl mx-auto">
                    Compartilho conhecimentos sobre desenvolvimento, inteligência artificial e tecnologia.
                    Artigos práticos para desenvolvedores e entusiastas da tecnologia.
                </p>
            </div>

            <div class="flex flex-wrap justify-center gap-4 mb-12 fade-in">
                <a href="?page=blog" class="filter-btn <?php echo $selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> px-6 py-2 rounded-full">
                    Todos
                </a>
                <?php foreach ($categories as $category): ?>
                    <a href="?page=blog&category=<?php echo urlencode($category); ?>"
                       class="filter-btn <?php echo $selectedCategory === $category ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; ?> px-6 py-2 rounded-full">
                        <?php echo $category; ?>
                    </a>
                <?php endforeach; ?>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php foreach ($posts as $post): ?>
                    <?php if ($selectedCategory === 'all' || $selectedCategory === $post['category']): ?>
                        <article class="blog-card fade-in">
                            <div class="p-6">
                                <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                                    <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                                        <?php echo $post['category']; ?>
                                    </span>
                                    <div class="flex items-center">
                                        <time><?php echo date('j M Y', strtotime($post['date'])); ?></time>
                                        <span class="mx-2">•</span>
                                        <span><?php echo $post['readTime']; ?></span>
                                    </div>
                                </div>

                                <h3 class="text-xl font-semibold mb-3 leading-tight">
                                    <a href="?page=blog&post=<?php echo $post['id']; ?>" class="hover:text-primary transition-colors">
                                        <?php echo $post['title']; ?>
                                    </a>
                                </h3>

                                <p class="text-gray-600 mb-4 line-clamp-3">
                                    <?php echo $post['excerpt']; ?>
                                </p>

                                <div class="flex flex-wrap gap-2 mb-4">
                                    <?php foreach (array_slice($post['tags'], 0, 3) as $tag): ?>
                                        <span class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                            <?php echo $tag; ?>
                                        </span>
                                    <?php endforeach; ?>
                                </div>

                                <a href="?page=blog&post=<?php echo $post['id']; ?>"
                                   class="text-primary font-semibold hover:text-secondary transition-colors">
                                    Ler artigo completo →
                                </a>
                            </div>
                        </article>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>

            <?php if (empty(array_filter($posts, function($p) use ($selectedCategory) {
                return $selectedCategory === 'all' || $selectedCategory === $p['category'];
            }))): ?>
                <div class="text-center py-16">
                    <p class="text-xl text-gray-600">Nenhum artigo encontrado nesta categoria.</p>
                    <a href="?page=blog" class="text-primary hover:text-secondary font-semibold">Ver todos os artigos</a>
                </div>
            <?php endif; ?>
        </div>
    </section>

    <section class="section-padding bg-gray-50">
        <div class="container">
            <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-900 mb-4 fade-in">Quer discutir algum tópico?</h2>
                <p class="text-xl text-gray-600 mb-8 fade-in">
                    Tenho sempre prazer em conversar sobre tecnologia e trocar experiências.
                </p>
                <a href="?page=contact" class="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors fade-in">
                    Vamos conversar
                </a>
            </div>
        </div>
    </section>
<?php endif; ?>