import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'

import {
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  note,
} from '../model/__tests__/harness'
import { useAddNote, useDeleteNote, useUpdateNote } from './notes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd2' }
const ref = { target, workItemId: 'w1' }
const PATH = '/v1/work-items/w1/notes'

describe('not yazmaları', () => {
  it('ekle: IK zorunlu, görev kapsamı; başarıda notlar yeniden okunur', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json(note(), 201)))
    const h = harness(COORD_SCOPE)
    const key = queryKeys.workItems.notes(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(key, { seeded: true })
    const add = h.run(() => useAddNote())
    expect((await add.submit({ ...ref, content: 'İlk' })).kind).toBe('success')
    const [req] = sent('POST', PATH)
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.body).toEqual({ content: 'İlk' })
    expect(h.queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('429 hız sınırı: Retry-After, otomatik tekrar yok', async () => {
    server.use(
      http.post(`${ORIGIN}${PATH}`, () =>
        Response.json(
          { code: 'platform.rate_limited', message: 'x', request_id: 'r' },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    )
    const h = harness(COORD_SCOPE)
    const add = h.run(() => useAddNote())
    expect(await add.submit({ ...ref, content: 'x' })).toMatchObject({
      kind: 'rate_limited',
      retryAfter: 30,
    })
    expect(sent('POST', PATH)).toHaveLength(1)
  })

  it('düzenle: expected_revision her zaman; 409 edit_conflict → güncel not', async () => {
    server.use(
      http.patch(`${ORIGIN}${PATH}/n1`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }]),
      ),
      http.get(`${ORIGIN}${PATH}`, () =>
        json({ notes: [note({ content: 'Başkası', edit_revision: 3 })], total: 1 }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const update = h.run(() => useUpdateNote())
    const outcome = await update.submit({ ...ref, noteId: 'n1', base: note(), content: 'Benim' })
    expect(sent('PATCH', `${PATH}/n1`)[0]!.body).toEqual({
      content: 'Benim',
      expected_revision: 2,
    })
    expect(outcome.kind).toBe('edit_conflict')
    if (outcome.kind !== 'edit_conflict') return
    expect(outcome.server).toMatchObject({ content: 'Başkası', edit_revision: 3 })
  })

  it('sil: DELETE, IK yok', async () => {
    server.use(http.delete(`${ORIGIN}${PATH}/n1`, () => json({ status: 'deleted' })))
    const h = harness(COORD_SCOPE)
    const remove = h.run(() => useDeleteNote())
    expect((await remove.submit({ ...ref, noteId: 'n1' })).kind).toBe('success')
    expect(sent('DELETE', `${PATH}/n1`)[0]!.headers.get('Idempotency-Key')).toBeNull()
  })
})
