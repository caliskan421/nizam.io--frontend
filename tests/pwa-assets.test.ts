// W167: PWA varlıkları tasarım token kaynağıyla eşlidir (manifest JSON'u ve `<meta theme-color>`
// ham değer ister; kaynak `tokens/design-system.tokens.json`, üretici `scripts/gen-pwa.ts`).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { colorOf, iconSvg } from '../scripts/gen-pwa'

const ROOT = resolve(__dirname, '..')
const read = (file: string) => readFileSync(resolve(ROOT, file), 'utf8')
const source = JSON.parse(read('tokens/design-system.tokens.json')) as Parameters<typeof colorOf>[0]
const manifest = JSON.parse(read('public/manifest.webmanifest')) as Record<string, unknown>

function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(resolve(ROOT, file))
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('manifest.webmanifest', () => {
  it('ad, başlangıç, görüntü kipi ve token renkleri', () => {
    expect(manifest.name).toBe('RoketPortal')
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe(colorOf(source, 'bg-base').dark)
    expect(manifest.background_color).toBe(colorOf(source, 'bg-base').dark)
  })

  it('her simge dosyası var ve bildirilen boyutta PNG', () => {
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string }>
    expect(icons.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512', '512x512'])
    for (const icon of icons) {
      const [w] = icon.sizes.split('x').map(Number)
      expect(icon.type).toBe('image/png')
      expect(pngSize(`public${icon.src}`)).toEqual({ width: w, height: w })
    }
    expect(icons.some((i) => (i as { purpose?: string }).purpose === 'maskable')).toBe(true)
  })

  it('apple-touch-icon 180x180', () => {
    expect(pngSize('public/apple-touch-icon.png')).toEqual({ width: 180, height: 180 })
  })

  it('icon.svg üreticiyle ve token renkleriyle aynı', () => {
    const accent = colorOf(source, 'accent').dark
    const top = colorOf(source, 'accent-top').dark
    const ink = colorOf(source, 'accent-ink').dark
    expect(read('public/icon.svg')).toBe(iconSvg(top, accent, ink))
  })
})

describe('index.html', () => {
  const html = read('index.html')

  it('manifest + apple-touch-icon bağlantısı', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />')
  })

  it('theme-color koyu/açık bg-base token değerleriyle eşli', () => {
    const { dark, light } = colorOf(source, 'bg-base')
    expect(html).toContain(`content="${dark}" media="(prefers-color-scheme: dark)"`)
    expect(html).toContain(`content="${light}" media="(prefers-color-scheme: light)"`)
  })
})

describe('deploy/Caddyfile', () => {
  it('manifest açık MIME türü ve no-cache ile sunulur; manifest-src gerekmez', () => {
    const caddy = read('deploy/Caddyfile')
    expect(caddy).toMatch(
      /handle \/manifest\.webmanifest \{\s+header Content-Type "application\/manifest\+json"\s+header Cache-Control "no-cache"/,
    )
    // `manifest-src` verilmez: default-src 'self' (aynı köken) manifesti kapsar.
    expect(caddy).not.toContain('manifest-src')
  })
})
