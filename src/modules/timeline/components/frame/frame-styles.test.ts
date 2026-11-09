// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Sayfa çerçevesi görünüm kuralları (KESİN 5, 17): ham renk yok, px yok (medya koşulu hariç),
// satır içi stil yok (dinamik konum/doluluk `:style` ile CSSOM üzerinden), açıklama noktaları
// çubuk paletiyle (`--gp-*`) eşli, .vue ≤ 250 satır.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = read('frame.css')
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('zaman çizelgesi çerçevesi görünüm kuralları', () => {
  it('ham renk yok; px yok (medya koşulu hariç)', () => {
    for (const [name, text] of [['frame.css', css], ...vue.map((n) => [n, read(n)])]) {
      expect(stripComments(text!).match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(stripMedia(stripComments(text!)).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('medya eşiği dar ekran token değeriyle aynı (--rp-narrow-max = 900px)', () => {
    expect(css.match(/@media[^{]*/g)?.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
  })

  it('satır içi stil özniteliği yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      expect(read(name), name).not.toMatch(/\sstyle="/)
      expect(read(name).split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('açıklama noktaları çubuk paletine (--gp-*) eşli', () => {
    for (const [status, token] of [
      ['todo', 'gp-todo'],
      ['doing', 'gp-doing'],
      ['review', 'gp-review'],
      ['back', 'gp-back'],
      ['done', 'gp-done'],
    ]) {
      const rule = new RegExp(`\\.tl-legend__dot--${status} \\{[^}]*var\\(--${token}\\)`)
      expect(css, status).toMatch(rule)
    }
    expect(css).toMatch(/\.tl-legend__dot--doneLate \{[^}]*--gp-done[^}]*--gp-late/)
  })
})
