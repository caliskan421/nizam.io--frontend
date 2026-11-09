// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Ayrıntı paneli görünüm kuralları (KESİN 5): ham renk yok, px yalnız detail-metrics.css'te
// (yalnız --wd-* bildirimleri), satır içi stil yok, .vue ≤ 250 satır.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

describe('ayrıntı paneli görünüm kuralları', () => {
  it('ham renk yok; px yalnız detail-metrics.css (yalnız --wd-*)', () => {
    expect(css).toEqual(expect.arrayContaining(['detail.css', 'detail-metrics.css']))
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
      if (name === 'detail-metrics.css') continue
      expect(stripComments(read(name)).match(PX)?.[0], name).toBeUndefined()
    }
    const metrics = stripComments(read('detail-metrics.css'))
    for (const decl of metrics.match(/[\w-]+\s*:/g) ?? []) {
      expect(decl).toMatch(/^--wd-[\w-]+\s*:$/)
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    expect(vue.length).toBeGreaterThanOrEqual(6)
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('açık tema yalnız token: tamamlanan nokta --rp-done-fill', () => {
    expect(stripComments(read('detail.css'))).toMatch(
      /\.wd \.rp-dot--done \{\s*background: var\(--rp-done-fill\);/,
    )
  })
})
