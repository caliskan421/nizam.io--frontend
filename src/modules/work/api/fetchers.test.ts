import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  ADMIN_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { fetchProgramDepartments, fetchWorkItemPage } from './fetchers'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

describe('okuma uçları', () => {
  it('liste sayfası: yalnız program başlığı; imleç ve departman yalnız verilirse', async () => {
    server.use(http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: [] })))
    harness(ADMIN_SCOPE)
    await fetchWorkItemPage({ programId: 'p9' }, null, undefined)
    await fetchWorkItemPage({ programId: 'p9' }, 'd1', 'c2')
    const [a, b] = sent('GET', '/v1/program/work-items')
    // Açık hedef depo kapsamının (p1) önüne geçer.
    expect(a!.headers.get('X-Nizamio-Program')).toBe('p9')
    expect([...a!.query.keys()]).toEqual(['limit'])
    expect(b!.query.get('department_id')).toBe('d1')
    expect(b!.query.get('cursor')).toBe('c2')
  })

  it('hata normalize ApiError olarak fırlar', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        Response.json(
          { code: 'work.program_scope_invalid', message: 'x', request_id: 'r' },
          { status: 404 },
        ),
      ),
    )
    harness(ADMIN_SCOPE)
    await expect(fetchProgramDepartments({ programId: 'p1' })).rejects.toMatchObject({
      code: 'work.program_scope_invalid',
      status: 404,
    })
  })
})
