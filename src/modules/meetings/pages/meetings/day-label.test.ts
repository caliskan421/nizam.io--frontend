import { expect, it } from 'vitest'
import { dayLabel } from './day-label'
it('labels today and Monday-based weeks across a year boundary', () => {
  const now = new Date('2026-12-31T12:00:00Z')
  expect(dayLabel('2026-12-31', now, 'Europe/Istanbul')).toBe('Bugün')
  expect(dayLabel('2027-01-03', now, 'Europe/Istanbul')).toBe('Bu hafta')
  expect(dayLabel('2027-01-04', now, 'Europe/Istanbul')).toBe('Gelecek hafta')
  expect(dayLabel('2027-01-18', now, 'Europe/Istanbul')).toContain('Ocak')
})
