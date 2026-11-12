// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// 12 Silinen kayıtlar görünüm kuralları (KESİN 5, 17): ham renk yok, px yok (medya koşulu hariç;
// ızgara ölçüleri mevcut token ölçeğinin katlarıdır), tüm stil `@layer components` içinde (CSS
// katman sırası dersi), statik satır içi stil yok, .vue ≤ 250 satır, medya eşiği dar ekran
// eşiğiyle (--rp-narrow-max) aynı.
const root = fileURLToPath(new URL('.', import.meta.url))

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
const css = files.filter((f) => f.name.endsWith('.css'))

describe('silinen kayıtlar görünüm kuralları', () => {
  it('sayfa, bileşenler ve stil dosyası bulundu', () => {
    const names = files.map((f) => f.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'pages/DeletedRecordsPage.vue',
        'components/deleted-records.css',
        'components/RecordRow.vue',
      ]),
    )
  })

  it('ham renk ve px yok (medya koşulu hariç)', () => {
    for (const { name, text } of files) {
      const clean = stripComments(text)
      expect(clean.match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(stripMedia(clean).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('bütün kurallar @layer components içinde (katman dışı kural yok)', () => {
    for (const { name, text } of css) {
      const clean = stripComments(text)
      // Üst düzey blok sayısı = @layer blokları; her blok `@layer components {` ile açılır.
      const top = clean.replace(/@layer components \{[\s\S]*?\n\}\n?/g, '').trim()
      expect(top, name).toBe('')
    }
  })

  it('medya eşiği dar ekran eşiğiyle (900px) aynı', () => {
    const thresholds = css.flatMap((f) => stripComments(f.text).match(/@media[^{]*/g) ?? [])
    expect(thresholds.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
  })

  it('statik satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const { name, text } of files.filter((f) => f.name.endsWith('.vue'))) {
      expect(text, name).not.toMatch(/\sstyle=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('seçim/kalan süre/Yakında kartı stilleri yok (P36/P37)', () => {
    const all = css.map((f) => f.text).join('\n')
    expect(all).not.toMatch(/rp-bulk|rp-left|rp-expire|rp-trnote/)
  })
})
