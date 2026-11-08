import { describe, expect, it } from 'vitest'

import { type DesignStubId, designStub, isDesignStubId } from './index'

describe('designStub', () => {
  it('değeri aynen döndürür (referans korunur)', () => {
    const value = { initials: 'AB' }
    expect(designStub('BE-001', value)).toBe(value)
    expect(designStub('BE-003', null)).toBeNull()
  })

  it('biçimsiz kimlik geliştirmede hatadır', () => {
    // Doğrudan çağrı lint'te reddedilir (kimlik BE-NNN literali olmalı); çalışma anı denetimi
    // ayrıca sınanır.
    const call = (id: string) => Reflect.apply(designStub, undefined, [id as DesignStubId, 1])
    expect(() => call('BE-1')).toThrow(/BE-NNN/)
    expect(() => call('BE-0001')).toThrow(/BE-NNN/)
  })

  it.each([
    ['BE-001', true],
    ['BE-106', true],
    ['BE-1', false],
    ['be-001', false],
    ['BE-001 ', false],
    ['GAP-001', false],
  ])('isDesignStubId(%s) = %s', (id, expected) => {
    expect(isDesignStubId(id)).toBe(expected)
  })
})
