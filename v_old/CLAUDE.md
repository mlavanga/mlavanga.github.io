# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a Jekyll-based academic portfolio website built using the modern-resume-theme. The site belongs to Mario Lavanga, a computational neuroscientist, and serves as both a personal resume and publication showcase.

**Key Components:**
- **Jekyll Static Site Generator**: Uses Ruby gems and Bundler for dependency management
- **Modern Resume Theme**: Based on sproogen/modern-resume-theme with custom modifications
- **Content Structure**: Articles, posts, publications, and personal information stored in YAML/Markdown
- **Collections**: Custom `articles` collection for research publications
- **Styling**: SASS-based styling with custom theme modifications

## Development Commands

### Quick Start Scripts
```bash
# Install all dependencies (first time setup)
./install.sh

# Start development server with terminal detach
./serve.sh

# Stop the server
./serve.sh stop

# Check server status
./serve.sh status

# View/follow logs
./serve.sh logs
./serve.sh follow
```

### Manual Development Commands
```bash
# Install dependencies
bundle install

# Serve locally with live reload (port 4000)
bundle exec jekyll serve --livereload

# Build for production
bundle exec jekyll build

# Clean build artifacts
bundle exec jekyll clean
```

### Alternative Development with Docker
If Docker were available (currently not installed):
```bash
# Run with Docker Compose
docker-compose up
```

## File Structure

**Core Configuration:**
- `_config.yml` - Main Jekyll configuration and personal information
- `Gemfile` - Ruby dependencies
- `modern-resume-theme.gemspec` - Theme specification

**Content Directories:**
- `_articles/` - Research publication articles (2016-2022)
- `_posts/` - Blog posts
- `_includes/` - HTML partials and components
- `_layouts/` - Page templates
- `_sass/` - SCSS styling files

**Static Assets:**
- `documents/` - PDFs (CV, diplomas, thesis)
- `images/` - Profile and landscape images
- `assets/` - JavaScript and compiled CSS

**Development Scripts:**
- `install.sh` - Automated bundle installation with dependency checks
- `serve.sh` - Jekyll server management with background process control

## Content Management

**Adding Publications**: Create new Markdown files in `_articles/` following the date-title format (YYYY-MM-DD-title.md)

**Personal Information**: Update contact details, experience, education in `_config.yml` under the respective sections

**Skills & Languages**: Modify the `skills.toolset` and content sections in `_config.yml`

## Technical Details

- **Ruby Version**: ~3.0 (specified in gemspec)
- **Jekyll Plugins**: jekyll-seo-tag for SEO optimization
- **Google Analytics**: Configured with gtag (G-9G7324QGDH)
- **Collections**: Articles collection with date-based sorting
- **Deployment**: GitHub Pages compatible (using github-pages gem ~209)

## Build Output
- Generated site files are placed in `_site/` directory
- SASS files are compressed in production
- Excluded files: Gemfile, node_modules, vendor directories, docker-compose.yml