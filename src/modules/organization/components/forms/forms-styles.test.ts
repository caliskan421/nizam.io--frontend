// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Tasarım birebir kuralı (KESİN 5): renk, boşluk, yarıçap yalnız token; ham renk ve px yok,
// satır içi stil yok. Formlar çizilmemiş (P3): yalnız `shared/ui` sınıfları + `of-*` yerleşimi.
const dir = fileURLToPath(new URL('.', import.meta.url))
const files = readdirSync(dir).filter((n) => n.endsWith('.vue') || n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/

describe('W74 form görünüm kuralları', () => {
  it('ham renk ve px yok; satır içi stil yok', () => {
    expect(files.length).toBeGreaterThan(6)
    for (const name of files) {
      const text = readFileSync(join(dir, name), 'utf8')
      expect(text.match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(text.match(PX)?.[0], name).toBeUndefined()
      if (name.endsWith('.vue')) expect(text, name).not.toMatch(/\s:?style=/)
    }
  })

  it('stiller components katmanında; yalnız of-* sınıfları tanımlanır', () => {
    const css = readFileSync(join(dir, 'forms.css'), 'utf8')
    expect(css).toMatch(/@layer components \{/)
    const selectors = [...css.matchAll(/^\s+(\.[a-z][\w-]*)/gm)].map((m) => m[1]!)
    expect(selectors.length).toBeGreaterThan(5)
    for (const s of selectors) expect(s, s).toMatch(/^\.of-/)
  })
})
