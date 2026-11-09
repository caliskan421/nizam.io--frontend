import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  COORD_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import { TRANSITION_MATRIX, type TransitionActor } from '../../model/transitions'
import { WORK_ITEM_STATUSES, type WorkItemStatus } from '../../model/types'
import { formsHarness, ME, resetForms, type WhoSeed } from './__tests__/forms-harness'
import { useStatusTransition } from './use-status-transition'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/transitions'
const COORD: WhoSeed = { rows: [{ departmentId: 'd2', role: 'koordinator' }] }

const ACTORS: Record<TransitionActor | 'admin' | 'outsider', { who: WhoSeed; assigned: boolean }> =
  {
    member: { who: { rows: [{ departmentId: 'd2', role: 'uye' }] }, assigned: true },
    coordinator: { who: COORD, assigned: false },
    own: { who: COORD, assigned: true },
    admin: { who: { companyAdmin: true }, assigned: false },
    outsider: { who: { rows: [{ departmentId: 'd2', role: 'uye' }] }, assigned: false },
  }

function setup(
  status: WorkItemStatus = 'devam_ediyor',
  actor: keyof typeof ACTORS = 'coordinator',
) {
  const { who, assigned } = ACTORS[actor]
  const h = formsHarness(COORD_SCOPE, who)
  const item = workItem({ status, assignee_account_ids: assigned ? [ME] : ['acc-1'] })
  const transitioned = vi.fn()
  const requestEvidence = vi.fn()
  const r = h.run(() => useStatusTransition(item, { transitioned, requestEvidence }))
  return { h, r, transitioned, requestEvidence }
}

const result = (to: WorkItemStatus) => ({
  work_item_id: 'w1',
  from: 'devam_ediyor',
  to,
  actor: 'koordinator',
})
const bodies = () => sent('POST', PATH).map((q) => q.body)
const toasts = () => useToast().queue.value.map((t) => t.message)

describe('geçiş matrisi (istemci-akislari §5) — tablo testi', () => {
  const rows = (['member', 'coordinator', 'own'] as const).flatMap((actor) =>
    WORK_ITEM_STATUSES.map((status) => [actor, status, TRANSITION_MATRIX[actor][status]] as const),
  )
  it.each(rows)('%s · %s → %j', (actor, status, expected) => {
    expect(setup(status, actor).r.targets.value).toEqual(expected)
  })

  it.each(WORK_ITEM_STATUSES)('yönetici tek başına ve atanmamış üye aktör değil (%s)', (status) => {
    expect(setup(status, 'admin').r.targets.value).toEqual([])
    resetForms()
    expect(setup(status, 'outsider').r.targets.value).toEqual([])
  })
})

describe('useStatusTransition — yazma', () => {
  it('başarı: görevin kendi S3 kapsamı, IK yok, transitioned', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json(result('tamamlandi'))))
    const { r, transitioned } = setup('devam_ediyor')
    await r.choose('tamamlandi')
    const [req] = sent('POST', PATH)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.body).toEqual({ to: 'tamamlandi' })
    expect(transitioned).toHaveBeenCalledWith(result('tamamlandi'))
  })

  it('409 work.subtasks_open → onay → aynı hedef close_subtasks: true (ikinci istek)', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${PATH}`, () =>
        ++calls === 1 ? errorEnvelope('work.subtasks_open', 409) : json(result('tamamlandi')),
      ),
    )
    const { r, transitioned } = setup('devam_ediyor')
    const done = r.choose('tamamlandi')
    const dialog = useConfirm()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    expect(dialog.current.value!.options.title).toBe('Açık alt görevler kapatılsın mı?')
    await dialog.accept(dialog.current.value!.id)
    await done
    expect(bodies()).toEqual([{ to: 'tamamlandi' }, { to: 'tamamlandi', close_subtasks: true }])
    expect(transitioned).toHaveBeenCalledOnce()
  })

  it('onay vazgeçilirse ikinci istek yok; görev ve liste yeniden okunur', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.subtasks_open', 409)))
    const { r, h, transitioned } = setup('devam_ediyor')
    const scope = h.store.snapshot
    const item = queryKeys.workItems.item(scope, 'w1')
    const list = queryKeys.workItems.list(scope, { department: 'd1' })
    h.queryClient.setQueryData(item, { seeded: true })
    h.queryClient.setQueryData(list, { seeded: true })
    const done = r.choose('tamamlandi')
    const dialog = useConfirm()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    dialog.cancel(dialog.current.value!.id)
    await done
    expect(bodies()).toHaveLength(1)
    expect(transitioned).not.toHaveBeenCalled()
    expect(h.queryClient.getQueryState(item)?.isInvalidated).toBe(true)
    expect(h.queryClient.getQueryState(list)?.isInvalidated).toBe(true)
  })

  it('422 work.attachment_required → "Önce kanıt dosyası yükleyin" + requestEvidence', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.attachment_required', 422)))
    const { r, requestEvidence, transitioned } = setup('devam_ediyor', 'own')
    await r.choose('onaya_sunuldu')
    expect(requestEvidence).toHaveBeenCalledOnce()
    expect(transitioned).not.toHaveBeenCalled()
    expect(toasts()).toEqual(['Önce kanıt dosyası yükleyin.'])
  })

  it('geri alma önce gerekçe ister; gerekçe kırpılarak gönderilir', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json(result('devam_ediyor'))))
    const { r, transitioned } = setup('tamamlandi')
    await r.choose('devam_ediyor')
    expect(bodies()).toEqual([])
    expect(r.reasonFor.value).toBe('devam_ediyor')
    await r.submitReason('  hatalı onay ')
    expect(bodies()).toEqual([{ to: 'devam_ediyor', reason: 'hatalı onay' }])
    expect(r.reasonFor.value).toBeNull()
    expect(transitioned).toHaveBeenCalledOnce()
  })

  it('sunucu 422 work.revert_reason_required → gerekçe penceresi', async () => {
    server.use(
      http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.revert_reason_required', 422)),
    )
    const { r } = setup('tamamlandi')
    r.reasonFor.value = 'devam_ediyor'
    await r.submitReason('kısa')
    expect(r.reasonFor.value).toBe('devam_ediyor')
  })

  it('diğer 409 (stale_transition): ileti + yeniden okuma, otomatik tekrar yok', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.stale_transition', 409)))
    const { r, h } = setup('devam_ediyor')
    const item = queryKeys.workItems.item(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(item, { seeded: true })
    await r.choose('baslanmadi')
    expect(bodies()).toHaveLength(1)
    expect(toasts()).toEqual(['Görev durumu değişti; yenileyip yeniden deneyin.'])
    expect(h.queryClient.getQueryState(item)?.isInvalidated).toBe(true)
  })
})
