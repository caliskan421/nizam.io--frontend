import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import type { MutationOutcome } from './outcome'
import { runWithFollowUps } from './partial'

const success = <D>(data: D): MutationOutcome<unknown, D> => ({
  kind: 'success',
  data,
  status: 201,
  replayed: false,
  idempotencyKey: 'k'.repeat(22),
})
const failed = (code: string): MutationOutcome<unknown, unknown> => ({
  kind: 'failed',
  error: new ApiError({ code, status: 422 }),
})

describe('kısmi başarı (CX-S-03)', () => {
  it('birincil başarılı, ardıl başarısız: partial, ilk yanıt korunur', async () => {
    const created = { id: 'w1', assignees: [{ account_id: 'a1' }] }
    const result = await runWithFollowUps(
      () => Promise.resolve(success(created)),
      (data) => [
        {
          name: 'assignments',
          run: () =>
            Promise.resolve(data.id === 'w1' ? failed('work.assignee_not_member') : success(null)),
        },
      ],
    )
    expect(result.kind).toBe('partial')
    if (result.kind !== 'partial') return
    expect(result.primary.data).toBe(created)
    expect(result.failed).toEqual(['assignments'])
    expect(result.steps[0]!.outcome.kind).toBe('failed')
  })

  it('ardıl adımlar birincil başarının eylem bağlamını alır (CX-F1-E-03)', async () => {
    const context = { scope: { programId: 'p1', departmentId: 'd1' }, generation: 3 }
    const followUps = vi.fn(() => [])
    await runWithFollowUps(() => Promise.resolve({ ...success('x'), context }), followUps)
    expect(followUps).toHaveBeenCalledWith('x', context)
  })

  it('birincil başarısızsa ardıl adım koşmaz', async () => {
    const step = vi.fn(() => Promise.resolve(success(null)))
    const result = await runWithFollowUps(
      () => Promise.resolve(failed('work.input_invalid')),
      () => [{ name: 'assignments', run: step }],
    )
    expect(result.kind).toBe('primary_failed')
    expect(step).not.toHaveBeenCalled()
  })

  it('hepsi başarılı: complete; bir adımın başarısızlığı sonrakileri durdurmaz', async () => {
    const all = await runWithFollowUps(
      () => Promise.resolve(success({ id: 'w1' })),
      () => [{ name: 'a', run: () => Promise.resolve(success(null)) }],
    )
    expect(all.kind).toBe('complete')

    const later = vi.fn(() => Promise.resolve(success(null)))
    const mixed = await runWithFollowUps(
      () => Promise.resolve(success({ id: 'w1' })),
      () => [
        { name: 'a', run: () => Promise.resolve(failed('x.y')) },
        { name: 'b', run: later },
      ],
    )
    expect(later).toHaveBeenCalledOnce()
    expect(mixed).toMatchObject({ kind: 'partial', failed: ['a'] })
  })
})
