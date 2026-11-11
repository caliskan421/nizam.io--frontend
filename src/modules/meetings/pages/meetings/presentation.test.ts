import { expect, it } from 'vitest'
import { invalidRange, lensDescription, validDate } from './presentation'
it('validates calendar dates and describes the three lenses', () => {
  expect(validDate('2026-02-30')).toBe(false)
  expect(validDate('2028-02-29')).toBe(true)
  expect(validDate('bad')).toBe(false)
  expect(invalidRange('2026-03-02', '2026-03-01')).toBe(true)
  expect(invalidRange(['2026-01-01'], undefined)).toBe(true)
  expect(lensDescription('admin')).toContain('Admin')
  expect(lensDescription('coordinator')).toContain('Koordinatör')
  expect(lensDescription('member')).toContain('Üye')
})
