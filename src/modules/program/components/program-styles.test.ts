// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Tasarım kuralı (KESİN 5): renk, boşluk, yarıçap yalnız token; ham renk ve px yok, satır içi stil
// yok. Ekran çizilmedi (P3): yalnız `shared/ui` sınıfları + `pg-*` yerleşimi.
const dir = fileURLToPath(new URL('.', import.meta.url))
const pages = fileURLToPath(new URL('../pages/', import.meta.url))
const files = [
  ...readdirSync(dir)
    .filter((n) => n.endsWith('.vue') || n.endsWith('.css'))
    .map((n) => join(dir, n)),
  ...readdirSync(pages)
    .filter((n) => n.endsWith('.vue'))
    .map((n) => join(pages, n)),
]
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/

describe('program yönetimi görünüm kuralları', () => {
  it('ham renk ve px yok; satır içi stil yok', () => {
    expect(files.length).toBeGreaterThan(8)
    for (const path of files) {
      const text = readFileSync(path, 'utf8')
      expect(text.match(RAW_COLOR)?.[0], path).toBeUndefined()
      expect(text.match(PX)?.[0], path).toBeUndefined()
      if (path.endsWith('.vue')) expect(text, path).not.toMatch(/\s:?style=/)
    }
  })

  it('stiller components katmanında; tanımlanan kök sınıflar pg-* (kapsanmış rp-* başlık dahil)', () => {
    const css = readFileSync(join(dir, 'program.css'), 'utf8')
    expect(css).toMatch(/@layer components \{/)
    const selectors = [...css.matchAll(/^\s+(\.[a-z][\w-]*)/gm)].map((m) => m[1]!)
    expect(selectors.length).toBeGreaterThan(10)
    for (const s of selectors) expect(s, s).toMatch(/^\.pg-/)
  })
})
