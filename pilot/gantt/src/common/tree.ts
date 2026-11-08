/**
 * Kütüphane adayları için ortak ağaç düzlemi: koordinatörlük grubu (özet satır) → görev →
 * statik alt görev satırı (ADR-0024/BE-020: Gantt yanıtında alt görev yok; satır yalnız
 * açılma yeteneğini kanıtlar, veri taşımaz — tarihi ana görevden alır ve "statik" etiketlidir).
 */
import { DEPARTMENTS, DAY, parseDay, plannedEnd, type Gantt, type GanttTask } from './mock'

export interface TreeNode {
  id: string
  parent: string | null
  kind: 'group' | 'task' | 'sub'
  text: string
  start: Date
  /** Hariç bitiş (gün sonu). */
  end: Date
  status: string
  task?: GanttTask
}

export const STATUS_LABEL: Record<string, string> = {
  baslanmadi: 'Başlamadı',
  devam_ediyor: 'Devam ediyor',
  onaya_sunuldu: 'Onay bekliyor',
  iade_edildi: 'Geri gönderildi',
  tamamlandi: 'Tamamlandı',
}

export function buildTree(g: Gantt, withSubtasks = true): TreeNode[] {
  const out: TreeNode[] = []
  for (const d of DEPARTMENTS) {
    const tasks = g.tasks
      .filter((t) => t.department_id === d.id)
      .sort((a, b) => a.start_on.localeCompare(b.start_on))
    if (!tasks.length) continue
    const start = parseDay(tasks[0]!.start_on)
    const end = new Date(Math.max(...tasks.map((t) => parseDay(t.end_on).getTime())) + DAY)
    out.push({
      id: `g:${d.id}`,
      parent: null,
      kind: 'group',
      text: d.name,
      start,
      end,
      status: 'group',
    })
    for (const t of tasks) {
      const s = parseDay(t.start_on)
      const e = new Date(parseDay(plannedEnd(t)).getTime() + DAY)
      out.push({
        id: t.work_item_id,
        parent: `g:${d.id}`,
        kind: 'task',
        text: t.title,
        start: s,
        end: e,
        status: t.status,
        task: t,
      })
      if (withSubtasks) {
        for (const i of [1, 2]) {
          out.push({
            id: `${t.work_item_id}:s${i}`,
            parent: t.work_item_id,
            kind: 'sub',
            text: 'alt görev satırı · statik (BE-020)',
            start: s,
            end: new Date(s.getTime() + DAY),
            status: 'sub',
          })
        }
      }
    }
  }
  return out
}
