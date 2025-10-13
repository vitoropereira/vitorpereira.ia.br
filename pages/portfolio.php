<?php
$projectsJson = file_get_contents(__DIR__ . '/../data/projects.json');
$projects = json_decode($projectsJson, true);

// Filter for featured projects
$featuredProjects = array_filter($projects, function($p) {
    return $p['featured'] === true;
});

// Get unique categories
$categories = array_unique(array_column($projects, 'category'));
sort($categories);
?>

<section class="section-padding bg-white">
    <div class="container">
        <div class="text-center mb-16">
            <h1 class="text-5xl font-bold text-gray-900 mb-6 fade-in">Portfolio</h1>
            <p class="text-xl text-gray-600 fade-in max-w-3xl mx-auto">
                Uma seleção dos meus projetos mais relevantes, demonstrando experiência em desenvolvimento web,
                inteligência artificial e soluções inovadoras para diferentes setores.
            </p>
        </div>

        <div class="flex flex-wrap justify-center gap-4 mb-12 fade-in">
            <button class="filter-btn active bg-primary text-white px-6 py-2 rounded-full" data-filter="all">
                Todos
            </button>
            <button class="filter-btn bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300" data-filter="ai">
                Inteligência Artificial
            </button>
            <button class="filter-btn bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300" data-filter="web">
                Desenvolvimento Web
            </button>
            <button class="filter-btn bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300" data-filter="automation">
                Automação
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <?php foreach ($projects as $project): ?>
                <?php
                // Define gradient colors based on category
                $gradients = [
                    'ai' => 'from-blue-500 to-purple-600',
                    'web' => 'from-green-500 to-teal-600',
                    'automation' => 'from-orange-500 to-red-600',
                    'mobile' => 'from-indigo-500 to-blue-600'
                ];
                $gradient = $gradients[$project['category']] ?? 'from-gray-500 to-gray-700';

                // Define icons based on category
                $icons = [
                    'ai' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>',
                    'web' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"></path>',
                    'automation' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>',
                    'mobile' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>'
                ];
                $icon = $icons[$project['category']] ?? $icons['web'];
                ?>

                <div class="project-card fade-in" data-category="<?php echo $project['category']; ?>">
                    <div class="h-48 bg-gradient-to-br <?php echo $gradient; ?> relative overflow-hidden">
                        <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <?php echo $icon; ?>
                            </svg>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-xl font-semibold"><?php echo htmlspecialchars($project['title']); ?></h3>
                            <span class="text-sm text-gray-500"><?php echo $project['year']; ?></span>
                        </div>
                        <p class="text-gray-600 mb-4">
                            <?php echo htmlspecialchars($project['description']); ?>
                        </p>
                        <div class="flex flex-wrap mb-4">
                            <?php foreach (array_slice($project['technologies'], 0, 4) as $tech): ?>
                                <span class="tech-tag"><?php echo htmlspecialchars($tech); ?></span>
                            <?php endforeach; ?>
                        </div>

                        <?php if (!empty($project['results'])): ?>
                            <div class="mb-4 text-sm text-gray-600">
                                <strong>Resultados:</strong>
                                <ul class="list-disc list-inside mt-2 space-y-1">
                                    <?php foreach (array_slice($project['results'], 0, 2) as $result): ?>
                                        <li><?php echo htmlspecialchars($result); ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endif; ?>

                        <div class="flex gap-3">
                            <?php if ($project['url']): ?>
                                <a href="<?php echo htmlspecialchars($project['url']); ?>"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   class="text-primary hover:text-secondary font-semibold">
                                    Ver Projeto →
                                </a>
                            <?php else: ?>
                                <span class="text-gray-400 font-semibold">Projeto Interno</span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section-padding bg-gray-50">
    <div class="container">
        <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-gray-900 mb-6 fade-in">Tecnologias que Domino</h2>
            <p class="text-xl text-gray-600 fade-in">Ferramentas e linguagens que uso para criar soluções eficientes</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">JavaScript</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">TypeScript</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">React</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="Next.js" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">Next.js</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">Node.js</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" alt="PHP" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">PHP</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">Python</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">Docker</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" alt="MongoDB" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">MongoDB</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt="MySQL" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">MySQL</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <svg class="w-10 h-10 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                </div>
                <h3 class="font-semibold">Git</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <svg class="w-10 h-10 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.84 4.67h1.68v8.36h-1.68V4.67zM12 18.155c-.635 0-1.155-.519-1.155-1.155s.52-1.155 1.155-1.155 1.155.52 1.155 1.155-.52 1.155-1.155 1.155z"/>
                    </svg>
                </div>
                <h3 class="font-semibold">AI/ML</h3>
            </div>
        </div>
    </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('[data-category]');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');

            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-primary', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });

            this.classList.add('active', 'bg-primary', 'text-white');
            this.classList.remove('bg-gray-200', 'text-gray-700');

            projectCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    if (card.getAttribute('data-category').includes(filter)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
});
</script>
