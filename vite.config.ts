import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// Geliştirme ve `vite preview` aynı origin'den çalışır (CORS yok; platform.md §1):
// `/v1`, `/.well-known` ve `/healthz` istekleri yerel backend'e aktarılır. Hedef adres
// `.env.development` (veya ortam) içindeki NIZAMIO_DEV_BACKEND değişkenidir; VITE_ öneki
// taşımadığı için istemci paketine girmez.
// İstemci derleme sürümü (00-ortak E-00-02): CI etiket verirse `APP_VERSION`, yoksa package.json.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}
const appVersion = process.env.APP_VERSION ?? pkg.version

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'NIZAMIO_'), ...process.env }
  const backend = env.NIZAMIO_DEV_BACKEND ?? 'http://127.0.0.1:8080'
  const proxy = Object.fromEntries(
    ['/v1', '/.well-known', '/healthz'].map((prefix) => [
      prefix,
      { target: backend, changeOrigin: false, xfwd: true },
    ]),
  )

  return {
    plugins: [vue(), tailwindcss()],
    define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion) },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { proxy, strictPort: true },
    preview: { proxy, strictPort: true },
    test: {
      environment: 'jsdom',
      environmentOptions: { jsdom: { url: 'http://localhost/' } },
      include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
      restoreMocks: true,
    },
  }
})
