// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// 08b görünüm kuralları (KESİN 5): ham renk yok, px yok (medya koşulu hariç; `--cd-*` ölçüleri
// üretilmiş token'da), satır içi stil yok, .vue ≤ 250 satır; açık/koyu tema yalnız token'la.
// Kullanılan her `var(--…)` üretilmiş token dosyasında tanımlı.
const here = fileURLToPath(new URL('.', import.meta.url))
const pages = fileURLToPath(new URL('../../pages', import.meta.url))
const tokens = readFileSync(
  fileURLToPath(new URL('../../../../shared/tokens/tokens.gen.css', import.meta.url)),
  'utf8',
)

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(path)
    return /\.(vue|css)$/.test(entry.name) ? [path] : []
  })
}

const files = [...walk(here), join(pages, 'CoordinatorshipPage.vue')].map((path) => ({
  name: relative(here, path),
  text: readFileSync(path, 'utf8'),
}))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('08b görünüm kuralları', () => {
  it('dosyalar bulundu', () => {
    expect(files.map((f) => f.name)).toEqual(
      expect.arrayContaining(['detail.css', 'CoordinatorshipDetail.vue', 'KpiStrip.vue']),
    )
  })

  it('ham renk yok', () => {
    for (const { name, text } of files) {
      expect(stripComments(text).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yok (medya koşulu hariç); medya eşiği --rp-narrow-max (900px)', () => {
    for (const { name, text } of files) {
      expect(stripMedia(stripComments(text)).match(PX)?.[0], name).toBeUndefined()
    }
    const css = files.find((f) => f.name === 'detail.css')!.text
    expect(css.match(/@media[^{]*/g)?.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
    expect(tokens).toMatch(/--rp-narrow-max: 900px/)
  })

  it('her var(--…) üretilmiş token dosyasında tanımlı; stiller @layer components içinde', () => {
    const css = files.find((f) => f.name === 'detail.css')!.text
    const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]!))
    for (const name of used) expect(tokens, name).toContain(`${name}:`)
    expect(stripComments(css).trim()).toMatch(/^@layer components \{/)
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const { name, text } of files.filter((f) => f.name.endsWith('.vue'))) {
      expect(text, name).not.toMatch(/\sstyle=/)
      expect(text, name).not.toMatch(/:style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })
})
