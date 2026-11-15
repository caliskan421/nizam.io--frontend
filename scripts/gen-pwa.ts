// node scripts/gen-pwa.ts — PWA varlıkları (W167): public/manifest.webmanifest, public/icon.svg ve
// PNG simgeler (192/512, maskable 512, apple-touch-icon 180). Commit'lenir; elle çalıştırılır
// (paket betiği eklenmedi). Renkler tasarım sistemi kopyasından (`tokens/design-system.tokens.json`)
// okunur — manifest JSON'u CSS değişkeni kabul etmediği için ham değer burada ZORUNLUDUR; kaynak
// tek yerdir ve `tests/pwa-assets.test.ts` manifest/index.html ile token kaynağının eşliğini sınar.
// Simge = kenar menüsü logosu (Sidebar.dc.html: degrade accent-top → accent kare, `rocket` çizgisi
// accent-ink, 24'lük çerçevede stroke-width 2). Kenar boşluğu maskable güvenli alanına (%80 daire)
// sığar. PNG üretimi için mevcut devDependency Playwright'ın chromium'u kullanılır.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TOKENS = 'tokens/design-system.tokens.json'

type Themed = { dark: string; light: string }
type Token = { name: string; value: string | Themed }

export function colorOf(source: { color: { tokens: Token[] } }, name: string): Themed {
  const token = source.color.tokens.find((t) => t.name === name)
  if (!token || typeof token.value === 'string') throw new Error(`token yok ya da temasız: ${name}`)
  return token.value
}

/** Rocket çizgisi (`src/shared/ui/icons.ts` ile aynı yol). */
const ROCKET =
  'M5 19c1-4 3-6 6-7M13 11c2-4 5-6 8-7-1 3-3 6-7 8M9 15l-3 3M11 8 8 7 5 9l3 1M16 13l1 3-2 3-1-3'

export function iconSvg(top: string, accent: string, ink: string): string {
  // 24'lük çizim 512 alana %56 ölçekle ortalanır (güvenli alan içinde).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(88 88) scale(14)" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="${ROCKET}"/>
  </g>
</svg>
`
}

async function main(): Promise<void> {
  const source = JSON.parse(readFileSync(resolve(ROOT, TOKENS), 'utf8')) as {
    color: { tokens: Token[] }
  }
  const accent = colorOf(source, 'accent').dark
  const top = colorOf(source, 'accent-top').dark
  const ink = colorOf(source, 'accent-ink').dark
  const base = colorOf(source, 'bg-base').dark
  const svg = iconSvg(top, accent, ink)
  const publicDir = resolve(ROOT, 'public')
  mkdirSync(publicDir, { recursive: true })
  writeFileSync(resolve(publicDir, 'icon.svg'), svg)

  const manifest = {
    name: 'RoketPortal',
    short_name: 'RoketPortal',
    description: 'NIZAM.IO program ve görev portalı',
    lang: 'tr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: base,
    background_color: base,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  writeFileSync(
    resolve(publicDir, 'manifest.webmanifest'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const targets: Array<[string, number]> = [
      ['icon-192.png', 192],
      ['icon-512.png', 512],
      ['icon-maskable-512.png', 512],
      ['apple-touch-icon.png', 180],
    ]
    for (const [file, size] of targets) {
      await page.setViewportSize({ width: size, height: size })
      await page.setContent(
        `<style>html,body{margin:0;background:${base}}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
      )
      await page.screenshot({ path: resolve(publicDir, file), omitBackground: false })
    }
  } finally {
    await browser.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
