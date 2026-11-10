// W97a · zaman çizelgesi entegrasyon yardımcıları: kişi/kapsam sabitleri, satır ve panel
// seçicileri. Hepsi GERÇEK uygulama kökü üstünde (taslak bileşen yok).
import { PEOPLE, $, $$, click, until } from './harness'

export const ADMIN_ADMIN = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'admin' as const },
}
/** Yönetici, Koordinatör merceğinde (aynı zamanda Mekanik koordinatörü; yetki mercekten bağımsız). */
export const ADMIN_COORD = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
}
export const COORD = {
  email: PEOPLE.coord.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
}
export const MEMBER = {
  email: PEOPLE.member.email,
  scope: { programId: 'p1', lens: 'member' as const, departmentId: 'd1' },
}

export const GANTT_ADMIN = '/v1/work-items/gantt/admin'
export const GANTT_COORD = '/v1/work-items/gantt'
export const GANTT_MINE = '/v1/work-items/gantt/mine'
export const REQUESTS = '/v1/date-change-requests'

export const ganttRows = () =>
  $$('.gantt-rows [role="row"][data-row-key]').map((r) => r.dataset.rowKey)
/** Yalnız görev satırları (grup başlıkları `g:` önekli). */
export const taskRows = () => ganttRows().filter((k) => !k?.startsWith('g:'))
export const rowEl = (key: string) => $(`.gantt-rows [role="row"][data-row-key="${key}"]`)
export const panel = () => $('[data-testid="timeline-panel"]')
export const tp = (id: string, root: ParentNode = document.body) => $(`[data-testid="${id}"]`, root)

/** Sayfa yüklendi: Gantt satırları çizili. */
export async function ganttReady(min = 3): Promise<void> {
  await until(() => $('[data-testid="timeline-page"]'), 'zaman çizelgesi sayfası')
  await until(() => ganttRows().length >= min, 'Gantt satırları')
}

/** Satırı tıklayıp paneli açar ve taze görev gelene dek bekler (kaydet/talep düğmeleri görünür). */
export async function selectRow(key: string): Promise<HTMLElement> {
  await click(() => rowEl(key))
  return until(() => panel(), 'seçili görev paneli')
}

export const dialog = () => $('[role="dialog"]')
