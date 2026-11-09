// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Notlar sekmesi görünüm kuralları (KESİN 5): ham renk yok, px yalnız notes-metrics.css'te
// (yalnız --notes-*), satır içi stil yok (CSP), .vue ≤ 250 satır.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

describe('notlar görünüm kuralları', () => {
  it('ham renk yok; px yalnız notes-metrics.css (yalnız --notes-*)', () => {
    expect(vue.length).toBeGreaterThanOrEqual(3)
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
      if (name === 'notes-metrics.css') continue
      expect(stripComments(read(name)).match(PX)?.[0], name).toBeUndefined()
    }
    const metrics = stripComments(read('notes-metrics.css'))
    for (const decl of metrics.match(/[\w-]+\s*:/g) ?? []) {
      expect(decl).toMatch(/^--notes-[\w-]+\s*:$/)
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })
})
