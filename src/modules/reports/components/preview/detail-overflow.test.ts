// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// W178 KUSUR 1: `.report-card` iki dosyada tanımlıdır (reports.css durum kartı: `align-items: start`,
// `max-inline-size`; detail.css görev kartı). Kâğıt içinde görev kartı yayılmazsa kesilen başlık satırı
// doğal genişliğine açılır ve 390 px'te sayfa yatay taşar. Düzen testi tarayıcıdadır (duman:
// `scrollWidth === innerWidth`); burada kural kaynağı korunur.
const css = readFileSync(fileURLToPath(new URL('./detail.css', import.meta.url)), 'utf8')

describe('rapor ayrıntı kartı kâğıt içinde yayılır', () => {
  it('`.report-paper .report-card` durum kartı kurallarını geçersiz kılar', () => {
    const rule = /\.report-paper \.report-card \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).toMatch(/align-items:\s*stretch/)
    expect(rule).toMatch(/max-inline-size:\s*none/)
    expect(rule).toMatch(/inline-size:\s*auto/)
  })
})
