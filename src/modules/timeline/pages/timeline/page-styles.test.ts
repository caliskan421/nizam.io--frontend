// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Sayfa yerleşimi görünüm kuralları (KESİN 5, 17): ham renk yok, px yok (medya koşulu hariç),
// satır içi stil özniteliği yok, .vue ≤ 250 satır, medya eşiği dar ekran token değeriyle aynı.
const dir = fileURLToPath(new URL('.', import.meta.url))
const css = readFileSync(join(dir, 'timeline.css'), 'utf8')
const page = readFileSync(join(dir, '../TimelinePage.vue'), 'utf8')
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('zaman çizelgesi sayfa görünüm kuralları', () => {
  it('ham renk yok; px yok (medya koşulu hariç)', () => {
    for (const [name, text] of [
      ['timeline.css', css],
      ['TimelinePage.vue', page],
    ] as const) {
      expect(stripComments(text).match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(stripMedia(stripComments(text)).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('medya eşiği --rp-narrow-max (900px); satır içi stil özniteliği yok; sayfa ≤ 250 satır', () => {
    expect(css.match(/@media[^{]*/g)?.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
    expect(page).not.toMatch(/\sstyle="/)
    expect(page.split('\n').length).toBeLessThanOrEqual(250)
  })

  it('tam ekran kipi ve panel konumu token’lı', () => {
    expect(css).toMatch(/\.timeline-stage--full \{[^}]*position: fixed[^}]*inset: 0/)
    expect(css).toMatch(
      /\.timeline-dock \.timeline-panel \{[^}]*right: var\(--space-4\)[^}]*bottom: var\(--space-4\)/,
    )
    expect(css).toMatch(/\.timeline-dock \.timeline-panel \{[^}]*width: var\(--rp-aside-basis\)/)
  })

  it('K-1: panel görünür alana yapışır (sticky kenet) ve yüksekliği pencereyle sınırlı', () => {
    expect(css).toMatch(/\.timeline-dock \{[^}]*position: sticky[^}]*bottom: 0[^}]*height: 0/)
    expect(css).toMatch(/\.timeline-dock \.timeline-panel \{[^}]*max-height: calc\(100dvh/)
    // dar ekranda kenet akışa döner (panel Gantt altında)
    expect(css).toMatch(/@media[^{]*\{[\s\S]*\.timeline-dock \{[^}]*position: static/)
  })
})
