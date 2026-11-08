import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const pages = ['index', 'baseline', 'own', 'svar', 'frappe', 'dhtmlx']

export default defineConfig({
  plugins: [vue()],
  // Kök tasarım token'ları (`src/shared/tokens/tokens.gen.css`) ve şema tipleri okunur.
  server: { fs: { allow: [resolve(import.meta.dirname, '../..')] } },
  build: {
    manifest: true,
    // Satır içi `data:` varlıkları kapalı: CSP `style-src`/`img-src` ölçümü gerçek dosyalarla.
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
})
