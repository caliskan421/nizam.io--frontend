/**
 * Durum geçişi matrisi (istemci-akislari §5; work README WORK-K11; `work/domain/transition.go`).
 * İstemci yalnız tablodaki hedefleri gösterir (E-03-58); matris dışı hedef sunucuda 409
 * `work.transition_not_allowed` alır. Aktör görevden hesaplanır: koordinatör ve göreve
 * atanmışsa **kendi görevi**, atanmamış koordinatörse **koordinatör**, yalnız atanmış üyeyse
 * **üye**. Şirket yöneticiliği tek başına aktör değildir (P1: mercek de değildir).
 */
import type { WorkActorFacts } from './capabilities'
import type { WorkItemStatus } from './types'

export type TransitionActor = 'member' | 'coordinator' | 'own'

/** Gerekçe zorunlu geri alma (`tamamlandi → devam_ediyor`, `reason` ≥ 3 bayt). */
export const REVERT_REASON_MIN_BYTES = 3

type Matrix = Readonly<Record<WorkItemStatus, readonly WorkItemStatus[]>>

/** §5 tablosu birebir (satır = aktör, sütun = mevcut durum, hücre = hedefler). */
export const TRANSITION_MATRIX: Readonly<Record<TransitionActor, Matrix>> = {
  member: {
    baslanmadi: ['devam_ediyor'],
    devam_ediyor: ['onaya_sunuldu'],
    onaya_sunuldu: [],
    iade_edildi: ['devam_ediyor'],
    tamamlandi: [],
  },
  coordinator: {
    baslanmadi: ['devam_ediyor', 'tamamlandi'],
    devam_ediyor: ['baslanmadi', 'tamamlandi'],
    onaya_sunuldu: ['tamamlandi', 'iade_edildi'],
    iade_edildi: ['baslanmadi', 'devam_ediyor', 'tamamlandi'],
    tamamlandi: ['devam_ediyor'],
  },
  own: {
    baslanmadi: ['devam_ediyor', 'tamamlandi'],
    devam_ediyor: ['baslanmadi', 'onaya_sunuldu', 'tamamlandi'],
    onaya_sunuldu: ['tamamlandi', 'iade_edildi'],
    iade_edildi: ['baslanmadi', 'devam_ediyor', 'tamamlandi'],
    tamamlandi: ['devam_ediyor'],
  },
}

/** Görev için aktör; aktör değilse `null` (durum yalnız salt okunur etiket, E-03-44). */
export function transitionActor(f: WorkActorFacts): TransitionActor | null {
  if (f.coordinator) return f.assigned ? 'own' : 'coordinator'
  if (f.member && f.assigned) return 'member'
  return null
}

/** Mevcut durumdan aktörün seçebileceği hedefler (sözleşme sırası korunur). */
export function transitionTargets(f: WorkActorFacts, from: WorkItemStatus): WorkItemStatus[] {
  const actor = transitionActor(f)
  return actor ? [...TRANSITION_MATRIX[actor][from]] : []
}

/** Geçiş gerekçe ister mi (geri alma). */
export function requiresReason(from: WorkItemStatus, to: WorkItemStatus): boolean {
  return from === 'tamamlandi' && to === 'devam_ediyor'
}

/** Gerekçe geçerli mi (UTF-8 bayt sayısı, kırpılmış). */
export function isValidReason(reason: string): boolean {
  return new TextEncoder().encode(reason.trim()).length >= REVERT_REASON_MIN_BYTES
}

/** `close_subtasks` yalnız `to = tamamlandi` hedefinde geçerlidir (§7). */
export function canCloseSubtasks(to: WorkItemStatus): boolean {
  return to === 'tamamlandi'
}
