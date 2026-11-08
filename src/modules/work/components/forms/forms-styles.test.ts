// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Tasarım birebir kuralı (KESİN 5): renk, boşluk, yarıçap yalnız token; ham renk ve px yok,
// satır içi stil yok (ölçek dışı değerler `shared/ui/styles/metrics.css` `--ui-*`).
const dir = fileURLToPath(new URL('.', import.meta.url))
const files = readdirSync(dir).filter((n) => n.endsWith('.vue') || n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/

describe('W45 form görünüm kuralları', () => {
  it('ham renk ve px yok; satır içi stil yok', () => {
    expect(files.length).toBeGreaterThan(4)
    for (const name of files) {
      const text = readFileSync(join(dir, name), 'utf8')
      expect(text.match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(text.match(PX)?.[0], name).toBeUndefined()
      if (name.endsWith('.vue')) expect(text, name).not.toMatch(/\s:?style=/)
    }
  })

  it('durum noktaları tasarımdaki beş sınıf + açık tema token’ı', () => {
    const css = readFileSync(join(dir, 'forms.css'), 'utf8')
    for (const dot of ['todo', 'doing', 'review', 'back', 'done']) {
      expect(css).toContain(`.rp-dot--${dot}`)
    }
    expect(css).toContain('var(--rp-done-fill)')
  })
})
