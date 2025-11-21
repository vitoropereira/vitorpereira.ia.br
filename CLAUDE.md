# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Vitor Pereira, a Full-Stack Developer with 10+ years of experience. The site is built with PHP (vanilla), Tailwind CSS, and vanilla JavaScript, inspired by the Pillar VC design. It showcases projects, blog posts, professional information, and contact details.

**Tech Stack:**
- Backend: PHP (no framework, vanilla routing)
- Frontend: HTML5, Tailwind CSS (via CDN), vanilla JavaScript
- Data: JSON files for projects
- Server: Apache with .htaccess URL rewriting

## Architecture

### Routing System
The entire site uses a single entry point ([index.php](index.php)) with query-string-based routing (`?page=portfolio`). The routing logic:
1. Reads `$_GET['page']` parameter (defaults to 'home')
2. Sets dynamic meta tags (`$pageTitle`, `$pageDescription`) per page
3. Includes header, then the appropriate page file, then footer

**Important:** All navigation uses query strings, not clean URLs. Links must follow the pattern `?page=pagename`.

### File Structure
```
├── index.php              # Main router and entry point
├── includes/
│   ├── header.php        # Navigation, meta tags, Tailwind config
│   └── footer.php        # Footer, closing tags, scripts
├── pages/                # Individual page content
│   ├── home.php
│   ├── portfolio.php     # Has inline JavaScript for filtering
│   ├── blog.php
│   ├── about.php
│   └── contact.php
├── data/
│   └── projects.json     # Project data source
├── assets/
│   ├── css/custom.css    # Custom styles beyond Tailwind
│   └── js/main.js        # Global JS (mobile menu, animations)
└── .htaccess             # URL rewriting, compression, caching
```

### Key Components

**Header ([includes/header.php](includes/header.php)):**
- Contains all `<head>` meta tags (SEO, Open Graph, Twitter Cards)
- Tailwind CSS CDN and configuration (colors: primary: #2563eb, secondary: #1e40af, accent: #f59e0b)
- Fixed navigation bar with mobile hamburger menu
- Active page highlighting with PHP conditionals

**Pages:**
- Each page in `pages/` is a pure content file (no HTML structure, just sections)
- [pages/portfolio.php](pages/portfolio.php) has inline JavaScript for filter functionality
- [pages/home.php](pages/home.php) contains hero, specialties, featured projects, and blog sections

**Data Management:**
- [data/projects.json](data/projects.json) contains all project information
- Project structure: `id`, `title`, `excerpt`, `description`, `category`, `technologies`, `year`, `status`, `featured`, `client`, `url`, `results`
- `url` field is optional - can be null for projects without public URLs

**JavaScript:**
- [assets/js/main.js](assets/js/main.js): Mobile menu toggle, Intersection Observer animations, smooth scrolling
- Inline JS in portfolio.php for category filtering

## Development Workflow

### Local Development
**Requirements:**
- PHP 7.4+
- Apache or Nginx with PHP-FPM
- No build process or package manager needed

**Running Locally:**
1. Set up virtual host pointing to project root
2. Ensure mod_rewrite is enabled (Apache)
3. Access via browser at configured domain

**Apache Configuration:**
The [.htaccess](.htaccess) file handles:
- URL rewriting to index.php
- Gzip compression
- Static file caching (1 year for assets, 1 hour for HTML)
- HTTPS redirect (commented out for local development)

### Deployment
**Production Server:**
- FTP deployment configured via VSCode SFTP extension ([.vscode/sftp.json](.vscode/sftp.json))
- Upload on save enabled
- Domain: vitorpereira.ia.br

**Important for Production:**
1. Uncomment HTTPS redirect in .htaccess (lines 9-10)
2. Verify SSL certificate is active
3. Test all pages and links after deployment

### Git Workflow
**Current Branch:** main (also the base branch for PRs)

**When making commits:**
- Always write commit messages in English
- Request permission before executing npm or system commands
- Save planning documents as `.md` files when doing task breakdowns

## Styling & Design

### Tailwind Configuration
Colors are configured inline in [includes/header.php](includes/header.php):
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',    // Blue
                secondary: '#1e40af',  // Darker blue
                accent: '#f59e0b',     // Amber
            }
        }
    }
}
```

### Custom CSS
[assets/css/custom.css](assets/css/custom.css) contains:
- `.hero-gradient` - Hero section gradient background
- `.section-padding` - Consistent section spacing
- `.container` - Centered content wrapper
- `.project-card`, `.blog-card` - Card components with hover effects
- `.card-hover` - Scale animation on hover
- `.tech-tag` - Technology badge styling

### Animations
Fade-in animations use Intersection Observer in [main.js](assets/js/main.js:11-32):
- Elements with `.fade-in` class animate on scroll into view
- Opacity 0→1 and translateY(20px)→0 transition
- 0.6s ease timing

## Content Management

### Adding Projects
Edit [data/projects.json](data/projects.json) with this structure:
```json
{
    "id": "unique-project-id",
    "title": "Project Title",
    "excerpt": "Short description",
    "description": "Full description",
    "category": "web|mobile|ai|automation",
    "technologies": ["Tech1", "Tech2"],
    "year": "2024",
    "status": "completed|ongoing|mvp",
    "featured": true|false,
    "client": "Client Name",
    "url": "https://example.com",
    "results": ["Result 1", "Result 2"]
}
```
Note: `url` field is optional and can be set to `null` for projects without public URLs.

### Adding Blog Posts
Blog posts are currently hardcoded in [pages/blog.php](pages/blog.php). Add new posts to the `$posts` array in the file.

### Contact Form
The contact page ([pages/contact.php](pages/contact.php)) includes a form that submits to `/api/send-contact.php`:
- Form uses JavaScript fetch API for async submission
- Backend: [api/send-contact.php](api/send-contact.php) - sends messages via WhatsApp using uazapi
- Form data: name, email, company, project_type, budget, message
- Response format: JSON with `success` boolean and `message` string
- Environment variables (optional): `UAZAPI_TOKEN`, `RECIPIENT_WHATSAPP`
- Falls back to hardcoded values if env vars not set (see `.env.example`)
- WhatsApp contact: +55 81 99673-3973

### SEO Management
Meta tags are set dynamically in [index.php](index.php:2-23) based on the `$page` variable. Update the switch statement to modify titles and descriptions.

## API Endpoints

### Contact Form API
**Endpoint:** `/api/send-contact.php`

**Method:** POST

**Request Body (JSON):**
```json
{
    "name": "string (required)",
    "email": "string (required, valid email)",
    "company": "string (optional)",
    "project_type": "string (optional)",
    "budget": "string (optional)",
    "message": "string (required)"
}
```

**Response (JSON):**
```json
{
    "success": boolean,
    "message": "string"
}
```

**Implementation Details:**
- Validates required fields (name, email, message)
- Sanitizes all inputs to prevent XSS
- Sends formatted message via WhatsApp using uazapi API
- Uses environment variables for sensitive data (recommended)
- Falls back to hardcoded values if env vars not set
- Returns appropriate HTTP status codes (200, 400, 405, 500)

**Environment Variables:**
- `UAZAPI_TOKEN` - API token for uazapi service
- `RECIPIENT_WHATSAPP` - WhatsApp number to receive messages (format: 5581996733973)

See [.env.example](.env.example) for configuration template.

## Code Preferences

**From User Instructions:**
- Prefer functions over classes unless absolutely necessary
- No npm commands without explicit permission
- No server execution commands without permission
- Always provide commit message suggestions after modifications (in English)

## Performance & Security

**Performance:**
- Gzip compression enabled via .htaccess
- Static asset caching (1 year)
- Tailwind loaded from CDN
- Lazy loading for images
- Minimal JavaScript footprint

**Security:**
- Input sanitization for `$_GET['page']` via whitelist in switch statement
- .htaccess protects against common exploits
- No database (static JSON data)
- FTP credentials in sftp.json (should be in .gitignore)

## Known Technical Debt

1. Blog posts are hardcoded in PHP arrays instead of JSON/database
2. No admin panel for content management
3. Tailwind loaded from CDN (not optimized/purged)
4. No automated testing
5. FTP credentials committed to repository (security concern)
6. WhatsApp API token hardcoded in source (use environment variables in production)

## Common Tasks

**Update site content:** Edit page files in `pages/` directory
**Add new page:** Create file in `pages/`, add route case in index.php, add navigation link in header.php
**Modify styles:** Use Tailwind classes or add to custom.css
**Update projects:** Edit data/projects.json
**Change colors:** Modify tailwind.config in header.php
**Deploy:** Save files (auto-uploads via SFTP extension)
