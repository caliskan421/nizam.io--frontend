/**
 * CX-F1-E-05 — alt görev başlığı: ilk PATCH beklerken bileşen sökülür, geç `409
 * work.edit_conflict` gelir (sürüm ilerlemiş, başlık tabanla aynı, başka alan değişmiş →
 * "kendiliğinden birleşen" çakışma). Sökülmeden sonra ikinci PATCH ÇIKMAZ; ilk çağrı tamamlanır,
 * diyalog/bildirim yok. Gerçek hook + gerçek API istemcisi + MSW; çağrı sayısıyla.
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { useToast } from '@/shared/ui'

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
  useToast().clear()
  resetHarness()
})
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'
const item = workItem()

/** Hook'u gerçek bir bileşende kurar; `unmount` = bileşenin sökülmesi. */
function mountEdit() {
  const h = harness(ADMIN_SCOPE)
  const reload = vi.fn()
  let edit!: ReturnType<typeof useSubtaskEdit>
  const Owner = defineComponent({
    setup() {
      edit = useSubtaskEdit({ item: () => item, target: () => targetOf(item), reload })
      return () => null
    },
  })
  const wrapper = mount(Owner, {
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { edit, reload, unmount: () => wrapper.unmount() }
}

/**
 * İlk PATCH sunucuda bekletilir ve 409 döner; sonraki PATCH'ler başarılı. Güncel kayıt: sürüm 6,
 * başlık tabanla aynı ('Taslak'), kişi başkası tarafından değiştirilmiş (gerçek alan çakışması yok).
 */
function lateConflict() {
  const gate = deferred()
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  let patches = 0
  server.use(
    http.patch(`${ORIGIN}${PATH}/s1`, async () => {
      if (++patches > 1) return json(subtask({ title: 'Benim', edit_revision: 7 }))
      arrived()
      await gate.gate
      return errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }])
    }),
    http.get(`${ORIGIN}${PATH}`, () =>
      json({
        subtasks: [subtask({ title: 'Taslak', assignee_account_id: 'acc-2', edit_revision: 6 })],
        total: 1,
      }),
    ),
  )
  return { reached, release: gate.release }
}

describe('alt görev başlığı — sökülmeden sonra geç edit_conflict (CX-F1-E-05)', () => {
  it('sökülme → geç 409 → ikinci PATCH 0; ilk çağrı tamamlanır, diyalog ve bildirim yok', async () => {
    const late = lateConflict()
    const { edit, reload, unmount } = mountEdit()
    const run = edit.patch(subtask(), { title: 'Benim' })
    await late.reached
    unmount()
    late.release()
    await expect(run).resolves.toBeUndefined()
    expect(sent('PATCH', `${PATH}/s1`)).toHaveLength(1)
    expect(edit.conflict.open.value).toBe(false)
    expect(useToast().queue.value).toEqual([])
    expect(reload).not.toHaveBeenCalled()
    expect(edit.isPending('s1')).toBe(false)
  })

  it('kontrol — canlı sahipte aynı sıra kendiliğinden birleşir: ikinci PATCH yeni tabanla gider', async () => {
    const late = lateConflict()
    const { edit, unmount } = mountEdit()
    const run = edit.patch(subtask(), { title: 'Benim' })
    await late.reached
    late.release()
    await run
    const calls = sent('PATCH', `${PATH}/s1`)
    expect(calls).toHaveLength(2)
    expect(calls[1]!.body).toEqual({ title: 'Benim', expected_revision: 6 })
    expect(edit.conflict.open.value).toBe(false)
    unmount()
  })
})
