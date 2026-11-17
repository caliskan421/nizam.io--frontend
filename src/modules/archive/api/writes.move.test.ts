import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN,
  errorEnvelope,
  fileRecord,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { useMoveArchiveFile } from './writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

// Kaynak dosya d7 departmanında; hedef görev aynı programın başka departmanında (d9).
const input = {
  target: { programId: 'p1', departmentId: 'd7' },
  workItemId: 'w-source',
  fileId: 'f1',
  targetWorkItemId: 'w-target',
}

function seed(h: ReturnType<typeof harness>) {
  const scope = h.store.snapshot
  const d9 = { ...scope, departmentId: 'd9' }
  const keys = {
    archive: queryKeys.archive.list({ ...scope, departmentId: 'd7' }, 'attachments', {}),
    targetItem: queryKeys.workItems.item(d9, 'w-target'),
    targetFiles: queryKeys.workItems.files(d9, 'w-target'),
    targetList: queryKeys.workItems.list(d9, { department: 'd9' }),
    sourceFiles: queryKeys.workItems.files(scope, 'w-source'),
    report: queryKeys.report.task(d9, 'w-target'),
    refSummary: queryKeys.chats.refSummary(d9, 'ref-1'),
    otherProgram: queryKeys.workItems.item({ programId: 'p2', departmentId: 'd9' }, 'w-x'),
    sharedCounts: queryKeys.chats.sharedCounts(d9, 'chat-1'),
  }
  for (const key of Object.values(keys)) h.queryClient.setQueryData(key, { seeded: true })
  const stale = (key: readonly unknown[]) => h.queryClient.getQueryState(key)?.isInvalidated
  return { keys, stale }
}

describe('moveFile (anahtarsız, doğal tekrar güvenli)', () => {
  it('PATCH work_item_id + subtask_id; başlıklar KAYNAK dosyanın departmanı; Idempotency-Key yok', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/work-item`, () =>
        json({ ...fileRecord, display_name: 'rapor (2).csv' }),
      ),
    )
    const h = harness(ADMIN)
    const { result: move } = h.run(() => useMoveArchiveFile())
    const outcome = await move.submit({ ...input, targetSubtaskId: 's-target' })
    expect(outcome.kind).toBe('success')
    if (outcome.kind === 'success') expect(outcome.data.display_name).toBe('rapor (2).csv')
    const [req] = sent('PATCH', '/v1/files/f1/work-item')
    expect(req!.body).toEqual({ work_item_id: 'w-target', subtask_id: 's-target' })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(req!.headers.get('X-Requested-With')).not.toBeNull()
  })

  it('alt görev yoksa gövdede subtask_id bulunmaz', async () => {
    server.use(http.patch(`${ORIGIN}/v1/files/f1/work-item`, () => json(fileRecord)))
    const h = harness(ADMIN)
    const { result: move } = h.run(() => useMoveArchiveFile())
    await move.submit(input)
    expect(sent('PATCH', '/v1/files/f1/work-item')[0]!.body).toEqual({ work_item_id: 'w-target' })
  })

  it('başarı: arşiv, kaynak/hedef görev okuyucuları (başka departman dahil), rapor ve ref özeti yenilenir; başka program ve sohbet sayaçları değil', async () => {
    server.use(http.patch(`${ORIGIN}/v1/files/f1/work-item`, () => json(fileRecord)))
    const h = harness(ADMIN)
    const { keys, stale } = seed(h)
    const { result: move } = h.run(() => useMoveArchiveFile())
    await move.submit(input)
    for (const key of [
      keys.archive,
      keys.targetItem,
      keys.targetFiles,
      keys.targetList,
      keys.sourceFiles,
      keys.report,
      keys.refSummary,
    ]) {
      expect(stale(key)).toBe(true)
    }
    expect(stale(keys.otherProgram)).toBe(false)
    expect(stale(keys.sharedCounts)).toBe(false)
  })

  it.each([
    ['records.source_completed', 409],
    ['records.input_invalid', 422],
    ['records.too_many_files', 422],
    ['records.moved', 409],
    ['records.file_not_found', 404],
  ])('%s: sınıflı hata döner ve görev/arşiv okuyucuları yeniden okunur', async (code, status) => {
    server.use(http.patch(`${ORIGIN}/v1/files/f1/work-item`, () => errorEnvelope(code, status)))
    const h = harness(ADMIN)
    const { keys, stale } = seed(h)
    const { result: move } = h.run(() => useMoveArchiveFile())
    const outcome = await move.submit(input)
    expect(outcome.kind).toBe('failed')
    if (outcome.kind === 'failed') expect(outcome.error.code).toBe(code)
    expect(stale(keys.archive)).toBe(true)
    expect(stale(keys.targetItem)).toBe(true)
  })

  it('403 records.not_authorized yeniden okuma tetiklemez', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/work-item`, () =>
        errorEnvelope('records.not_authorized', 403),
      ),
    )
    const h = harness(ADMIN)
    const { keys, stale } = seed(h)
    const { result: move } = h.run(() => useMoveArchiveFile())
    const outcome = await move.submit(input)
    expect(outcome.kind).toBe('failed')
    expect(stale(keys.archive)).toBe(false)
  })

  it('sonuç bilinmiyor: kör tekrar YOK (retry düşer), tek istek, tek yeniden okuma', async () => {
    let calls = 0
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/work-item`, () => {
        calls += 1
        return errorEnvelope('platform.internal', 503)
      }),
    )
    const h = harness(ADMIN)
    const { keys, stale } = seed(h)
    const { result: move } = h.run(() => useMoveArchiveFile())
    const outcome = await move.submit(input)
    expect(outcome.kind).toBe('unknown_outcome')
    if (outcome.kind === 'unknown_outcome') expect(outcome.retry).toBeNull()
    expect(calls).toBe(1)
    expect(stale(keys.targetFiles)).toBe(true)
    expect(stale(keys.archive)).toBe(true)
  })
})
