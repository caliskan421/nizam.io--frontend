// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Kenar menüsü görünüm kuralları (KESİN 5): ham renk yok, px yalnız side-metrics.css'te (medya
// koşulu hariç), satır içi stil yok, .vue ≤ 250 satır; 272/76 px genişlik ve taşma önlemleri token.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('kenar menüsü görünüm kuralları', () => {
  it('ham renk yok', () => {
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yalnız side-metrics.css içinde (medya koşulu hariç); metrics yalnız --side-*', () => {
    for (const name of [...vue, ...css]) {
      if (name === 'side-metrics.css') continue
      expect(stripMedia(stripComments(read(name))).match(PX)?.[0], name).toBeUndefined()
    }
    const metrics = stripComments(read('side-metrics.css'))
    for (const decl of metrics.match(/[\w-]+\s*:/g) ?? [])
      expect(decl).toMatch(/^--side-[\w-]+\s*:$/)
  })

  it('medya koşulu dar ekran eşiğiyle (--rp-narrow-max = 900px) aynı', () => {
    const tokens = readFileSync(join(dir, '../../../shared/tokens/tokens.gen.css'), 'utf8')
    expect(tokens).toMatch(/--rp-narrow-max:\s*900px/)
    const media = read('side.css').match(/@media[^{]*/g) ?? []
    expect(media.map((m) => m.trim())).toEqual([
      '@media (min-width: 901px)',
      '@media (max-width: 900px)',
    ])
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('genişlikler token; ızgara ve metinler taşmaz', () => {
    const side = stripComments(read('side.css'))
    expect(side).toMatch(/\.rp-side \{[^}]*flex: 0 0 var\(--rp-side-w\)/)
    expect(side).toMatch(/\.rp-side--rail \{[^}]*flex-basis: var\(--rp-rail-w\)/)
    expect(side).toMatch(
      /\.side-pair \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/,
    )
    expect(side).toMatch(/\.side-card \{[^}]*min-width: 0/)
    expect(side).toMatch(/\.side-card__v \{[^}]*min-width: 0/)
    expect(side).toMatch(/\.side-railbtn \{[^}]*max-width: 100%/)
  })
})
