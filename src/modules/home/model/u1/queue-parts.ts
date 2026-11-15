/**
 * Ü1 kuyruk satırının satır alanı parçaları (E-Ü1-11; BE-137): "‹n› dosya" (`file_count > 0`) ve
 * onaydaki satırda "‹GG.AA›’da gönderildi" (`submitted_at`; null → gizli). Görev başına dosya
 * listesi okunmaz; alan satırdadır. Alan yoksa parça `null` (uydurma yok).
 */
import { homeText } from '../messages'
import { dayText } from '../role/ago'
import type { WorkRow } from '../role/common'

export interface QueueParts {
  files: string | null
  sent: string | null
}

export function queueParts(item: WorkRow, timeZone: string): QueueParts {
  const day =
    item.status === 'onaya_sunuldu' && item.submitted_at !== null
      ? dayText(item.submitted_at, timeZone)
      : null
  return {
    files: item.file_count > 0 ? homeText('home.u1.queue.files', { n: item.file_count }) : null,
    sent: day ? homeText('home.u1.queue.sentOn', { day }) : null,
  }
}
