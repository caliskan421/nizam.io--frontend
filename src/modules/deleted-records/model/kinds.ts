/**
 * Silinen kayıt GÖRÜNÜMLERİ (12; P36, P41; v0.26 W193). Sekme (URL `tur`) bir görünümdür; satırın
 * yazma türü değildir: yazma türü her zaman satırın `LifecycleKind`'ıdır (`model/lifecycle.ts`).
 * `tumu` ve `notgundem` birkaç türün birleşik listesidir (`listDeletedRecords`) ve hiçbir yazma
 * hedefi olamaz. Tek türlü görünümler kendi tipli listesinden okur (zengin alan). Eski URL değerleri
 * (`gorev`, `toplanti`, `koordinatorluk`, `kullanici`) ve varsayılan Görev değişmez.
 */
import type { LifecycleKind } from './lifecycle'

/** Segment sırası (tasarım 01d; Koordinatörlük P41 uyarınca Toplantı'dan sonra). */
export const DELETED_KINDS = [
  'tumu',
  'gorev',
  'altgorev',
  'dosya',
  'toplanti',
  'koordinatorluk',
  'kullanici',
  'notgundem',
] as const
export type DeletedKind = (typeof DELETED_KINDS)[number]
export const DEFAULT_KIND: DeletedKind = 'gorev'

/** Görünümün kapsadığı yazma türleri; `tumu` dokuzunu da kapsar. */
export const VIEW_KINDS: Readonly<Record<DeletedKind, readonly LifecycleKind[]>> = {
  tumu: [
    'tasks',
    'subtasks',
    'files',
    'meetings',
    'task_notes',
    'meeting_notes',
    'agenda_items',
    'departments',
    'accounts',
  ],
  gorev: ['tasks'],
  altgorev: ['subtasks'],
  dosya: ['files'],
  toplanti: ['meetings'],
  koordinatorluk: ['departments'],
  kullanici: ['accounts'],
  notgundem: ['task_notes', 'meeting_notes', 'agenda_items'],
}

/** Birleşik liste (`listDeletedRecords`) mi, tek türün tipli listesi mi okunur. */
export function isUnifiedView(view: DeletedKind): boolean {
  return view === 'tumu' || view === 'notgundem'
}

/** Tek türlü görünümün yazma türü; birleşik görünümde `null` (yazma hedefi olamaz). */
export function singleKindOf(view: DeletedKind): LifecycleKind | null {
  return isUnifiedView(view) ? null : (VIEW_KINDS[view][0] ?? null)
}

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

/** Kayıtsız / bilinmeyen değer → varsayılan görünüm (Görev). */
export function parseKind(value: unknown): DeletedKind {
  return isDeletedKind(value) ? value : DEFAULT_KIND
}

/**
 * Koordinatörlük süzgeci (`department_id`): görevde departman, toplantıda sahip/bağlı departman,
 * hesapta "herhangi bir programdaki ekip satırı" (BE-117/118, matris M-D07). Koordinatörlük
 * türünde sunucu `department_id`'yi yok sayar: süzgeç sunulmaz. Birleşik görünümlerde sunucu
 * türe uygulanmayan süzgeci o türde yok sayar (satırlar korunur).
 */
export function supportsDepartmentFilter(kind: DeletedKind): boolean {
  return kind !== 'koordinatorluk'
}

/** Özet (`DeletedSummary`) alanı ↔ görünüm: segment sayaçları (E-12-08, BE-110). */
export const SUMMARY_FIELD: Readonly<
  Record<
    DeletedKind,
    'total' | 'tasks' | 'subtasks' | 'files' | 'meetings' | 'departments' | 'accounts' | 'notes'
  >
> = {
  tumu: 'total',
  gorev: 'tasks',
  altgorev: 'subtasks',
  dosya: 'files',
  toplanti: 'meetings',
  koordinatorluk: 'departments',
  kullanici: 'accounts',
  notgundem: 'notes',
}
