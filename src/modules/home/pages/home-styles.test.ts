// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Ana sayfa görünüm kuralları (KESİN 5): ham renk yok, px yok (medya koşulu hariç;
// `--home-*` ölçüleri üretilmiş token'da, CX-F0-Ö-02), statik satır içi stil yok (tek dinamik bağ `--home-*` özel özelliği), .vue ≤ 250
// satır. Açık/koyu tema yalnız token'la: renk adı token değişkeni dışında yazılmaz.
const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(path)
    return /\.(vue|css)$/.test(entry.name) ? [path] : []
  })
}

const files = walk(root).map((path) => ({
  name: relative(root, path),
  text: readFileSync(path, 'utf8'),
}))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('ana sayfa görünüm kuralları', () => {
  it('dosyalar bulundu (sayfa, bileşenler, stiller)', () => {
    const names = files.map((f) => f.name)
    expect(names).toEqual(
      expect.arrayContaining(['pages/HomePage.vue', 'pages/home.css', 'components/KpiCard.vue']),
    )
  })

  it('ham renk yok', () => {
    for (const { name, text } of files) {
      expect(stripComments(text).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yok (medya koşulu hariç); ayrı ölçü dosyası yok', () => {
    expect(files.filter((f) => f.name.includes('metrics'))).toEqual([])
    for (const { name, text } of files) {
      expect(stripMedia(stripComments(text)).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('medya koşulu dar ekran eşiğiyle (--rp-narrow-max = 900px) aynı', () => {
    const css = files.find((f) => f.name === 'pages/home.css')!.text
    expect(css.match(/@media[^{]*/g)?.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
  })

  it('statik satır içi stil yok; dinamik bağ yalnız --home-* özel özelliği; .vue ≤ 250 satır', () => {
    for (const { name, text } of files.filter((f) => f.name.endsWith('.vue'))) {
      expect(text, name).not.toMatch(/\sstyle=/)
      for (const binding of text.match(/:style="[^"]*"/g) ?? []) {
        expect(binding, name).toBe(':style="fill"')
      }
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
    const card = files.find((f) => f.name === 'components/KpiCard.vue')!.text
    expect(card).toMatch(/'--home-kpi-fill': `\$\{props\.card\.bar\}%`/)
  })
})
