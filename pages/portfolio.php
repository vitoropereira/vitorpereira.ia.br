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
            <button class="filter-btn bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300" data-filter="mobile">
                Mobile
            </button>
            <button class="filter-btn bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300" data-filter="automation">
                Automação
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="project-card fade-in" data-category="ai web">
                <div class="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold">Sistema de IA para E-commerce</h3>
                        <span class="text-sm text-gray-500">2024</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Plataforma de recomendações inteligentes que analisa comportamento do usuário e histórico de compras
                        para sugerir produtos relevantes, resultando em aumento de 35% nas vendas.
                    </p>
                    <div class="flex flex-wrap mb-4">
                        <span class="tech-tag">Python</span>
                        <span class="tech-tag">TensorFlow</span>
                        <span class="tech-tag">React</span>
                        <span class="tech-tag">PostgreSQL</span>
                    </div>
                    <div class="flex gap-3">
                        <a href="#" class="text-primary hover:text-secondary font-semibold">Ver Demo</a>
                        <a href="#" class="text-gray-600 hover:text-gray-800">GitHub</a>
                    </div>
                </div>
            </div>

            <div class="project-card fade-in" data-category="mobile web">
                <div class="h-48 bg-gradient-to-br from-green-500 to-teal-600 relative overflow-hidden">
                    <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold">App de Gestão Financeira</h3>
                        <span class="text-sm text-gray-500">2024</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Aplicativo completo para controle financeiro pessoal com categorização automática de gastos,
                        metas de economia e relatórios detalhados. Mais de 10k usuários ativos.
                    </p>
                    <div class="flex flex-wrap mb-4">
                        <span class="tech-tag">React Native</span>
                        <span class="tech-tag">Node.js</span>
                        <span class="tech-tag">MongoDB</span>
                        <span class="tech-tag">Express</span>
                    </div>
                    <div class="flex gap-3">
                        <a href="#" class="text-primary hover:text-secondary font-semibold">App Store</a>
                        <a href="#" class="text-gray-600 hover:text-gray-800">Play Store</a>
                    </div>
                </div>
            </div>

            <div class="project-card fade-in" data-category="automation web">
                <div class="h-48 bg-gradient-to-br from-orange-500 to-red-600 relative overflow-hidden">
                    <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold">Automação de Marketing</h3>
                        <span class="text-sm text-gray-500">2023</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Sistema completo de automação de campanhas de marketing digital com segmentação avançada,
                        A/B testing e relatórios em tempo real. Reduziu tempo de campanhas em 60%.
                    </p>
                    <div class="flex flex-wrap mb-4">
                        <span class="tech-tag">PHP</span>
                        <span class="tech-tag">Laravel</span>
                        <span class="tech-tag">Vue.js</span>
                        <span class="tech-tag">Redis</span>
                    </div>
                    <div class="flex gap-3">
                        <a href="#" class="text-primary hover:text-secondary font-semibold">Ver Caso</a>
                        <a href="#" class="text-gray-600 hover:text-gray-800">Documentação</a>
                    </div>
                </div>
            </div>

            <div class="project-card fade-in" data-category="ai automation">
                <div class="h-48 bg-gradient-to-br from-purple-500 to-pink-600 relative overflow-hidden">
                    <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold">Chatbot Inteligente para Suporte</h3>
                        <span class="text-sm text-gray-500">2024</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Chatbot alimentado por IA que resolve 80% das dúvidas dos clientes automaticamente,
                        com integração WhatsApp, Telegram e website. Processamento de linguagem natural avançado.
                    </p>
                    <div class="flex flex-wrap mb-4">
                        <span class="tech-tag">Python</span>
                        <span class="tech-tag">OpenAI</span>
                        <span class="tech-tag">FastAPI</span>
                        <span class="tech-tag">Docker</span>
                    </div>
                    <div class="flex gap-3">
                        <a href="#" class="text-primary hover:text-secondary font-semibold">Testar Bot</a>
                        <a href="#" class="text-gray-600 hover:text-gray-800">Documentação</a>
                    </div>
                </div>
            </div>

            <div class="project-card fade-in" data-category="web">
                <div class="h-48 bg-gradient-to-br from-indigo-500 to-blue-600 relative overflow-hidden">
                    <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold">Plataforma de Ensino Online</h3>
                        <span class="text-sm text-gray-500">2023</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        LMS completo com sistema de videoaulas, exercícios interativos, certificados automáticos
                        e gamificação. Suporta mais de 5k alunos simultâneos.
                    </p>
                    <div class="flex flex-wrap mb-4">
                        <span class="tech-tag">Next.js</span>
                        <span class="tech-tag">TypeScript</span>
                        <span class="tech-tag">Prisma</span>
                        <span class="tech-tag">Stripe</span>
                    </div>
                    <div class="flex gap-3">
                        <a href="#" class="text-primary hover:text-secondary font-semibold">Acessar Plataforma</a>
                        <a href="#" class="text-gray-600 hover:text-gray-800">Case Study</a>
                    </div>
                </div>
            </div>

            <div class="project-card fade-in" data-category="automation ai">
                <div class="h-48 bg-gradient-to-br from-yellow-500 to-orange-600 relative overflow-hidden">
                    <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold">Análise Preditiva de Vendas</h3>
                        <span class="text-sm text-gray-500">2024</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Sistema de machine learning que prevê tendências de vendas com 92% de precisão,
                        otimizando estoque e estratégias comerciais para grandes varejistas.
                    </p>
                    <div class="flex flex-wrap mb-4">
                        <span class="tech-tag">Python</span>
                        <span class="tech-tag">Scikit-learn</span>
                        <span class="tech-tag">Pandas</span>
                        <span class="tech-tag">Streamlit</span>
                    </div>
                    <div class="flex gap-3">
                        <a href="#" class="text-primary hover:text-secondary font-semibold">Ver Dashboard</a>
                        <a href="#" class="text-gray-600 hover:text-gray-800">Metodologia</a>
                    </div>
                </div>
            </div>
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
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">Python</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">JavaScript</h3>
            </div>

            <div class="text-center fade-in">
                <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">React</h3>
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
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" class="w-10 h-10">
                </div>
                <h3 class="font-semibold">Docker</h3>
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