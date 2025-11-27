# Project Context: Mario Lavanga's Personal Website (v2)

## Overview
This project contains the source code for the personal academic and professional website of **Mario Lavanga**.

**Current Status (Nov 2025):**
The website has been migrated from **Jekyll** to **Next.js**.
*   **Root**: The new Next.js application (v2).
*   **`v_old/`**: The legacy Jekyll application (v1), preserved for reference.

## Architecture & Technologies (New Site)
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
*   **Language**: TypeScript.
*   **Styling**: Tailwind CSS 4.
*   **Deployment**: GitHub Pages (Static Export).
*   **CI/CD**: GitHub Actions (`.github/workflows/nextjs.yml`).

## Directory Structure
*   **`app/`**: Main Next.js application code (components, pages, data).
    *   `components/`: Reusable UI components (Hero, Navbar, ProjectCard, etc.).
    *   `data/`: Content files (e.g., `content.ts`) replacing the old `_config.yml`.
*   **`public/`**: Static assets (images, SVGs).
*   **`v_old/`**: The complete legacy Jekyll codebase.
*   **`old_content/`**: Backup of raw markdown content/config from the legacy site.

## Development Workflow

### 1. Managing the New Site (Next.js)
The site runs on **Port 3000**. Use the helper script `serve.sh` to manage the background process.

*   **Start**: `./serve.sh start`
*   **Stop**: `./serve.sh stop`
*   **Status**: `./serve.sh status`
*   **Logs**: `./serve.sh logs` (or `tail -f next.log`)

*Standard Method*: `npm run dev`

### 2. Managing the Legacy Site (Jekyll)
The legacy site runs on **Port 4000**. Use the helper script `serve_old.sh` (which wraps the old `serve.sh` inside `v_old`).

*   **Start**: `./serve_old.sh start`
*   **Stop**: `./serve_old.sh stop`
*   **Status**: `./serve_old.sh status`
*   **Logs**: `./serve_old.sh logs` (or `tail -f v_old/jekyll.log`)

**Note:** Ensure Port 4000 is free before starting the legacy site.

### 3. Deployment
The site is deployed automatically to GitHub Pages via GitHub Actions.
*   **Trigger**: Push to `master` or `main`.
*   **Config**: `.github/workflows/nextjs.yml`.
*   **Build Mode**: Static Export (`output: 'export'` in `next.config.ts`).

## Key Configuration Files
*   **`next.config.ts`**: Configures static export and image optimization settings for GitHub Pages.
*   **`tailwind.config.ts`** (or internal theme): Configures the design system.
*   **`app/data/content.ts`**: Central file for editing website content (Bio, Experience, Projects, Publications). This replaces Jekyll's `_config.yml`.

## Migration Notes
*   The legacy content has been ported to `app/data/content.ts`.
*   New features should be developed in the Next.js app (`app/`).
*   The `v_old` directory is frozen and should typically not be modified unless necessary for historical reference.
