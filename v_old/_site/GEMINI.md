# Project Context: Mario Lavanga's Personal Website

## Overview
This project is the source code for the personal academic and professional website of **Mario Lavanga**, hosted on GitHub Pages. It is a static site built with **Jekyll** using the `modern-resume-theme`.

The site serves as a digital resume, portfolio, and blog, featuring:
*   **Personal Info**: Bio, contact details, and social links.
*   **Resume Sections**: Experience, Education, Projects, and Skills.
*   **Publications**: A collection of academic articles (`_articles`).
*   **Blog**: Standard Jekyll posts (`_posts`).

## Architecture & Technologies
*   **Engine**: [Jekyll](https://jekyllrb.com/) (Ruby-based static site generator).
*   **Theme**: `modern-resume-theme` (customized).
*   **Languages**: HTML, SCSS, Markdown, Ruby (for plugins/config).
*   **Hosting**: GitHub Pages.

## Key Files & Directories
*   **`_config.yml`**: The central configuration file. It contains not just site settings but also the **content** for sections like Experience, Education, and Projects.
*   **`_articles/`**: Custom collection for academic publications. Files are named `YYYY-MM-DD-title.md`.
*   **`_posts/`**: Standard blog posts.
*   **`_layouts/`**: HTML templates for different page types (e.g., `default.html`, `post.html`).
*   **`_includes/`**: Reusable HTML snippets (e.g., `header.html`, `footer.html`, section layouts like `top-middle.html`).
*   **`assets/`**: Static assets including CSS (`main.scss`) and JavaScript.
*   **`install.sh`**: Helper script to install Ruby gem dependencies, handling Bundler compatibility.
*   **`serve.sh`**: Helper script to manage the Jekyll development server (start/stop/restart/logs) in the background.

## Development Workflow

### 1. Installation
To install dependencies (Ruby Gems), run:
```bash
./install.sh
```
This script checks for Ruby and Bundler compatibility and runs `bundle install`.

### 2. Running the Server
Use the provided `serve.sh` script to run the server. This handles background execution and logging.

*   **Start**: `./serve.sh start` (Server runs at `http://localhost:4000`)
*   **Stop**: `./serve.sh stop`
*   **Check Status**: `./serve.sh status`
*   **View Logs**: `./serve.sh logs` or `./serve.sh follow`

*Alternative (Standard)*: `bundle exec jekyll serve --livereload`

### 3. Content Management
*   **Resume Content**: Edit `_config.yml`. Look for the `content` list. Items use specific layouts (e.g., `top-middle` for publications/projects, `middle` for experience, `Left` for education).
*   **New Articles**: Add Markdown files to `_articles/`.
*   **New Blog Posts**: Add Markdown files to `_posts/`.
*   **Styling**: Edit SCSS files in `_sass/` or `assets/main.scss`.

## Theme Specifics
*   **Content Injection**: Unlike standard Jekyll themes that might use `_data` files, this theme heavily utilizes `_config.yml` to define the structure and content of the main page sections.
*   **Layouts**: The `_includes` directory contains specific partials (`top-middle.html`, `left.html`, etc.) that correspond to the `layout` keys used in `_config.yml`.
