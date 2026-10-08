/** Aktif kapsam (HTTP katmanının istek anında okuduğu değer). Örtük varsayılan yoktur. */
export interface ScopeSnapshot {
  programId: string | null
  departmentId: string | null
}

/**
 * TanStack Query anahtar fabrikası: her anahtar kapsamla başlar, böylece program/departman
 * değişince önbellek girdileri karışmaz (F06 kapsam 6). Kapsamdan bağımsız (S0/S1) veriler
 * için `globalKey` kullanılır.
 */
export function scopedKey(
  scope: ScopeSnapshot,
  ...parts: ReadonlyArray<string | number | Record<string, unknown>>
): readonly unknown[] {
  return [
    'nizamio',
    { program: scope.programId ?? null, department: scope.departmentId ?? null },
    ...parts,
  ] as const
}

export function globalKey(
  ...parts: ReadonlyArray<string | number | Record<string, unknown>>
): readonly unknown[] {
  return ['nizamio', 'global', ...parts] as const
}
