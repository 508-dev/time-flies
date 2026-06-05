import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built dist/ works served from any path —
  // a GitHub Pages project subdirectory or a domain root — with no config.
  base: "./",
  plugins: [svelte()],
})
