// Pencere gövdeleri dar ekran kuralı (P62; tasarımda 390 px yok): yedi pencere TAM EKRAN, alt
// düğmeler yapışık (E-13-12 kalıbı). Görünüm üretim paketi duman ölçümüyle de doğrulanır; burada
// kural bildirimi ve token disiplini sabitlenir.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const raw = readFileSync(
  resolve(process.cwd(), 'src/modules/chat/components/dialogs/dialogs.css'),
  'utf8',
)
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
const narrow = css.slice(css.indexOf('@media (max-width: 900px)'))

describe('dialogs.css', () => {
  it('dar ekran: pencere tam ekran, dolgusuz perde, yarıçapsız; yalnız .chat-dlg gövdeli pencereler', () => {
    expect(css).toContain('@media (max-width: 900px)')
    expect(narrow).toMatch(/\.t-modal-backdrop:has\(\.chat-dlg\) \{\s*padding: 0;/)
    expect(narrow).toMatch(
      /\.t-modal:has\(\.chat-dlg\) \{[^}]*height: 100%;[^}]*max-width: none;[^}]*border-radius: 0;/,
    )
  })

  it('gövde kayar, alt şerit yerinde kalır (yapışık düğmeler)', () => {
    expect(narrow).toMatch(
      /\.t-modal:has\(\.chat-dlg\) \.t-modal__body \{[^}]*flex: 1 1 auto;[^}]*overflow-y: auto;/,
    )
    expect(narrow).toMatch(/\.t-modal:has\(\.chat-dlg\) \{[^}]*overflow: hidden;/)
  })

  it('yalnız token: ham renk ve ham px yok (medya koşulu hariç)', () => {
    const outside = css.replace(/@media[^{]*\{/g, '@media {')
    expect(outside).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(outside).not.toMatch(/\brgba?\(|\bhsla?\(/)
    expect(outside).not.toMatch(/\d(?:\.\d+)?px\b/)
  })

  it("odak halkası token'dan", () => {
    expect(css).toContain('var(--focus-ring)')
  })
})
