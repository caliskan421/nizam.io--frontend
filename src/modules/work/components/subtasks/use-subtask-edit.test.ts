import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

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
  workItem,
} from '../../model/__tests__/harness'
import { targetOf } from '../../model/target'
import { deferred } from './__tests__/subtask-harness'
import { useSubtaskEdit } from './use-subtask-edit'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetHarness()
})
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'
const item = workItem({
  assignees: [
    { account_id: 'acc-1', full_name: 'Ayşe' },
    { account_id: 'acc-2', full_name: 'Burak' },
  ],
})

function setup() {
  const reload = vi.fn()
  const h = harness(ADMIN_SCOPE)
  const edit = h.run(() =>
    useSubtaskEdit({ item: () => item, target: () => targetOf(item), reload }),
  )
  return { h, edit, reload }
}

describe('alt görev düzenleme', () => {
  it('kapat: yalnız {done} (sürüm yok); istek sürerken satır beklemede, ikinci tık istek atmaz', async () => {
    const gate = deferred()
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, async () => {
        await gate.gate
        return json(subtask({ done: true }))
      }),
    )
    const { h, edit } = setup()
    const run = edit.toggle(subtask())
    expect(edit.isPending('s1')).toBe(true)
    await edit.toggle(subtask())
    gate.release()
    await run
    await h.flush()
    expect(edit.isPending('s1')).toBe(false)
    const calls = sent('PATCH', `${PATH}/s1`)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.body).toEqual({ done: true })
  })

  it('409 edit_conflict: yalnız çakışan alan sorulur; seçimle sunucu sürümüyle YENİ istek', async () => {
    let calls = 0
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, () =>
        ++calls === 1
          ? errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }])
          : json(subtask({ assignee_account_id: 'acc-2', edit_revision: 7 })),
      ),
      http.get(`${ORIGIN}${PATH}`, () =>
        json({
          subtasks: [subtask({ assignee_account_id: 'acc-1', title: 'Yeni ad', edit_revision: 6 })],
          total: 1,
        }),
      ),
    )
    const { h, edit } = setup()
    const run = edit.patch(subtask(), { assignee_account_id: 'acc-2' })
    await vi.waitFor(() => expect(edit.conflict.open.value).toBe(true))
    expect(edit.conflict.fields.value).toEqual([
      { field: 'assignee_account_id', label: 'Kişi', mine: 'Burak', theirs: 'Ayşe' },
    ])
    edit.conflict.choose({ assignee_account_id: 'mine' })
    await run
    await h.flush()
    const [, second] = sent('PATCH', `${PATH}/s1`)
    expect(second!.body).toEqual({ assignee_account_id: 'acc-2', expected_revision: 6 })
  })

  it('çakışmada vazgeç: ikinci istek yok', async () => {
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }]),
      ),
      http.get(`${ORIGIN}${PATH}`, () =>
        json({ subtasks: [subtask({ title: 'Başkası', edit_revision: 6 })], total: 1 }),
      ),
    )
    const { edit } = setup()
    const run = edit.patch(subtask(), { title: 'Benim' })
    await vi.waitFor(() => expect(edit.conflict.open.value).toBe(true))
    edit.conflict.dismiss()
    await run
    expect(sent('PATCH', `${PATH}/s1`)).toHaveLength(1)
  })

  it('çakışmada sunucu sürümü ilerlemediyse döngü yok: tek istek, bildirim', async () => {
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }]),
      ),
      http.get(`${ORIGIN}${PATH}`, () => json({ subtasks: [subtask()], total: 1 })),
    )
    const { edit, reload } = setup()
    await edit.patch(subtask(), { title: 'Benim' })
    expect(sent('PATCH', `${PATH}/s1`)).toHaveLength(1)
    expect(edit.conflict.open.value).toBe(false)
    expect(useToast().current.value).not.toBeNull()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('sürekli 409, sürüm ilerliyor ama gerçek çakışma yok → en çok bir diyalogsuz yeniden gönderim (2 PATCH)', async () => {
    let revision = subtask().edit_revision
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }]),
      ),
      http.get(`${ORIGIN}${PATH}`, () =>
        json({ subtasks: [subtask({ edit_revision: ++revision })], total: 1 }),
      ),
    )
    const { edit, reload } = setup()
    await edit.patch(subtask(), { title: 'Benim' })
    expect(sent('PATCH', `${PATH}/s1`)).toHaveLength(2)
    expect(edit.conflict.open.value).toBe(false)
    expect(useToast().current.value).not.toBeNull()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('sil: onay iptal → istek yok; onay → DELETE', async () => {
    server.use(http.delete(`${ORIGIN}${PATH}/s1`, () => json({ status: 'deleted' })))
    const { edit } = setup()
    const confirm = useConfirm()
    const cancelled = edit.remove(subtask())
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    expect(confirm.current.value?.options.tone).toBe('danger')
    confirm.cancel(confirm.current.value!.id)
    await cancelled
    expect(sent('DELETE', `${PATH}/s1`)).toHaveLength(0)
    const accepted = edit.remove(subtask())
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    await confirm.accept(confirm.current.value!.id)
    await accepted
    expect(sent('DELETE', `${PATH}/s1`)).toHaveLength(1)
  })

  it('başarısızlık: hata kodu metni bildirilir, liste sunucudan yeniden okunur', async () => {
    server.use(http.patch(`${ORIGIN}${PATH}/s1`, () => errorEnvelope('work.item_completed', 409)))
    const { edit, reload } = setup()
    await edit.toggle(subtask({ done: true }))
    expect(useToast().current.value?.message).toBe('Görev zaten tamamlandı.')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('CX-F1-E-02 (c): kabulün hemen ardından kapsam A→B → DELETE 0 (yazma onayın bağlamıyla)', async () => {
    server.use(http.delete(`${ORIGIN}${PATH}/s1`, () => json({ status: 'deleted' })))
    const { h, edit } = setup()
    const confirm = useConfirm()
    const run = edit.remove(subtask())
    await h.flush()
    const accepting = confirm.accept(confirm.current.value!.id)
    h.store.commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd3' })
    await accepting
    await run
    expect(sent('DELETE', `${PATH}/s1`)).toHaveLength(0)
  })
})
