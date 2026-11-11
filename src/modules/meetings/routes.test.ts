import { expect, it } from 'vitest'
import {
  MEETING_QUERY_KEYS,
  MEETING_ROUTE,
  MEETINGS_QUERY_KEYS,
  MEETINGS_ROUTE,
  meetingsRoutes,
} from './routes'

it('registers both S2 routes independently of their page bodies', () => {
  expect(meetingsRoutes.map(({ name, path, meta }) => ({ name, path, meta }))).toEqual([
    { ...MEETINGS_ROUTE, meta: { scope: 'S2' } },
    { ...MEETING_ROUTE, meta: { scope: 'S2' } },
  ])
  expect(meetingsRoutes.every((route) => typeof route.component === 'function')).toBe(true)
  expect(MEETINGS_QUERY_KEYS).toEqual(['zaman', 'koordinatorluk', 'from', 'to'])
  expect(MEETING_QUERY_KEYS).toEqual(['notlar'])
})
