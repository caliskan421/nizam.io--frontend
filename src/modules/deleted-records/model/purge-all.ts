/**
 * Çöpü boşalt mantığı (BE-115; ADR-0045): onay değeri eşlemesi, parça döngüsünün durma kuralı ve
 * sonuç özeti. Saf fonksiyonlar. Sunucu çağrı başına en çok 50 kayıt işler; istemci
 * `remaining > 0` ve `succeeded` boş değilken yeniden çağırır, hiç başarı olmayan çağrıdan sonra
 * durur (kalıcı başarısız kalanlar sonsuz döngü üretmesin) ve kalanları `failed` kodlarıyla
 * gösterir. Koordinatörlük `scope=program` ile açıkça boşaltılır (W192 `usePurgeAllDepartments`).
 */
import { VIEW_KINDS, type DeletedKind } from './kinds'
import { LIFECYCLE, type LifecycleKind } from './lifecycle'
import { deletedText } from './messages'
import { batchFailureText } from './outcome'
import type { BatchRun, BatchSummary } from './batch'
import type { DeletedBatchResult } from './types'

/** Onay değeri = türün yol adı (`confirm`; aksi 422). Eşleme testle sabitlenir. */
export const PURGE_ALL_CONFIRM: Readonly<Record<LifecycleKind, string>> = Object.fromEntries(
  (Object.keys(LIFECYCLE) as LifecycleKind[]).map((kind) => [kind, LIFECYCLE[kind].path]),
) as Record<LifecycleKind, string>

/**
 * Görünümün boşaltılacak türleri (sırayla). Tek türlü görünüm kendi türünü, `Not ve gündem` üç not
 * türünü boşaltır; `Tümü` boşaltılamaz (`null`): bir tür seçilir. Görünüm politikasıdır, sözleşme
 * eksiği değil.
 */
export function purgeKindsOf(view: DeletedKind): readonly LifecycleKind[] | null {
  return view === 'tumu' ? null : VIEW_KINDS[view]
}

export function supportsPurgeAll(view: DeletedKind): boolean {
  return purgeKindsOf(view) !== null
}

/** Çağrı başına sunucu tavanı (ADR-0045). */
export const PURGE_ALL_CHUNK = 50

const fold = (text: string) => text.trim().toLocaleLowerCase('tr-TR')

/** Kullanıcının yazdığı onay metni tür adıyla eşleşiyor mu (Türkçe katlamalı, kırpılmış). */
export function typedMatches(typed: string, kind: DeletedKind): boolean {
  return fold(typed) === fold(deletedText(`kindNames.${kind}`))
}

/** Bir çağrıdan sonra döngü sürer mi: `remaining > 0` ve en az bir kayıt işlendi. */
export function shouldContinue(result: DeletedBatchResult): boolean {
  return (result.remaining ?? 0) > 0 && result.succeeded.length > 0
}

/** Kalanları kodlarına göre gruplar: aynı gerekçeli kayıtlar tek satır ("3 kayıt"). */
export function summarizePurgeAll(
  run: BatchRun,
  remaining: number | null,
  state: 'done' | 'cancelled' | 'interrupted',
): BatchSummary {
  const groups = new Map<string, number>()
  for (const { code } of run.failed) groups.set(code, (groups.get(code) ?? 0) + 1)
  const failures = [...groups].map(([code, n]) => ({
    id: code,
    title: deletedText('purgeAll.group', { n }),
    reason: batchFailureText('purge', code),
  }))
  const n = run.succeeded.length
  if (state === 'cancelled') {
    return { message: deletedText('purgeAll.cancelled', { n }), tone: 'danger', failures }
  }
  if (state === 'interrupted') {
    return { message: deletedText('purgeAll.interrupted', { n }), tone: 'danger', failures }
  }
  const left = remaining ?? 0
  if (left === 0 && failures.length === 0) {
    return { message: deletedText('purgeAll.done', { n }), tone: 'success', failures }
  }
  return { message: deletedText('purgeAll.left', { n, left }), tone: 'danger', failures }
}
