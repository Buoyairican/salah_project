import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const repoRoot = decodeURIComponent(new URL('..', import.meta.url).pathname)

/**
 * One self-contained index.html (code, styles and fonts inside) next to a media/ folder: it opens by double click,
 * with no internet and no server.
 */
export default defineConfig({
  base: './',
  server: { fs: { allow: [repoRoot] } },
  plugins: [viteSingleFile()],
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
})
