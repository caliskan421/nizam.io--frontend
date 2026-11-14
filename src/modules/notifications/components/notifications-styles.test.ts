// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Panel görünüm kuralları (KESİN 5): ham renk yok, px yok (medya koşulu hariç), satır içi stil
// yok, .vue ≤ 250 satır; açık/koyu tema yalnız token değişimiyle (tema seçici yok).
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const files = readdirSync(dir).filter((n) => /\.(vue|css)$/.test(n))
const strip = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '@media {')
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i

describe('bildirim paneli görünüm kuralları', () => {
  it('ham renk ve px yok', () => {
    for (const name of files) {
      expect(strip(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(strip(read(name)).match(/\d(?:\.\d+)?px\b/)?.[0], name).toBeUndefined()
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of files.filter((n) => n.endsWith('.vue'))) {
      expect(read(name), name).not.toMatch(/\s:?style=/)
      expect(read(name).split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('tema seçici yok (açık tema yalnız token değişimiyle); dar ekran eşiği 900', () => {
    const css = read('notifications.css')
    expect(css).not.toMatch(/data-theme/)
    expect(css).toMatch(/@media \(max-width: 900px\)/)
  })

  it('panel katmanı kenar menüsü perdesinin (39/40) üstünde, pencerelerin (50) altında', () => {
    const z = /\.nb-panel \{[^}]*z-index: (\d+)/.exec(read('notifications.css'))?.[1]
    expect(Number(z)).toBeGreaterThan(40)
    expect(Number(z)).toBeLessThan(50)
  })

  it('sekme satırı küçülmez ve gövdenin üstündedir (KUSUR 3: grup başlığı sekmeyi örtmez)', () => {
    const rule = /\.nb-tabs > \.rp-tabs \{([^}]*)\}/.exec(read('notifications.css'))?.[1] ?? ''
    expect(rule).toMatch(/flex: none;/)
    expect(rule).toMatch(/position: relative;/)
    expect(rule).toMatch(/z-index: 1;/)
    expect(rule).toMatch(/background: var\(--bg-raised\);/)
  })
})
