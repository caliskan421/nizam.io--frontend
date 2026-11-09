// 08 kart/ızgara test fikstürleri: rapor satırı (`CoordinatorshipStat`) ve görünüm modeli.
// Değerler sözleşme şeklindedir; tasarımın örnek verileri kopyalanmaz.
import type { CoordinatorshipStat, CoordinatorshipView } from '../../../model/types'

/** Sabit "şimdi" (sahte saat). */
export const NOW = Date.parse('2026-11-09T09:00:00Z')

export function daysAgo(days: number): string {
  return new Date(NOW - days * 86_400_000).toISOString()
}

export function stat(
  departmentId: string,
  patch: Partial<CoordinatorshipStat> = {},
): CoordinatorshipStat {
  return {
    department_id: departmentId,
    name: `Birim ${departmentId}`,
    kind: 'koordinatorluk',
    coordinators: [{ account_id: `c-${departmentId}`, full_name: 'Deniz Kaya' }],
    member_count: 4,
    total_tasks: 6,
    completed_tasks: 2,
    in_progress_tasks: 2,
    not_started_tasks: 2,
    overdue_tasks: 0,
    completion_rate: 33.3,
    meeting_count: 0,
    last_activity_at: daysAgo(3),
    ...patch,
  }
}

export function view(
  departmentId: string,
  displayName: string,
  code: string | null,
  s: CoordinatorshipStat | null = stat(departmentId),
): CoordinatorshipView {
  return { departmentId, displayName, code, stat: s }
}
