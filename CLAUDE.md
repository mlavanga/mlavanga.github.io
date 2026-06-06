# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mario Lavanga's personal academic/professional website, served at `https://mlavanga.github.io`. It is a **Next.js 16 (App Router) static-export** site (TypeScript + Tailwind 4) deployed to GitHub Pages. There is no backend — `output: 'export'` in `next.config.ts` means everything must be statically renderable. There are no API routes, and `images.unoptimized` is set because Pages can't run the Next image optimizer.

## Commands

```bash
npm run dev          # dev server on :3000 (standard method)
npm run build        # static export → ./out
npm run lint         # eslint (flat config in eslint.config.mjs)
```

Prefer the helper script for the dev server, which daemonizes it and manages a PID file (`.next.pid`) + log (`next.log`):

```bash
./serve.sh start | stop | restart | status | logs
```

There is **no test suite**. "Verification" for this project means building and inspecting the rendered output — the `WEBSITE_PLAN.md` workstream 5 uses Chrome DevTools MCP against `localhost:3000` (dev), `npx serve out/` (the built export), and the live URL, plus `lighthouse_audit` for SEO/Perf/A11y.

## Architecture

The whole homepage is **data-driven from a single file**: `app/data/content.ts`. It exports typed arrays (`personalInfo`, `experience`, `education`, `projects`, `publications`, `skills`, `media`) consumed by `app/page.tsx`, which lays them out as `<Section>`s and maps each array onto a presentational component in `app/components/` (`Hero`, `ExperienceCard`, `ProjectCard`, `Skills`, `Media`, `Navbar`, `Footer`). **To change site content, edit `content.ts`** — not the components. This file is the Next.js replacement for the old Jekyll `_config.yml`.

SEO/metadata lives in `app/layout.tsx` (page `metadata`, and any JSON-LD `Person` schema). Analytics is in `app/components/GoogleAnalytics.tsx`.

## Deployment

Pushing to `main` or `master` triggers `.github/workflows/nextjs.yml`, which runs `next build` and publishes `./out` to GitHub Pages. The workflow uses `actions/configure-pages` with `static_site_generator: next` to auto-inject `basePath` — keep this in mind, since base-path issues are a common source of broken asset URLs in the static export.

## Legacy code — do not touch unless asked

- `v_old/` — the frozen legacy **Jekyll** site (v1). Has its own `serve_old.sh` (port 4000). Kept for historical reference only.
- `old_content/` — backup of raw markdown/config from the Jekyll site.

New work goes in the Next.js app (`app/`).

## Active plan

`WEBSITE_PLAN.md` (v1) is the current improvement roadmap: fix stale facts in `content.ts`, expand SEO metadata + JSON-LD in `layout.tsx`, add Apple-Health positioning, and build a client-side health-data demo (SSL biosignal demo primary). Any new interactive demo must stay static-export-safe: `'use client'`, `next/dynamic` with `ssr:false` for browser-only libs, ML models loaded from CDN, only small sample data bundled in `public/`.
