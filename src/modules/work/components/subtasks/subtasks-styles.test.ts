// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Alt görev görünüm kuralları (KESİN 5): ham renk yok, px yok (medya koşulu hariç;
// `--sub-*` üretilmiş token), satır içi stil yok, .vue ≤ 250 satır; açık tema tarih girişi; eksik vurgusu yok.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('alt görev görünüm kuralları', () => {
  it('ham renk yok', () => {
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yok (medya koşulu hariç); ayrı ölçü dosyası yok', () => {
    expect(css.filter((name) => name.includes('metrics'))).toEqual([])
    for (const name of [...vue, ...css]) {
      expect(stripMedia(stripComments(read(name))).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('medya koşulu dar ekran eşiğiyle (--rp-narrow-max = 900px) aynı', () => {
    const tokens = readFileSync(join(dir, '../../../../shared/tokens/tokens.gen.css'), 'utf8')
    expect(tokens).toMatch(/--rp-narrow-max:\s*900px/)
    const media = css.flatMap((name) => read(name).match(/@media[^{]*/g) ?? [])
    expect(media.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('tasarım ızgarası token; açık temada tarih girişi açık; zorunluluk vurgusu yok (P5)', () => {
    const all = css.map((name) => stripComments(read(name))).join('\n')
    expect(all).toMatch(
      /\.rp-stask \{[^}]*grid-template-columns:\s*var\(--sub-check\) minmax\(0, 1fr\) var\(--sub-col-person\) var\(--sub-col-date\)\s*var\(--sub-col-file\) var\(--sub-col-menu\)/,
    )
    expect(all).toMatch(/\[data-theme='light'\] \.rp-dr \.t-input \{\s*color-scheme: light;/)
    expect(all).not.toMatch(/data-miss|data-req/)
  })

  it('onay kutusu hücreyi doldurur: sarmalayıcı da boyut alır (2 px çökme, E-03-31)', () => {
    const all = css.map((name) => stripComments(read(name))).join('\n')
    const rule = /\.rp-subs \.t-checkwrap,[^{]*\{([^}]*)\}/.exec(all)
    expect(rule?.[0]).toContain('.rp-dsubs .t-checkwrap')
    expect(rule?.[0]).toContain('.rp-subs .t-check')
    expect(rule?.[1]).toMatch(/width: 100%;\s*height: 100%;/)
  })
})
