// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Üst çubuk görünüm kuralları (KESİN 5): ham renk yok, px yok (medya koşulu hariç; `--topbar-*`
// ölçüleri üretilmiş token'da, CX-F0-Ö-02), satır içi stil yok, .vue ≤ 250 satır; tema simgesi yalnız CSS ile.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('üst çubuk görünüm kuralları', () => {
  it('ham renk yok; px yok (medya koşulu hariç); ayrı ölçü dosyası yok', () => {
    expect(css.filter((name) => name.includes('metrics'))).toEqual([])
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(stripMedia(stripComments(read(name))).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('zil devre dışıyken okunmamış noktası soluk değil; düğme yüzü aynı oranda soluk', () => {
    const style = stripComments(read('topbar.css'))
    const rule = (sel: string) =>
      new RegExp(`${sel.replace(/[.:]/g, (c) => `\\${c}`)} \\{([^}]*)\\}`).exec(style)?.[1] ?? ''
    // .t-iconbtn:disabled (opacity 0.4) çocuğa geçer: düğme opak, perde 1 - 0.4 = 0.6.
    const ui = stripComments(read('../../../shared/ui/styles/ui.css'))
    expect(ui).toMatch(/\.t-iconbtn:disabled \{\s*opacity: 0\.4;/)
    expect(rule('.rp-topbar .topbar-bell:disabled')).toMatch(/opacity: 1;/)
    const veil = rule('.topbar-bell:disabled::before')
    expect(veil).toMatch(/background: var\(--bg-base\);/)
    expect(veil).toMatch(/opacity: 0\.6;/)
    expect(veil).toMatch(/pointer-events: none;/)
    const dot = rule('.topbar-bell__dot')
    expect(dot).toMatch(/z-index: 1;/)
    expect(dot).toMatch(/background: var\(--danger\);/)
    expect(dot).not.toMatch(/opacity/)
  })

  it('tema simgesi CSS ile: koyuda ay gizli, açıkta güneş gizli', () => {
    const style = stripComments(read('topbar.css'))
    expect(style).toMatch(/\.rp-themebtn \.rp-ic-moon \{\s*display: none;/)
    expect(style).toMatch(/\[data-theme='light'\] \.rp-themebtn \.rp-ic-sun \{\s*display: none;/)
    expect(style).toMatch(/@media \(max-width: 900px\)/)
  })
})
