import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  subtask,
} from '../model/__tests__/harness'
import { useCreateSubtask, useDeleteSubtask, useUpdateSubtask } from './subtasks'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd2' }
const ref = { target, workItemId: 'w1' }
const PATH = '/v1/work-items/w1/subtasks'

describe('alt görev yazmaları', () => {
  it('ekle: IK (Enter/Ekle başına), görev kapsamı; başarıda alt görevler + görev + liste', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json(subtask(), 201)))
    const h = harness(ADMIN_SCOPE)
    const scope = h.store.snapshot
    const keys = [
      queryKeys.workItems.subtasks(scope, 'w1'),
      queryKeys.workItems.item(scope, 'w1'),
      queryKeys.workItems.list(scope, { department: null }),
    ]
    for (const key of keys) h.queryClient.setQueryData(key, { seeded: true })
    const create = h.run(() => useCreateSubtask())
    expect((await create.submit({ ...ref, body: { title: 'Taslak' } })).kind).toBe('success')
    const [req] = sent('POST', PATH)
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    for (const key of keys) expect(h.queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('409 subtask_limit_reached başarısız sonuç', async () => {
    server.use(
      http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.subtask_limit_reached', 409)),
    )
    const h = harness(ADMIN_SCOPE)
    const create = h.run(() => useCreateSubtask())
    const outcome = await create.submit({ ...ref, body: { title: 'x' } })
    expect(outcome).toMatchObject({ kind: 'failed', error: { code: 'work.subtask_limit_reached' } })
  })

  it('güncelle: yalnız {done} → sürüm yok; başlık/atanan → expected_revision', async () => {
    server.use(http.patch(`${ORIGIN}${PATH}/s1`, () => json(subtask())))
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateSubtask())
    await update.submit({ ...ref, base: subtask(), changes: { done: true } })
    await update.submit({ ...ref, base: subtask(), changes: { assignee_account_id: '' } })
    const [done, assign] = sent('PATCH', `${PATH}/s1`)
    expect(done!.body).toEqual({ done: true })
    expect(assign!.body).toEqual({ assignee_account_id: '', expected_revision: 5 })
  })

  it('409 edit_conflict: sunucunun güncel alt görevi listeden', async () => {
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }]),
      ),
      http.get(`${ORIGIN}${PATH}`, () =>
        json({ subtasks: [subtask({ title: 'Başkası', edit_revision: 6 })], total: 1 }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateSubtask())
    const outcome = await update.submit({ ...ref, base: subtask(), changes: { title: 'Benim' } })
    expect(outcome.kind).toBe('edit_conflict')
    if (outcome.kind !== 'edit_conflict') return
    expect(outcome.server).toMatchObject({ title: 'Başkası', edit_revision: 6 })
  })

  it('sil: DELETE; bağlı dosyalar da yeniden okunur', async () => {
    server.use(http.delete(`${ORIGIN}${PATH}/s1`, () => json({ status: 'deleted' })))
    const h = harness(ADMIN_SCOPE)
    const files = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(files, { seeded: true })
    const remove = h.run(() => useDeleteSubtask())
    expect((await remove.submit({ ...ref, subtaskId: 's1' })).kind).toBe('success')
    expect(sent('DELETE', `${PATH}/s1`)).toHaveLength(1)
    expect(h.queryClient.getQueryState(files)?.isInvalidated).toBe(true)
  })
})
