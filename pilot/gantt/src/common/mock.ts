/**
 * Pilot sahte verisi — gerçek `Gantt { tasks: GanttTask[], links: GanttLink[] }` şeması
 * (pin v0.11.0-api, `src/shared/api/schema.d.ts`). Yanıtta OLMAYAN alanlar (görev kodu,
 * departman adı, atanan adı, bekleyen talep, alt görev sayacı) burada da üretilmez.
 * Departman adı gerçek uygulamada ayrı departman listesinden gelir; pilot onu `DEPARTMENTS`
 * ile taklit eder. Tohumlu üreteç: her aday aynı 250 görev + 60 bağı görür.
 */
import type { components } from '../../../../src/shared/api/schema'

export type GanttTask = components['schemas']['GanttTask']
export type GanttLink = components['schemas']['GanttLink']
export type Gantt = components['schemas']['Gantt']

export const TASK_COUNT = 250
export const LINK_COUNT = 60
/** Backend Gantt uçlarının tavanı (GAP-053, BE-019). */
export const GANTT_CAP = 200

const PROGRAM_ID = '0b9a6c1e-0000-4000-8000-000000000001'

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function uuid(rand: () => number): string {
  const h = () => Math.floor(rand() * 16).toString(16)
  const s = (n: number) => Array.from({ length: n }, h).join('')
  return `${s(8)}-${s(4)}-4${s(3)}-8${s(3)}-${s(12)}`
}

export const DAY = 86_400_000

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseDay(s: string): Date {
  return new Date(`${s}T00:00:00Z`)
}

export function todayUtc(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
}

export const DEPARTMENTS: { id: string; name: string }[] = (() => {
  const rand = mulberry32(7)
  return ['Aviyonik', 'Yapı', 'İtki', 'Yazılım', 'Faydalı yük', 'Organizasyon'].map((name) => ({
    id: uuid(rand),
    name,
  }))
})()

const STATUSES = [
  'baslanmadi',
  'devam_ediyor',
  'onaya_sunuldu',
  'iade_edildi',
  'tamamlandi',
] as const

const TITLES = [
  'Uçuş bilgisayarı kart revizyonu',
  'Paraşüt açma testi',
  'Gövde kompozit serimi',
  'Motor statik ateşleme',
  'Telemetri protokolü',
  'Yer istasyonu arayüzü',
  'Faydalı yük entegrasyonu',
  'Kritik tasarım raporu',
  'Sponsor sunumu',
  'Atış alanı lojistiği',
]

function makeTask(rand: () => number, i: number, today: Date): GanttTask {
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]!
  const start = new Date(today.getTime() + Math.floor(rand() * 180 - 120) * DAY)
  const len = 3 + Math.floor(rand() * 55)
  const end = new Date(start.getTime() + len * DAY)
  let status: string = STATUSES[Math.floor(rand() * STATUSES.length)]!
  if (end < today && rand() < 0.6) status = 'tamamlandi'
  const lateness = {
    is_overdue: false,
    days_overdue: 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
  }
  let completed_on = ''
  if (status === 'tamamlandi') {
    const shift = Math.floor(rand() * 14) - 5
    const done = new Date(Math.min(end.getTime() + shift * DAY, today.getTime()))
    completed_on = isoDay(done)
    const diff = Math.round((done.getTime() - end.getTime()) / DAY)
    if (diff > 0) Object.assign(lateness, { is_completed_late: true, days_late: diff })
    if (diff < 0) Object.assign(lateness, { is_completed_early: true, days_early: -diff })
  } else if (end < today) {
    const days = Math.round((today.getTime() - end.getTime()) / DAY)
    Object.assign(lateness, { is_overdue: true, days_overdue: days })
  }
  // Uzatılmış görev: planlanan bitiş daha erken (backend "boşsa end_on" der; boş dizge = yok).
  const extended = rand() < 0.15
  const planned = extended
    ? isoDay(new Date(end.getTime() - (2 + Math.floor(rand() * 10)) * DAY))
    : ''
  return {
    work_item_id: uuid(rand),
    title: `${TITLES[i % TITLES.length]} ${Math.floor(i / TITLES.length) + 1}`,
    program_id: PROGRAM_ID,
    department_id: dept.id,
    priority: (['dusuk', 'orta', 'yuksek', 'acil'] as const)[Math.floor(rand() * 4)]!,
    status,
    start_on: isoDay(start),
    end_on: isoDay(end),
    planned_end_on: planned,
    completed_on,
    assignee_account_ids: [uuid(rand)],
    lateness,
  }
}

export function makeGantt(taskCount = TASK_COUNT, linkCount = LINK_COUNT): Gantt {
  const rand = mulberry32(42)
  const today = todayUtc()
  const tasks = Array.from({ length: taskCount }, (_, i) => makeTask(rand, i, today))
  const links: GanttLink[] = []
  const seen = new Set<string>()
  let guard = 0
  while (links.length < linkCount && guard++ < 10_000) {
    const s = tasks[Math.floor(rand() * tasks.length)]!
    const cross = links.length % 6 === 0
    const t = tasks.find(
      (c) =>
        c !== s &&
        c.start_on >= s.end_on &&
        (cross ? c.department_id !== s.department_id : c.department_id === s.department_id) &&
        !seen.has(`${s.work_item_id}>${c.work_item_id}`) &&
        rand() < 0.2,
    )
    if (!t) continue
    seen.add(`${s.work_item_id}>${t.work_item_id}`)
    links.push({
      dependency_id: uuid(rand),
      source: s.work_item_id,
      target: t.work_item_id,
      cross_department: s.department_id !== t.department_id,
    })
  }
  return { tasks, links }
}

export function departmentName(id: string): string {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? '—'
}

/** Planlanan bitiş: boş dizge = `end_on` (backend açıklaması). */
export function plannedEnd(t: GanttTask): string {
  return t.planned_end_on || t.end_on
}
