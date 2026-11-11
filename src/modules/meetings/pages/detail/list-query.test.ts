import { expect, it } from 'vitest'
import { listQuery } from './list-query'

it('preserves list filters but not note filters or invalid arrays', () => {
  expect(
    listQuery({
      zaman: 'gecmis',
      koordinatorluk: 'd',
      from: '2026-01-01',
      to: '2026-12-31',
      notlar: 'benim',
      other: 'x',
    }),
  ).toEqual({ zaman: 'gecmis', koordinatorluk: 'd', from: '2026-01-01', to: '2026-12-31' })
  expect(listQuery({ zaman: ['gecmis', 'yaklasan'] })).toEqual({})
})
