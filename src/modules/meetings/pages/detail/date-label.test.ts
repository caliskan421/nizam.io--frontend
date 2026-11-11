import { expect, it } from 'vitest'
import { dateLabel } from './date-label'
it('uses the installation calendar for today and tomorrow', () => {
  const now = new Date('2026-10-21T21:30:00Z')
  expect(dateLabel('2026-10-21T22:00:00Z', 'Europe/Istanbul', now, 'Bugün', 'Yarın')).toContain(
    'Bugün · 22 Ekim 2026 Perşembe · 01:00',
  )
  expect(dateLabel('2026-10-22T22:00:00Z', 'Europe/Istanbul', now, 'Bugün', 'Yarın')).toContain(
    'Yarın · 23 Ekim 2026 Cuma · 01:00',
  )
})
