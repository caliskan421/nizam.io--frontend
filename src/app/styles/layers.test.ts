// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { documentStyleOrder } from '../../../e2e/layer-check'

// CSS katman sırası (W61b): ortak CSS parçaları giriş CSS'inden önce bağlanabildiği için sıra
// bildirimi sayfanın İLK stil kaynağında (public/layers.css) da yapılır. Tek kaynak kuralı: iki
// liste aynı; index.html'de bağlantı ilk sırada. Derleme sonrası sıra e2e/layers.spec.ts'te.
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const layerList = (css: string) =>
  /@layer\s+([\w\s,-]+);/.exec(css.replace(/\/\*[\s\S]*?\*\//g, ''))?.[1]?.replace(/\s+/g, '')

describe('CSS katman sırası', () => {
  it('public/layers.css ile main.css aynı sırayı bildirir; PrimeVue components’ten önce', () => {
    const main = layerList(read('src/app/styles/main.css'))
    expect(main).toBe('theme,base,primevue,components,utilities')
    expect(layerList(read('public/layers.css'))).toBe(main)
    // Dosya yalnız sıra bildirimi taşır (kural yok; satır içi stil yok, CSP style-src 'self').
    const body = read('public/layers.css')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    expect(body).toBe('@layer theme, base, primevue, components, utilities;')
  })

  it('index.html: /layers.css ilk stil kaynağı ve modül betiğinden önce', () => {
    const html = read('index.html')
    expect(documentStyleOrder(html)[0]).toBe('/layers.css')
    const link = html.indexOf('href="/layers.css"')
    expect(link).toBeGreaterThan(0)
    expect(link).toBeLessThan(html.indexOf('<script type="module"'))
    expect(link).toBeLessThan(html.indexOf('</head>'))
  })

  it('Caddy: parmak izsiz dosya uzun immutable önbellek almaz; imaj dist/ (public dahil) taşır', () => {
    const caddy = read('deploy/Caddyfile')
    expect(caddy).toMatch(
      /handle \/assets\/\* \{\s*header Cache-Control "public, max-age=31536000, immutable"/,
    )
    expect(caddy).toMatch(/handle @static \{\s*header Cache-Control "public, max-age=3600"/)
    expect(read('Dockerfile')).toMatch(/COPY --from=build \/src\/dist \/srv/)
    expect(read('vite.config.ts')).not.toMatch(/publicDir:\s*false/)
  })
})
