// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages de proyecto: https://<usuario>.github.io/<repo>/
// Con dominio propio, define SITE_URL=https://myneg.do y BASE_PATH=/ en el workflow.
const site = process.env.SITE_URL ?? 'https://jrjosels.github.io';
const base = process.env.BASE_PATH ?? '/MyNeg_Page';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
  vite: { build: { chunkSizeWarningLimit: 800 } },
});
