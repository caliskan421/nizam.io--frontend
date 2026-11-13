/**
 * K1/Ü1 gezinme hedefleri. 03 görev paneli `/gorevler?gorev=<id>` ile açılır (E-03-55 görev
 * bağlantısı); 09 toplantı yolları rota kataloğuyla aynıdır (`collaboration.meetings`,
 * `collaboration.meeting`; modül `public.ts`'i yol sabiti dışa açmaz → yol ile, rota kaydı
 * olmayan yönlendiricide ad çözümleme hatası vermez).
 */
import { TASKS_ROUTE } from '@/modules/work/public'

export const MEETINGS_PATH = '/toplantilar'

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
