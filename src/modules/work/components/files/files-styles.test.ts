// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Dosyalar sekmesi kanıt satırı (O5 görsel kusur, W63): etiket, "gerekli" ve "Arşivde aç"
// kırılmaz; yalnız dosya adı kısalır.
const css = readFileSync(fileURLToPath(new URL('./files.css', import.meta.url)), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)
const rule = (selector: string) =>
  new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css)?.[1] ??
  ''

describe('dosyalar sekmesi kanıt satırı', () => {
  it('etiket / gerekli / Arşivde aç kırılmaz ve küçülmez; ad kısalır', () => {
    for (const selector of ['.wf-evidence dt', '.wf-req', '.wf-linkbtn']) {
      expect(rule(selector), selector).toMatch(/flex: none/)
      expect(rule(selector), selector).toMatch(/white-space: nowrap/)
    }
    expect(rule('.wf-evidence dd')).toMatch(/min-width: 0/)
    expect(rule('.wf-evidence dd > .rp-trunc')).toMatch(/min-width: 0/)
  })
})
