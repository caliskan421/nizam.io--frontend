/**
 * Ü1 "Son tarihlerim" takvimi (E-Ü1-25…27): yüklenen kümedeki açık görevlerin `end_on` günleri
 * (ağsız ay gezinmesi). Hafta Pazartesi başlar; TRT takvim günü (çağıranın verdiği "bugün").
 */
import { isOpen, type WorkRow } from '../role/common'
import { monthOf } from '../role/dates'

export interface CalendarCell {
  /** `YYYY-MM-DD`. */
  day: string
  dayNumber: number
  inMonth: boolean
  today: boolean
  overdue: boolean
  upcoming: boolean
}

export interface CalendarLegend {
  overdue: number
  upcoming: number
}

/** Takvim lejantı: geciken = açık ve `is_overdue`; yaklaşan = açık ve `end_on` ≥ bugün. */
export function calendarLegend(items: readonly WorkRow[], today: string): CalendarLegend {
  const open = items.filter(isOpen)
  return {
    overdue: open.filter((i) => i.is_overdue).length,
    upcoming: open.filter((i) => !i.is_overdue && i.end_on >= today).length,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** Ayın ızgarası (5 ya da 6 hafta), Pazartesi başlangıçlı. */
export function monthGrid(month: string, today: string, items: readonly WorkRow[]): CalendarCell[] {
  const [year, mon] = month.split('-').map(Number) as [number, number]
  const first = new Date(Date.UTC(year, mon - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const length = new Date(Date.UTC(year, mon, 0)).getUTCDate()
  const weeks = Math.ceil((lead + length) / 7)
  const open = items.filter(isOpen)
  const cells: CalendarCell[] = []
  for (let i = 0; i < weeks * 7; i += 1) {
    const date = new Date(Date.UTC(year, mon - 1, 1 - lead + i))
    const day = iso(date)
    const due = open.filter((item) => item.end_on === day)
    cells.push({
      day,
      dayNumber: date.getUTCDate(),
      inMonth: monthOf(day) === month,
      today: day === today,
      overdue: due.some((item) => item.is_overdue),
      upcoming: due.some((item) => !item.is_overdue && day >= today),
    })
  }
  return cells
}
