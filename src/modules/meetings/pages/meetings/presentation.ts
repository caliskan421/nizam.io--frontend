import { i18n } from '@/shared/i18n'
import type { ScopeLens } from '@/shared/scope/scope'

export function validDate(date: string): boolean {
  return (
    !date ||
    (/^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date)
  )
}
export function lensDescription(lens: ScopeLens | null): string {
  return i18n.global.t(
    lens === 'admin'
      ? 'meetings.list.adminLens'
      : lens === 'coordinator'
        ? 'meetings.list.coordinatorLens'
        : 'meetings.list.memberLens',
  )
}

export function invalidRange(from: unknown, to: unknown): boolean {
  if (
    (from !== undefined && typeof from !== 'string') ||
    (to !== undefined && typeof to !== 'string')
  )
    return true
  const start = typeof from === 'string' ? from : ''
  const end = typeof to === 'string' ? to : ''
  return !validDate(start) || !validDate(end) || (!!start && !!end && start > end)
}
