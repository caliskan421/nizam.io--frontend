/**
 * K1/Ü1 gezinme hedefleri. 03 görev paneli `/gorevler?gorev=<id>` ile açılır (E-03-55 görev
 * bağlantısı); 09 toplantı yolları meetings modülünün rota sabitlerindendir (`MEETINGS_ROUTE`,
 * yol ile gider: rota kaydı olmayan yönlendiricide ad çözümleme hatası vermez; W142: yerel yol
 * sabiti kaldırıldı).
 */
import { MEETINGS_ROUTE } from '@/modules/meetings/public'
import { TASKS_ROUTE } from '@/modules/work/public'

export const MEETINGS_PATH: string = MEETINGS_ROUTE.path

export function taskLocation(workItemId: string) {
  return { name: TASKS_ROUTE.name, query: { gorev: workItemId } }
}

/** 03'ü durum süzgeciyle açar (`durum` katalog değerleri). */
export function tasksLocation(status?: string) {
  return { name: TASKS_ROUTE.name, query: status ? { durum: status } : {} }
}

export function meetingLocation(meetingId: string) {
  return { path: `${MEETINGS_PATH}/${meetingId}` }
}

export function meetingsLocation() {
  return { path: MEETINGS_PATH }
}
