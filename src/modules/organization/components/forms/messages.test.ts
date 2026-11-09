// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { kindLabel, orgText, roleLabel, trOrgForms } from './messages'

describe('orgForms metinleri', () => {
  it('statik ağaçtan çözülür; parametre yerleşir; bilinmeyen anahtar anahtarı döner', () => {
    expect(orgText('orgForms.user.title')).toBe(trOrgForms.orgForms.user.title)
    expect(orgText('orgForms.password.doneRevoked', { count: 3 })).toBe(
      'Geçici parola belirlendi; 3 oturum kapatıldı.',
    )
    expect(kindLabel('calisma_grubu')).toBe('Çalışma grubu')
    expect(roleLabel('coordinator')).toBe('Koordinatör')
  })

  it('her yaprak dolu ve vue-i18n özel karakteri yalnız {param} biçiminde', () => {
    const walk = (node: object): string[] =>
      Object.values(node).flatMap((v) => (typeof v === 'string' ? [v] : walk(v as object)))
    const leaves = walk(trOrgForms)
    expect(leaves.length).toBeGreaterThan(50)
    for (const text of leaves) {
      expect(text.trim()).not.toBe('')
      expect(text.replace(/\{\w+\}/g, '')).not.toMatch(/[{}@$|]/)
    }
  })
})
