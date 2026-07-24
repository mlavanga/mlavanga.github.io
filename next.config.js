// IMPORTANT: this config MUST stay as `next.config.js` (CommonJS), not `.ts`.
//
// The GitHub Pages deploy workflow runs `actions/configure-pages@v5` with
// `static_site_generator: next`, which injects `basePath`, `output: 'export'`
// and `images.unoptimized` into the Next config at build time. That action can
// only read/augment a `next.config.js` (or `.mjs`) written as an "indirect
// module export" (`const nextConfig = {...}; module.exports = nextConfig`).
// If the config is a `next.config.ts`, the action does NOT see it, falls back
// to a blank generated config, and every custom setting here — notably
// `trailingSlash` — is silently dropped in CI (it still works locally, which
// masks the bug). That is exactly what made `/health-lab/` and `/adme-lab/`
// return 404 on Pages. Keep this file as `.js` in this exact shape so the
// action augments it instead of replacing it.

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Emit directory-form routes (health-lab/index.html) so GitHub Pages serves
  // both `/health-lab` (301 -> slashed) and `/health-lab/` (200). Without this
  // the export is flat (health-lab.html) and the trailing-slash URL 404s.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
