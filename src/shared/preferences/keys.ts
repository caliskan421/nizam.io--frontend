/**
 * Kalıcı tercihlerin İZİNLİ anahtar listesi (yol haritası K2; tek depolama istisnası).
 *
 * Yalnız kapsam KİMLİKLERİ ve tema hatırlanır. Belirteç, kullanıcı verisi, sunucu yanıtı
 * ASLA buraya girmez. `sidebar_collapsed` bilinçli olarak yoktur (ortak-kurallar §12 P10:
 * daraltma yalnız oturum belleği; sentez Y9 düştü). Liste genişletmesi ürün kararı ister.
 */
export const PREFERENCE_KEYS = [
  'scope.programId',
  'scope.lens',
  'scope.departmentId',
  'ui.theme',
] as const

export type PreferenceKey = (typeof PREFERENCE_KEYS)[number]

/** Kapsam merceği değerleri (K2; sunucu rolü değildir). */
export const LENS_VALUES = ['admin', 'coordinator', 'member'] as const
export const THEME_VALUES = ['dark', 'light'] as const

export interface PreferenceValues {
  'scope.programId': string
  'scope.lens': (typeof LENS_VALUES)[number]
  'scope.departmentId': string
  'ui.theme': (typeof THEME_VALUES)[number]
}

/** Kapsam anahtarları: çıkışta silinir (E-00-29), `ui.theme` kalır. */
export const SCOPE_PREFERENCE_KEYS = [
  'scope.programId',
  'scope.lens',
  'scope.departmentId',
] as const satisfies readonly PreferenceKey[]

/** Kimlik değeri: kısa, boşluksuz, URL güvenli karakterler (UUID ve benzerleri). */
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/

function oneOf<T extends string>(values: readonly T[]) {
  return (raw: string): T | null =>
    (values as readonly string[]).includes(raw) ? (raw as T) : null
}

function id(raw: string): string | null {
  return ID_PATTERN.test(raw) ? raw : null
}

/** Her anahtarın okuma doğrulayıcısı: geçersiz değer `null` (ve depodan düşer). */
export const PREFERENCE_PARSERS: {
  [K in PreferenceKey]: (raw: string) => PreferenceValues[K] | null
} = {
  'scope.programId': id,
  'scope.lens': oneOf(LENS_VALUES),
  'scope.departmentId': id,
  'ui.theme': oneOf(THEME_VALUES),
}

export function isPreferenceKey(key: string): key is PreferenceKey {
  return (PREFERENCE_KEYS as readonly string[]).includes(key)
}
