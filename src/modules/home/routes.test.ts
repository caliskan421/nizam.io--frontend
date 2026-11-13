import { describe, expect, it } from 'vitest'

import { HOME_ROUTE, homeRoutes } from './routes'

describe('ana sayfa rotası', () => {
  it('sayfa kaydı: home → HomePage (S1), katalog adı ve yolu', async () => {
    expect(HOME_ROUTE).toEqual({ name: 'home', path: '/' })
    expect(homeRoutes).toHaveLength(1)
    const [record] = homeRoutes
    expect(record).toMatchObject({ name: 'home', path: '/', meta: { scope: 'S1' } })
    const page = await (record!.component as () => Promise<{ default: { __name?: string } }>)()
    expect(page.default.__name).toBe('HomePage')
  })
})
