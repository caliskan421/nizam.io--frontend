/**
 * Silinen kayıt türleri (12; P36, P41, P42). Canlı dört tür her biri ayrı imleçli uçtur ve
 * birleştirilmez (fan-out yasağı, K3); "Tümü" yoktur (P42). Segment sırası: Görev (varsayılan) ·
 * Toplantı · Koordinatörlük · Kullanıcı canlı; Alt görev · Dosya · Not ve gündem devre dışı
 * (uç yok; BE-109, BE-076, BE-111 — rapor-F5 "karar bekler", P45). Devre dışı türler URL değeri
 * olarak TANINMAZ.
 */
export const DELETED_KINDS = ['gorev', 'toplanti', 'koordinatorluk', 'kullanici'] as const
export type DeletedKind = (typeof DELETED_KINDS)[number]
export const DEFAULT_KIND: DeletedKind = 'gorev'

/** Devre dışı (statik) türler; segmentte sayısız ve tıklanamaz. */
export const DISABLED_KINDS = ['altgorev', 'dosya', 'notgundem'] as const
export type DisabledKind = (typeof DISABLED_KINDS)[number]

/** Silinme tarihi aralığı (P43): istemci süzgeci. */
export const DELETED_RANGES = ['bugun', '7gun', 'tumu'] as const
export type DeletedRange = (typeof DELETED_RANGES)[number]
export const DEFAULT_RANGE: DeletedRange = 'tumu'

export function isDeletedKind(value: unknown): value is DeletedKind {
  return typeof value === 'string' && (DELETED_KINDS as readonly string[]).includes(value)
}

export function isDeletedRange(value: unknown): value is DeletedRange {
  return typeof value === 'string' && (DELETED_RANGES as readonly string[]).includes(value)
}

/** Kayıtsız / devre dışı değer → varsayılan sekme. */
export function parseKind(value: unknown): DeletedKind {
  return isDeletedKind(value) ? value : DEFAULT_KIND
}

/** Koordinatörlük süzgeci yalnız görev ve toplantıda anlamlıdır (E-12-19). */
export function supportsDepartmentFilter(kind: DeletedKind): boolean {
  return kind === 'gorev' || kind === 'toplanti'
}

/** Silen süzgeci yalnız toplantıda canlıdır (`deleted_by`; E-12-18, BE-108). */
export function supportsActorFilter(kind: DeletedKind): boolean {
  return kind === 'toplanti'
}

/** Tarih aralığı hesapta devre dışıdır (`deleted_at` alanı yok; E-12-17, BE-118). */
export function supportsRange(kind: DeletedKind): boolean {
  return kind !== 'kullanici'
}
