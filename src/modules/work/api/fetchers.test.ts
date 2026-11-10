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
import {
  fetchProgramDepartments,
  fetchWorkItemCounts,
  fetchWorkItemPage,
  normalizeAssignees,
} from './fetchers'

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

  it('liste sayfası: atanan süzgeci tekrarlı anahtar olarak gider (BE-038)', async () => {
    server.use(http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: [] })))
    harness(ADMIN_SCOPE)
    await fetchWorkItemPage({ programId: 'p1' }, 'd1', undefined, undefined, ['b', 'a'])
    const [call] = sent('GET', '/v1/program/work-items')
    expect(call!.query.getAll('assignee_account_id')).toEqual(['a', 'b'])
    expect(call!.query.get('department_id')).toBe('d1')
  })

  it('sayaç ucu: yalnız program başlığı; süzgeçler yalnız verilirse; limit/cursor yok (BE-003)', async () => {
    const counts = {
      total: 0,
      by_status: {
        baslanmadi: 0,
        devam_ediyor: 0,
        onaya_sunuldu: 0,
        iade_edildi: 0,
        tamamlandi: 0,
      },
      overdue: 0,
      pending_date_requests: 0,
    }
    server.use(http.get(`${ORIGIN}/v1/program/work-items/counts`, () => json(counts)))
    harness(ADMIN_SCOPE)
    await fetchWorkItemCounts({ programId: 'p9' }, null)
    expect(await fetchWorkItemCounts({ programId: 'p9' }, 'd1', ['acc-1'])).toEqual(counts)
    const [a, b] = sent('GET', '/v1/program/work-items/counts')
    expect(a!.headers.get('X-Nizamio-Program')).toBe('p9')
    expect([...a!.query.keys()]).toEqual([])
    expect(b!.query.get('department_id')).toBe('d1')
    expect(b!.query.getAll('assignee_account_id')).toEqual(['acc-1'])
  })

  it('normalizeAssignees: tekrarsız, sıralı, boşsuz, en çok 50', () => {
    expect(normalizeAssignees(undefined)).toEqual([])
    expect(normalizeAssignees(['b', '', 'a', 'b'])).toEqual(['a', 'b'])
    expect(normalizeAssignees(Array.from({ length: 70 }, (_, i) => `x${i}`))).toHaveLength(50)
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
