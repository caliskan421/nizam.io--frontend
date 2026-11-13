// "Bölüm seç…" penceresi dar ekran kuralı (E-13-12; W142 KUSUR 5): 390 px'te tam ekran, alt şerit
// yapışık. Görünüm üretim paketi duman ölçümüyle de doğrulanır; burada kural bildirimi sabitlenir.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const css = readFileSync(
  resolve(process.cwd(), 'src/modules/reports/components/picker.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')
const narrow = css.slice(css.indexOf('@media (max-width: 900px)'))

describe('picker.css dar ekran', () => {
  it('pencere tam ekran: dolgusuz perde, tam yükseklik, yarıçapsız; yalnız bu pencerede', () => {
    expect(css).toContain('@media (max-width: 900px)')
    expect(narrow).toMatch(/\.t-modal-backdrop:has\(\.report-picker\) \{\s*padding: 0;/)
    expect(narrow).toMatch(
      /\.t-modal:has\(\.report-picker\) \{[^}]*height: 100%;[^}]*max-width: none;[^}]*border-radius: 0;/,
    )
  })

  it('gövde kayar, alt şerit yerinde kalır (yapışık düğmeler)', () => {
    expect(narrow).toMatch(
      /\.t-modal:has\(\.report-picker\) \.t-modal__body \{[^}]*flex: 1 1 auto;[^}]*overflow-y: auto;/,
    )
    expect(narrow).toMatch(/\.t-modal:has\(\.report-picker\) \{[^}]*overflow: hidden;/)
  })
})
