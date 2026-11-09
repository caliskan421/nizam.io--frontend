// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { kindLabel, orgText, roleLabel, trOrganization } from './messages'

const forms = trOrganization.organization.forms

describe('organization.forms metinleri', () => {
  it('uygulama i18n ağacından çözülür; parametre yerleşir', () => {
    expect(orgText('forms.user.title')).toBe(forms.user.title)
    expect(orgText('forms.password.doneRevoked', { count: 3 })).toBe(
      'Geçici parola belirlendi; 3 oturum kapatıldı.',
    )
    expect(kindLabel('calisma_grubu')).toBe('Çalışma grubu')
    expect(roleLabel('coordinator')).toBe('Koordinatör')
  })

  it('her yaprak dolu, kayıtlı ve vue-i18n özel karakteri yalnız {param} biçiminde', () => {
    const walk = (node: object, prefix: string): [string, string][] =>
      Object.entries(node).flatMap(([k, v]) =>
        typeof v === 'string'
          ? [[`${prefix}${k}`, v] as [string, string]]
          : walk(v as object, `${prefix}${k}.`),
      )
    const leaves = walk(forms, 'organization.forms.')
    expect(leaves.length).toBeGreaterThan(50)
    for (const [key, text] of leaves) {
      expect(text.trim()).not.toBe('')
      expect(text.replace(/\{\w+\}/g, '')).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })
})
