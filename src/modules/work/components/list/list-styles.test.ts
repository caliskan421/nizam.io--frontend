// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Görev tablosu görünüm kuralları (KESİN 5): ham renk yok, px yalnız list-metrics.css'te,
// satır içi stil yok, .vue ≤ 250 satır; ızgara tasarımla aynı.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

describe('görev tablosu görünüm kuralları', () => {
  it('ham renk yok', () => {
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yalnız list-metrics.css içinde; metrics yalnız --list-*', () => {
    for (const name of [...vue, ...css]) {
      if (name === 'list-metrics.css') continue
      expect(stripComments(read(name)).match(PX)?.[0], name).toBeUndefined()
    }
    const metrics = stripComments(read('list-metrics.css'))
    for (const decl of metrics.match(/[\w-]+\s*:/g) ?? [])
      expect(decl).toMatch(/^--list-[\w-]+\s*:$/)
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('tablo ızgarası tasarımla aynı (20 · 1fr · 124 · 132 · 60; satır 64, en az 640)', () => {
    const metrics = read('list-metrics.css')
    expect(metrics).toMatch(/--list-cols: 20px minmax\(0, 1fr\) 124px 132px 60px;/)
    expect(metrics).toMatch(/--list-row-h: 64px;/)
    expect(metrics).toMatch(/--list-min-w: 640px;/)
    expect(read('list.css')).toMatch(
      /\.rp-dtable \.rp-tr \{[^}]*grid-template-columns: var\(--list-cols\)/,
    )
  })
})
