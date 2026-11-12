import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  COORD,
} from '../../model/__tests__/harness'
import { useSubtaskOptions } from './use-subtask-options'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd1' }

function run(id: string | null) {
  const h = harness(COORD)
  const { result } = h.run(() =>
    useSubtaskOptions(
      () => id,
      () => target,
    ),
  )
  return { h, result }
}

describe('useSubtaskOptions', () => {
  it('görev yokken istek atmaz; yalnız "Alt görev yok" seçeneği', async () => {
    const { h, result } = run(null)
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(0)
    expect(result.options.value.map((o) => o.value)).toEqual([''])
  })

  it('seçili görevin alt görevlerini seçeneğe çevirir', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        json({ subtasks: [{ subtask_id: 's1', title: 'Bir', done: false }] }),
      ),
    )
    const { h, result } = run('w1')
    await settleQueries(h.queryClient)
    expect(result.options.value.map((o) => o.value)).toEqual(['', 's1'])
    expect(result.unavailable.value).toBe(false)
  })

  it('403 work.not_assigned nötr; başka hata unavailable', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        errorEnvelope('work.not_assigned', 403),
      ),
    )
    const first = run('w1')
    await settleQueries(first.h.queryClient)
    expect(first.result.unavailable.value).toBe(false)
    resetHarness()
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        errorEnvelope('work.item_not_found', 404),
      ),
    )
    const second = run('w1')
    await settleQueries(second.h.queryClient)
    expect(second.result.unavailable.value).toBe(true)
  })
})
