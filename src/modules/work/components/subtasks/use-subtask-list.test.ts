import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { STANDING_KEYS } from '@/shared/scope/standing'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  subtask,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItem } from '../../model/types'
import { useSubtaskList } from './use-subtask-list'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'

function setup(actor: { admin?: boolean; role?: string }, item: WorkItem = workItem()) {
  const h = harness(actor.role ? COORD_SCOPE : ADMIN_SCOPE)
  h.queryClient.setQueryData(STANDING_KEYS.me, {
    account_id: 'acc-1',
    email: 'k@example.test',
    full_name: 'Kişi',
    company_admin: actor.admin === true,
  })
  const rows = actor.role
    ? [
        {
          program_id: 'p1',
          program_name: 'P',
          department_id: 'd2',
          display_name: 'B',
          role: actor.role,
        },
      ]
    : []
  h.queryClient.setQueryData(STANDING_KEYS.myDepartments, {
    data: { departments: rows },
    truncated: false,
  })
  return { h, list: h.run(() => useSubtaskList(() => item)) }
}

const mine = subtask({ subtask_id: 's-me', assignee_account_id: 'acc-1' })
const other = subtask({ subtask_id: 's-o', assignee_account_id: 'acc-9' })
const free = subtask({ subtask_id: 's-n' })

describe('alt görev listesi ve görünürlük', () => {
  it('sayaç önce satırdaki subtask_counts (ek istek yok), yüklenince listeden; görev kapsamıyla tek istek', async () => {
    server.use(
      http.get(`${ORIGIN}${PATH}`, () =>
        json({ subtasks: [mine, { ...free, done: true }], total: 2 }),
      ),
    )
    const { h, list } = setup({ admin: true }, workItem({ subtask_counts: { total: 5, done: 1 } }))
    expect(list.counts.value).toEqual({ total: 5, done: 1 })
    await h.flush()
    expect(list.counts.value).toEqual({ total: 2, done: 1 })
    const reads = sent('GET', PATH)
    expect(reads).toHaveLength(1)
    expect(reads[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
  })

  it.each([
    ['yönetici (s.146 evet, s.147 tek başına hayır)', { admin: true }, true, [false, false, false]],
    ['koordinatör', { role: 'koordinator' }, true, [true, true, true]],
    ['atanmış üye: atamasız ya da kendisine', { role: 'uye' }, false, [true, false, true]],
  ] as const)('%s', (_name, actor, manage, toggles) => {
    server.use(http.get(`${ORIGIN}${PATH}`, () => json({ subtasks: [], total: 0 })))
    const { list } = setup(actor)
    expect(list.canManage.value).toBe(manage)
    expect([mine, other, free].map((s) => list.canToggle(s))).toEqual(toggles)
  })

  it('atanmamış üye: hiçbir eylem', () => {
    server.use(http.get(`${ORIGIN}${PATH}`, () => json({ subtasks: [], total: 0 })))
    const { list } = setup({ role: 'uye' }, workItem({ assignee_account_ids: ['acc-5'] }))
    expect(list.canManage.value).toBe(false)
    expect([mine, free].map((s) => list.canToggle(s))).toEqual([false, false])
  })
})
