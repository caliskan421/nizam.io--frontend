// Aktarım uçları: ön izleme anahtarsız; yürütme eylem başına Idempotency-Key + parmak izi;
// 409 preview_stale çağırana döner (otomatik tekrar yok); geçmiş `['programs']` önekinde.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { SessionChangedError } from '@/shared/session/query-session'

import {
  ADMIN_SCOPE,
  bodyOf,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import {
  TRANSFER_HISTORY_KEY,
  usePreviewTransfer,
  useTransferHistory,
  useTransferWorkItems,
} from './transfers'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const SELECTION = {
  sourceProgramId: 'p1',
  targetProgramId: 'p2',
  departmentId: 'd1',
  workItemIds: ['w1', 'w2'],
}

const RESULT = {
  transfer_id: 't1',
  moved_work_item_ids: ['w1', 'w2'],
  moved_file_count: 0,
  cut_dependency_count: 0,
  restored_dependency_count: 0,
  granted_links: [],
  revoked_links: [],
  retained_links: [],
  granted_memberships: [],
  replayed: false,
}

describe('aktarım uçları', () => {
  it('ön izleme: gövde seçimden, Idempotency-Key YOK', async () => {
    const h = harness(ADMIN_SCOPE)
    server.use(
      http.post(`${ORIGIN}/v1/program-transfers/preview`, () =>
        json({ resolved_work_item_ids: ['w1'], preview_fingerprint: 'fp' }),
      ),
    )
    const preview = h.run(() => usePreviewTransfer()).result
    expect((await preview.submit(SELECTION)).kind).toBe('success')
    const [req] = sent('POST', '/v1/program-transfers/preview')
    expect(bodyOf(req)).toEqual({
      source_program_id: 'p1',
      target_program_id: 'p2',
      department_id: 'd1',
      work_item_ids: ['w1', 'w2'],
    })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
  })

  it('yürütme: eylem başına yeni anahtar + parmak izi; başarıda programlar ve kapsam yenilenir', async () => {
    const h = harness(ADMIN_SCOPE)
    h.queryClient.setQueryData(queryKeys.workItems.all(h.store.snapshot), { items: [] })
    server.use(
      http.post(`${ORIGIN}/v1/program-transfers`, () => json(RESULT, 201)),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
    )
    const transfer = h.run(() => useTransferWorkItems()).result
    const vars = { ...SELECTION, previewFingerprint: 'fp-1', addMissingAccess: false }
    await transfer.submit(vars)
    await transfer.submit(vars)
    const [a, b] = sent('POST', '/v1/program-transfers')
    const keyA = a!.headers.get('Idempotency-Key') ?? ''
    expect(isValidIdempotencyKey(keyA)).toBe(true)
    expect(b!.headers.get('Idempotency-Key')).not.toBe(keyA)
    expect(bodyOf(a)).toMatchObject({ preview_fingerprint: 'fp-1' })
    expect(bodyOf(a)).not.toHaveProperty('add_missing_access')
    expect(
      h.queryClient.getQueryState(queryKeys.workItems.all(h.store.snapshot))?.isInvalidated,
    ).toBe(true)
  })

  it('eksik erişim bayrağı yalnız istenince; 409 preview_stale tek istekle döner', async () => {
    const h = harness(ADMIN_SCOPE)
    server.use(
      http.post(`${ORIGIN}/v1/program-transfers`, () =>
        errorEnvelope('program.transfer_preview_stale', 409),
      ),
    )
    const transfer = h.run(() => useTransferWorkItems()).result
    const outcome = await transfer.submit({
      ...SELECTION,
      previewFingerprint: 'fp',
      addMissingAccess: true,
    })
    expect(outcome.kind === 'failed' && outcome.error.code).toBe('program.transfer_preview_stale')
    expect(sent('POST', '/v1/program-transfers')).toHaveLength(1)
    expect(bodyOf(sent('POST', '/v1/program-transfers')[0])).toMatchObject({
      add_missing_access: true,
    })
  })

  it('geçmiş imleçli; anahtar ["programs","transfers"] (programlar geçersizlenince yenilenir)', async () => {
    const h = harness(ADMIN_SCOPE)
    expect(TRANSFER_HISTORY_KEY).toEqual(['programs', 'transfers'])
    let page = 0
    server.use(
      http.get(`${ORIGIN}/v1/program-transfers`, ({ request }) => {
        page += 1
        const cursor = new URL(request.url).searchParams.get('cursor')
        return json(
          cursor
            ? { transfers: [{ transfer_id: 't2' }] }
            : { transfers: [{ transfer_id: 't1' }], next_cursor: 'c1' },
        )
      }),
    )
    const history = h.run(() => useTransferHistory()).result
    await h.flush()
    await history.query.fetchNextPage()
    expect(history.transfers.value.map((t) => t.transfer_id)).toEqual(['t1', 't2'])
    expect(sent('GET', '/v1/program-transfers')[0]!.query.get('limit')).toBe('50')
    expect(page).toBe(2)
  })

  it('W82c okuyucu kapısı: geçmiş okunurken oturum değişirse yanıt önbelleğe yazılmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}/v1/program-transfers`, async () => {
        await gate
        return json({ transfers: [{ transfer_id: 't1' }] })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const history = h.run(() => useTransferHistory()).result
    await vi.waitFor(() => expect(sent('GET', '/v1/program-transfers')).toHaveLength(1))
    authSession.clear()
    release()
    await vi.waitFor(() => expect(history.query.isFetching.value).toBe(false))
    expect(history.transfers.value).toEqual([])
    expect(h.queryClient.getQueryState(TRANSFER_HISTORY_KEY)?.error).toBeInstanceOf(
      SessionChangedError,
    )
  })
})
