// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// 03d görünüm kuralları (KESİN 5): ham renk yok, px yok, satır içi stil yok, .vue ≤ 250 satır.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

describe('03d alt görev görünüm kuralları', () => {
  it('ham renk ve px yok', () => {
    for (const name of [...vue, ...css]) {
      const text = stripComments(read(name))
      expect(text.match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(text.match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır; ayrı ölçü dosyası yok', () => {
    expect(css.filter((n) => n.includes('metrics'))).toEqual([])
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('ızgara düzeni token / değişkenli; sahte elmas ve çubuk sınıfı yok', () => {
    const all = css.map((n) => stripComments(read(n))).join('\n')
    expect(all).toContain('var(--tl-label-col')
    expect(all).not.toMatch(/\.tl-(sub)?(bar|tick)/)
  })
})
