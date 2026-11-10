// Kenar menüsü K/Ü rozet sayacı (BE-003): gerçek istemci + MSW sahte backend. `countProgramWorkItems`
// sözleşmesi: S2 program başlığı, `department_id`, tekrarlı `assignee_account_id`.
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { fetchShellWorkCounts, useTaskBadges } from './badges'

const ORIGIN = 'http://localhost'
const COUNTS = {
  total: 12,
  by_status: { baslanmadi: 4, devam_ediyor: 3, onaya_sunuldu: 1, iade_edildi: 1, tamamlandi: 3 },
  overdue: 6,
  pending_date_requests: 2,
}

const seen: URL[] = []
const headers: Headers[] = []
const server = setupServer(
  http.get(`${ORIGIN}/v1/program/work-items/counts`, ({ request }) => {
    seen.push(new URL(request.url))
    headers.push(new Headers(request.headers))
    return HttpResponse.json(COUNTS)
  }),
)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  seen.length = 0
  headers.length = 0
})
afterAll(() => server.close())

describe('fetchShellWorkCounts (countProgramWorkItems)', () => {
  it('program başlığı + department_id; atanan yoksa süzgeç yok', async () => {
    const result = await fetchShellWorkCounts({
      programId: 'p1',
      departmentId: 'd1',
      assigneeAccountId: null,
    })
    expect(result.overdue).toBe(6)
    expect(headers[0]!.get('X-Nizamio-Program')).toBe('p1')
    expect(seen[0]!.searchParams.get('department_id')).toBe('d1')
    expect(seen[0]!.searchParams.has('assignee_account_id')).toBe(false)
  })

  it('Üye: assignee_account_id = hesap', async () => {
    await fetchShellWorkCounts({ programId: 'p1', departmentId: 'd1', assigneeAccountId: 'acc-1' })
    expect(seen[0]!.searchParams.getAll('assignee_account_id')).toEqual(['acc-1'])
  })
})

describe('Görevler rozetleri — gerçek sayaç ucu', () => {
  it.each([
    ['coordinator', { overdue: 6, pendingDates: 2 }, null],
    ['member', { overdue: 6, pendingDates: null }, 'acc-1'],
  ] as const)('%s merceği', async (lens, expected, assignee) => {
    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle()
    store.commit({ programId: 'p1', lens, departmentId: 'd1' })
    const { badges } = setupWithScope(ctx, lifecycle, () => useTaskBadges('F1'))
    await settleQueries(ctx.queryClient)
    expect(badges.value).toEqual(expected)
    expect(seen.at(-1)!.searchParams.getAll('assignee_account_id')).toEqual(
      assignee ? [assignee] : [],
    )
  })
})
