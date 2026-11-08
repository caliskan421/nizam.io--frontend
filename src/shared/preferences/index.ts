import {
  PREFERENCE_KEYS,
  PREFERENCE_PARSERS,
  SCOPE_PREFERENCE_KEYS,
  type PreferenceKey,
  type PreferenceValues,
} from './keys'
import { createStorageAdapter, type PreferenceStorage } from './storage-adapter'

export {
  LENS_VALUES,
  PREFERENCE_KEYS,
  SCOPE_PREFERENCE_KEYS,
  THEME_VALUES,
  type PreferenceKey,
  type PreferenceValues,
} from './keys'
export type { PreferenceStorage, StorageLike } from './storage-adapter'

export interface Preferences {
  read<K extends PreferenceKey>(key: K): PreferenceValues[K] | null
  write<K extends PreferenceKey>(key: K, value: PreferenceValues[K] | null): void
  remove(key: PreferenceKey): void
  /** Çıkışta: kapsam kimlikleri silinir, tema kalır (E-00-29). */
  clearScope(): void
  clearAll(): void
}

/** Tip güvenli tercih yüzü; geçersiz kayıt okunurken düşürülür. */
export function createPreferences(storage: PreferenceStorage): Preferences {
  function remove(key: PreferenceKey): void {
    storage.remove(key)
  }
  return {
    read(key) {
      const raw = storage.get(key)
      if (raw === null) return null
      const value = PREFERENCE_PARSERS[key](raw)
      if (value === null) remove(key)
      return value
    },
    write(key, value) {
      if (value === null) {
        remove(key)
        return
      }
      if (PREFERENCE_PARSERS[key](value) === null) {
        throw new Error(`preferences: "${key}" için geçersiz değer`)
      }
      storage.set(key, value)
    },
    remove,
    clearScope() {
      for (const key of SCOPE_PREFERENCE_KEYS) remove(key)
    },
    clearAll() {
      for (const key of PREFERENCE_KEYS) remove(key)
    },
  }
}

/** Uygulamanın tek tercih nesnesi (tarayıcı depolaması; erişilemezse bellek). */
export const preferences: Preferences = createPreferences(createStorageAdapter())
