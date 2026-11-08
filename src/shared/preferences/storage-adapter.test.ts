import { describe, expect, it } from 'vitest'

import type { PreferenceKey } from './keys'
import {
  createStorageAdapter,
  MAX_VALUE_LENGTH,
  STORAGE_PREFIX,
  type StorageLike,
} from './storage-adapter'

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

function throwingStorage(): StorageLike {
  const fail = () => {
    throw new DOMException('kota', 'QuotaExceededError')
  }
  return { getItem: fail, setItem: fail, removeItem: fail }
}

describe('storage-adapter', () => {
  it('izinli anahtarı önekle yazar, okur, siler', () => {
    const storage = fakeStorage()
    const adapter = createStorageAdapter(() => storage)
    adapter.set('scope.programId', 'prg-1')
    expect(storage.data.get(`${STORAGE_PREFIX}scope.programId`)).toBe('prg-1')
    expect(adapter.get('scope.programId')).toBe('prg-1')
    adapter.remove('scope.programId')
    expect(adapter.get('scope.programId')).toBeNull()
    expect(storage.data.size).toBe(0)
    expect(adapter.persistent).toBe(true)
  })

  it.each(['token', 'auth.token', 'sidebar_collapsed', 'scope.programid', ''])(
    'izinli olmayan anahtar reddedilir: "%s"',
    (key) => {
      const storage = fakeStorage()
      const adapter = createStorageAdapter(() => storage)
      expect(() => adapter.set(key as PreferenceKey, 'x')).toThrow(/izinli olmayan/)
      expect(() => adapter.get(key as PreferenceKey)).toThrow(/izinli olmayan/)
      expect(storage.data.size).toBe(0)
    },
  )

  it('uzun değer yazılmaz; depoda bulunan uzun değer okunmaz', () => {
    const storage = fakeStorage()
    const adapter = createStorageAdapter(() => storage)
    expect(() => adapter.set('ui.theme', 'x'.repeat(MAX_VALUE_LENGTH + 1))).toThrow()
    storage.data.set(`${STORAGE_PREFIX}ui.theme`, 'x'.repeat(MAX_VALUE_LENGTH + 1))
    expect(adapter.get('ui.theme')).toBeNull()
  })

  it('depolama erişimi fırlatırsa sessizce bellekte sürer', () => {
    const adapter = createStorageAdapter(() => {
      throw new DOMException('engelli', 'SecurityError')
    })
    expect(adapter.persistent).toBe(false)
    adapter.set('ui.theme', 'light')
    expect(adapter.get('ui.theme')).toBe('light')
  })

  it('depolama yoksa (null) bellekte sürer', () => {
    const adapter = createStorageAdapter(() => null)
    adapter.set('scope.lens', 'admin')
    expect(adapter.get('scope.lens')).toBe('admin')
    adapter.remove('scope.lens')
    expect(adapter.get('scope.lens')).toBeNull()
  })

  it('yazma/okuma hatasında (kota) belleğe düşer, hata yükselmez', () => {
    const adapter = createStorageAdapter(throwingStorage)
    expect(() => adapter.set('scope.departmentId', 'dep-1')).not.toThrow()
    expect(adapter.persistent).toBe(false)
    expect(adapter.get('scope.departmentId')).toBe('dep-1')
  })
})
