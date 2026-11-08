/**
 * Tarayıcı depolamasına dokunan TEK dosya (yol haritası K2; eslint istisnası yalnız bu dosya,
 * yalnız `localStorage`; `sessionStorage` burada da yasak — tests/lint/architecture.test.ts).
 *
 * Değişmezler:
 *  - Yalnız `PREFERENCE_KEYS` içindeki anahtarlar yazılır/okunur; başka anahtar programlama
 *    hatasıdır ve fırlatır. Belirteç asla bu yoldan geçmez (CLAUDE.md).
 *  - Değer boyu sınırlıdır (kimlik/tema için yeter; büyük yük taşınamaz).
 *  - Depolama erişilemezse (gizli pencere, SecurityError, kota) sessizce bellekte sürer.
 */
import { isPreferenceKey, type PreferenceKey } from './keys'

export const STORAGE_PREFIX = 'nizamio.pref.'
export const MAX_VALUE_LENGTH = 256

/** Depolamanın kullandığımız asgari yüzü (Web Storage alt kümesi). */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface PreferenceStorage {
  get(key: PreferenceKey): string | null
  set(key: PreferenceKey, value: string): void
  remove(key: PreferenceKey): void
  /** Kalıcı depo kullanılıyor mu (false → yalnız bellek). */
  readonly persistent: boolean
}

function browserStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Erişim kendisi fırlatabilir (çerezler engelli, sandbox iframe).
    return null
  }
}

function assertKey(key: string): asserts key is PreferenceKey {
  if (!isPreferenceKey(key)) throw new Error(`preferences: izinli olmayan anahtar "${key}"`)
}

export function createStorageAdapter(
  resolve: () => StorageLike | null = browserStorage,
): PreferenceStorage {
  const memory = new Map<PreferenceKey, string>()
  let backing: StorageLike | null = null
  try {
    backing = resolve()
  } catch {
    backing = null
  }

  /** İlk depolama hatasında kalıcı depo bırakılır; bellek kopyası sürer. */
  function attempt<T>(fn: (s: StorageLike) => T): T | undefined {
    if (!backing) return undefined
    try {
      return fn(backing)
    } catch {
      backing = null
      return undefined
    }
  }

  return {
    get persistent() {
      return backing !== null
    },
    get(key) {
      assertKey(key)
      const stored = attempt((s) => s.getItem(STORAGE_PREFIX + key))
      if (stored === undefined) return memory.get(key) ?? null
      if (stored === null || stored.length > MAX_VALUE_LENGTH) return null
      return stored
    },
    set(key, value) {
      assertKey(key)
      if (value.length > MAX_VALUE_LENGTH) throw new Error('preferences: değer çok uzun')
      memory.set(key, value)
      attempt((s) => s.setItem(STORAGE_PREFIX + key, value))
    },
    remove(key) {
      assertKey(key)
      memory.delete(key)
      attempt((s) => s.removeItem(STORAGE_PREFIX + key))
    },
  }
}
