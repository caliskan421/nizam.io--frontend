import { describe, expect, it } from 'vitest'

import { createPreferences, PREFERENCE_KEYS, SCOPE_PREFERENCE_KEYS } from './index'
import { createStorageAdapter, STORAGE_PREFIX, type StorageLike } from './storage-adapter'

function setup() {
  const data = new Map<string, string>()
  const storage: StorageLike = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
  return { data, prefs: createPreferences(createStorageAdapter(() => storage)) }
}

describe('preferences', () => {
  it('izinli anahtar listesi K2 + tema; sidebar_collapsed yok (P10)', () => {
    expect([...PREFERENCE_KEYS]).toEqual([
      'scope.programId',
      'scope.lens',
      'scope.departmentId',
      'ui.theme',
    ])
    expect(PREFERENCE_KEYS.some((k) => /sidebar|token/i.test(k))).toBe(false)
  })

  it('tip güvenli yaz/oku; null yazmak siler', () => {
    const { prefs, data } = setup()
    prefs.write('scope.lens', 'coordinator')
    prefs.write('ui.theme', 'light')
    expect(prefs.read('scope.lens')).toBe('coordinator')
    expect(prefs.read('ui.theme')).toBe('light')
    prefs.write('scope.lens', null)
    expect(prefs.read('scope.lens')).toBeNull()
    expect(data.has(`${STORAGE_PREFIX}scope.lens`)).toBe(false)
  })

  it('geçersiz değer yazılamaz', () => {
    const { prefs } = setup()
    // @ts-expect-error — tip sistemi de reddeder; çalışma anı denetimi ayrıca vardır.
    expect(() => prefs.write('ui.theme', 'system')).toThrow()
    expect(() => prefs.write('scope.programId', 'boşluklu kimlik')).toThrow()
  })

  it('depodaki bozuk değer okunurken düşer', () => {
    const { prefs, data } = setup()
    data.set(`${STORAGE_PREFIX}scope.lens`, 'superuser')
    data.set(`${STORAGE_PREFIX}scope.programId`, '<script>')
    expect(prefs.read('scope.lens')).toBeNull()
    expect(prefs.read('scope.programId')).toBeNull()
    expect(data.size).toBe(0)
  })

  it('clearScope kapsam kimliklerini siler, temayı korur', () => {
    const { prefs } = setup()
    prefs.write('scope.programId', 'prg-1')
    prefs.write('scope.lens', 'member')
    prefs.write('scope.departmentId', 'dep-1')
    prefs.write('ui.theme', 'light')
    prefs.clearScope()
    for (const key of SCOPE_PREFERENCE_KEYS) expect(prefs.read(key)).toBeNull()
    expect(prefs.read('ui.theme')).toBe('light')
    prefs.clearAll()
    expect(prefs.read('ui.theme')).toBeNull()
  })
})
