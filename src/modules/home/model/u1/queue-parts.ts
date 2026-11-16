/**
 * Ü1 kuyruk satırının satır alanı parçaları (E-Ü1-11; BE-137): "‹n› dosya" (`file_count > 0`) ve
 * onaydaki satırda "‹GG.AA›’da gönderildi" (`submitted_at`; null → gizli). Görev başına dosya
 * listesi okunmaz; alan satırdadır. Alan yoksa parça `null` (uydurma yok).
 */
import { homeText } from '../messages'
import { dayText } from '../role/ago'
import type { WorkRow } from '../role/common'
import { lockText } from '../role/lock'
import { shownReason } from '../role/return-reason'

export interface QueueParts {
  files: string | null
  sent: string | null
  /** "‹n› görev bekleniyor" (BE-138; ad/kod alanda yok → yalnız sayı). */
  lock: string | null
  /** "iade: ‹gerekçe›" (BE-139; yalnız iade satırında, gerekçe doluysa). */
  returned: string | null
}

function returnedText(item: WorkRow): string | null {
  const reason = item.status === 'iade_edildi' ? shownReason(item) : null
  return reason ? homeText('home.u1.queue.returnedReason', { reason }) : null
}

export function queueParts(item: WorkRow, timeZone: string): QueueParts {
  const day =
    item.status === 'onaya_sunuldu' && item.submitted_at !== null
      ? dayText(item.submitted_at, timeZone)
      : null
  return {
    files: item.file_count > 0 ? homeText('home.u1.queue.files', { n: item.file_count }) : null,
    sent: day ? homeText('home.u1.queue.sentOn', { day }) : null,
    lock: lockText(item),
    returned: returnedText(item),
  }
}
