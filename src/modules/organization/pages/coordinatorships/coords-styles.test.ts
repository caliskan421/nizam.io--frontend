// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

// 08 liste görünüm kuralları (KESİN 5): ham renk yok, px yok (medya koşulu hariç; ölçek dışı
// ölçüler `--coords-*` üretilmiş token), satır içi stil yok, .vue ≤ 250 satır; katman `components`.
const pageDir = fileURLToPath(new URL('.', import.meta.url))
const cardDir = fileURLToPath(new URL('../../components/coordinatorships/', import.meta.url))
const files = [
  ...[pageDir, cardDir].flatMap((dir) =>
    readdirSync(dir)
      .filter((n) => /\.(vue|css)$/.test(n))
      .map((n) => ({ name: n, text: readFileSync(join(dir, n), 'utf8') })),
  ),
  {
    name: 'CoordinatorshipsPage.vue',
    text: readFileSync(join(pageDir, '../CoordinatorshipsPage.vue'), 'utf8'),
  },
]
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')
const css = files.filter((f) => f.name.endsWith('.css'))
const vue = files.filter((f) => f.name.endsWith('.vue'))

describe('08 liste görünüm kuralları', () => {
  it('ham renk yok', () => {
    for (const f of files)
      expect(stripComments(f.text).match(RAW_COLOR)?.[0], f.name).toBeUndefined()
  })

  it('px yok (medya koşulu hariç); medya eşiği --rp-narrow-max (900px)', () => {
    for (const f of files) {
      expect(stripMedia(stripComments(f.text)).match(PX)?.[0], f.name).toBeUndefined()
    }
    const media = css.flatMap((f) => f.text.match(/@media[^{]*/g) ?? []).map((m) => m.trim())
    expect(media).toEqual(['@media (max-width: 900px)'])
  })

  it('kullanılan her --coords-* ölçüsü üretilmiş token', () => {
    const used = new Set(
      files.flatMap((f) => [...f.text.matchAll(/var\(--(coords-[a-z0-9-]+)\)/g)].map((m) => m[1]!)),
    )
    expect(used.size).toBeGreaterThan(20)
    expect([...used].filter((name) => !(name in TOKENS))).toEqual([])
  })

  it('stiller components katmanında; satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const f of css)
      expect(stripComments(f.text).trim(), f.name).toMatch(/^@layer components \{/)
    for (const f of vue) {
      expect(f.text, f.name).not.toMatch(/\s:?style=/)
      expect(f.text.split('\n').length, f.name).toBeLessThanOrEqual(250)
    }
  })
})
