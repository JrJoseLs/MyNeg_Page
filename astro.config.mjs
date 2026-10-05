// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio propio: https://myneg.duckdns.org (ver public/CNAME).
// Sin dominio, en GitHub Pages de proyecto: SITE_URL=https://<usuario>.github.io y BASE_PATH=/<repo>.
const site = process.env.SITE_URL ?? 'https://myneg.duckdns.org';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
  vite: { build: { chunkSizeWarningLimit: 800 } },
});
