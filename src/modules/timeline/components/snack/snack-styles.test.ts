// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Tasarım birebir kuralı (KESİN 5, 17): ham renk ve px yok; satır içi stil özniteliği yok
// (geri sayım oranı CSSOM üzerinden özel özellik — CSP `style-src-attr`e takılmaz);
// `prefers-reduced-motion`'da giriş animasyonu ve çubuk geçişi kapalı (E-03C-72).
const dir = fileURLToPath(new URL('.', import.meta.url))
const css = readFileSync(`${dir}snack.css`, 'utf8')
const vue = readFileSync(`${dir}DateChangeSnack.vue`, 'utf8')
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/

describe('W95 bildirim görünüm kuralları', () => {
  it('ham renk ve px yok (medya koşulu eşiği hariç; media-thresholds.test.ts sabitler)', () => {
    for (const text of [
      css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '@media {'),
      vue,
    ]) {
      expect(text.match(RAW_COLOR)?.[0]).toBeUndefined()
      expect(text.match(PX)?.[0]).toBeUndefined()
    }
  })

  it('satır içi style özniteliği yok; yalnız --snack-left özel özelliği bağlanır', () => {
    expect(vue).not.toMatch(/\sstyle="/)
    const bound = [...vue.matchAll(/:style="([^"]*)"/g)].map((m) => m[1])
    expect(bound).toHaveLength(1)
    expect(bound[0]).toContain("'--snack-left'")
  })

  it('azaltılmış harekette giriş animasyonu ve geri sayım geçişi kapalı', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.rp-snack\s*\{[^}]*animation:\s*none/)
    expect(reduced).toMatch(/\.rp-snack__bar\s*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.rp-snack\s*\{[^}]*animation:\s*rp-snack-in/)
    expect(css).toMatch(/\.rp-snack__bar\s*\{[^}]*transition:\s*transform/)
  })

  it("tasarım katmanı: z-index 61, ters renk zemin, kenar menüsü kaydırması token'dan", () => {
    expect(css).toMatch(/z-index:\s*61/)
    expect(css).toMatch(/background:\s*var\(--ink\)/)
    expect(css).toContain('var(--rp-side-w)')
    expect(css).toContain('--accent')
  })
})
