import type { PreferenceValues } from '@/shared/preferences'

/**
 * Kapsam merceği (K2): kullanıcının seçili programa hangi gözle baktığı. Sunucu rolü DEĞİLDİR
 * ve yetki vermez (ortak-kurallar §1); yalnız kapsam başlıklarını ve sorgu anahtarlarını
 * değiştirir. Admin → departmansız program kapsamı; Koordinatör/Üye → program + departman.
 */
export type ScopeLens = PreferenceValues['scope.lens']

/** Aktif kapsam (HTTP katmanının istek anında okuduğu değer). Örtük varsayılan yoktur. */
export interface ScopeSnapshot {
  programId: string | null
  departmentId: string | null
  /** İstemci merceği; HTTP başlığına yansımaz, yalnız sorgu anahtarını ayırır. */
  lens?: ScopeLens | null
}

/** `scopedKey` anahtarlarının ilk öğesi; kapsam değişiminde temizlik bu önekle seçer. */
export const QUERY_KEY_ROOT = 'nizamio'

/**
 * TanStack Query anahtar fabrikası: her anahtar kapsamla başlar, böylece program/departman/
 * mercek değişince önbellek girdileri karışmaz (F06 kapsam 6). Kapsamdan bağımsız (S0/S1)
 * veriler için `globalKey` kullanılır.
 */
export function scopedKey(
  scope: ScopeSnapshot,
  ...parts: ReadonlyArray<string | number | Record<string, unknown>>
): readonly unknown[] {
  return [
    QUERY_KEY_ROOT,
    {
      program: scope.programId ?? null,
      department: scope.departmentId ?? null,
      ...(scope.lens ? { lens: scope.lens } : {}),
    },
    ...parts,
  ] as const
}

export function globalKey(
  ...parts: ReadonlyArray<string | number | Record<string, unknown>>
): readonly unknown[] {
  return [QUERY_KEY_ROOT, 'global', ...parts] as const
}

/**
 * Anahtar `scopedKey(...)` ile mi üretildi (kapsam değişiminde iptal + önbellekten düşer)?
 * Tek tanım sorgu anahtarı fabrikasındadır (`shared/http/query-keys.ts`); burada yalnız
 * kapsam katmanının (lifecycle) mevcut içe aktarımı için yeniden dışa aktarılır.
 */
export { isScopedQueryKey } from '@/shared/http/query-keys'
