# Vitor Pereira - Site Pessoal

Site pessoal desenvolvido em PHP puro com Tailwind CSS, inspirado no design do Pillar VC.

## 🚀 Tecnologias Utilizadas

- **PHP**: Backend e roteamento
- **HTML5**: Estrutura semântica
- **Tailwind CSS**: Estilização e responsividade
- **JavaScript**: Interatividade e animações
- **CSS3**: Estilos customizados

## 📁 Estrutura do Projeto

```
vitorpereira.ia.br/
├── assets/
│   ├── css/
│   │   └── custom.css
│   ├── js/
│   │   └── main.js
│   └── images/
├── includes/
│   ├── header.php
│   └── footer.php
├── pages/
│   ├── home.php
│   ├── portfolio.php
│   ├── blog.php
│   ├── about.php
│   └── contact.php
├── data/
│   └── projects.json
├── index.php
├── .htaccess
└── README.md
```

## 🔧 Funcionalidades

### 📱 Design Responsivo
- Layout adaptável para desktop, tablet e mobile
- Navegação hamburger para dispositivos móveis
- Componentes otimizados para diferentes telas

### 🎨 Interface Moderna
- Design inspirado no Pillar VC
- Animações suaves com Intersection Observer
- Transições CSS elegantes
- Paleta de cores profissional

### 📄 Páginas Implementadas

#### 🏠 Home
- Hero section com call-to-actions
- Seção de especialidades
- Projetos em destaque
- Últimos posts do blog

#### 💼 Portfolio
- Sistema de filtros por categoria
- Cards interativos de projetos
- Tecnologias utilizadas
- Links para demos e repositórios

#### ✍️ Blog
- Sistema de posts com categorias
- Filtros por categoria
- Páginas individuais de posts
- Sistema de tags

#### 👤 Sobre
- Timeline da carreira
- Habilidades e expertise
- Certificações e conquistas
- Informações pessoais

#### 📞 Contato
- Formulário de contato completo
- Informações de localização
- Links para redes sociais
- FAQ interativo

## 🚀 Como Executar

### Pré-requisitos
- PHP 7.4 ou superior
- Servidor web (Apache/Nginx)
- Extensões PHP básicas

### Instalação Local

1. Clone ou baixe os arquivos para seu servidor local
2. Configure o virtual host apontando para a pasta do projeto
3. Acesse via navegador

### Configuração do Apache

Adicione ao seu `httpd.conf` ou arquivo de virtual hosts:

```apache
<VirtualHost *:80>
    ServerName vitorpereira.local
    DocumentRoot "C:/caminho/para/vitorpereira.ia.br"
    <Directory "C:/caminho/para/vitorpereira.ia.br">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Configuração do Nginx

```nginx
server {
    listen 80;
    server_name vitorpereira.local;
    root /caminho/para/vitorpereira.ia.br;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 📝 Personalização

### Adicionando Novos Projetos

Edite o arquivo `data/projects.json`:

```json
{
    "id": "projeto-id",
    "title": "Título do Projeto",
    "excerpt": "Descrição breve",
    "description": "Descrição completa",
    "category": "web|mobile|ai|automation",
    "technologies": ["Tech1", "Tech2"],
    "year": "2024",
    "status": "completed",
    "featured": true
}
```

### Modificando Cores

No arquivo `includes/header.php`, ajuste a configuração do Tailwind:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#sua-cor-primaria',
                secondary: '#sua-cor-secundaria',
                accent: '#sua-cor-de-destaque',
            }
        }
    }
}
```

### Adicionando Posts do Blog

Edite o array `$posts` em `pages/blog.php`:

```php
[
    'id' => 'post-id',
    'title' => 'Título do Post',
    'excerpt' => 'Resumo do post',
    'date' => '2024-09-27',
    'readTime' => '5 min',
    'category' => 'Categoria',
    'tags' => ['tag1', 'tag2'],
    'content' => 'Conteúdo completo...'
]
```

## 🎯 Melhorias Futuras

- [ ] Sistema de admin para gerenciar conteúdo
- [ ] Integração com CMS headless
- [ ] Sistema de comentários no blog
- [ ] Newsletter automática
- [ ] Analytics integrado
- [ ] SEO otimizado
- [ ] PWA (Progressive Web App)
- [ ] Dark mode toggle

## 📈 Performance

- Compressão Gzip habilitada
- Cache de arquivos estáticos
- Imagens otimizadas
- CSS/JS minificado em produção
- Lazy loading implementado

## 🔒 Segurança

- Validação de entrada de dados
- Proteção contra XSS
- Headers de segurança configurados
- Sanitização de URLs

## 📱 Responsividade

- Mobile-first design
- Breakpoints otimizados
- Touch-friendly interface
- Performance em dispositivos móveis

## 🌐 Deploy

### Preparação para Produção

1. Descomente as linhas de HTTPS no `.htaccess`
2. Configure certificado SSL
3. Ajuste configurações de cache
4. Configure backup automático

### Domínio e Hospedagem

- Configure DNS apontando para o servidor
- Configure certificado SSL/TLS
- Teste todas as funcionalidades
- Configure monitoramento

## 📞 Suporte

Para dúvidas ou sugestões sobre este projeto:

- Email: vitor@vitorpereira.ia.br
- Site: https://vitorpereira.ia.br

---

Desenvolvido com ❤️ por Vitor Pereira