/**
 * CX-F1-E-05 (bileşik) — "görev oluştur → ek atama": oluşturma isteği beklerken sahip bileşen
 * sökülür. Ardıl `addAssignments` gönderilmez (ortak kapı `owner_disposed`), oluşturma başarısı
 * korunur, sonuç `partial`. Gerçek hook + gerçek API istemcisi + MSW; çağrı sayısıyla.
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import {
  COORD_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../model/__tests__/harness'
import { useCreateWorkItemWithAssignees } from './items'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd2' }
const body = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

function mountCreate() {
  const h = harness(COORD_SCOPE)
  let create!: ReturnType<typeof useCreateWorkItemWithAssignees>
  const Owner = defineComponent({
    setup() {
      create = useCreateWorkItemWithAssignees()
      return () => null
    },
  })
  const wrapper = mount(Owner, {
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { create, unmount: () => wrapper.unmount() }
}

describe('oluştur → ek atama: sahip sökülmesi (CX-F1-E-05)', () => {
  it('oluşturma beklerken sökülme → ek atama 0, oluşturma korunur, partial', async () => {
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, async () => {
        arrived()
        await held
        return json(workItem(), 201)
      }),
      http.post(`${ORIGIN}/v1/work-items/w1/assignments`, () => json({ added: 1 })),
    )
    const { create, unmount } = mountCreate()
    const pending = create.submit({ target, body, extraAssignees: ['acc-2'] })
    await reached
    unmount()
    release()
    const outcome = await pending
    expect(outcome.kind).toBe('partial')
    if (outcome.kind !== 'partial') return
    expect(outcome.primary.data.work_item_id).toBe('w1')
    expect(outcome.failed).toEqual(['assignments'])
    expect(outcome.steps[0]!.outcome.kind).toBe('owner_disposed')
    expect(sent('POST', '/v1/work-items')).toHaveLength(1)
    expect(sent('POST', '/v1/work-items/w1/assignments')).toHaveLength(0)
  })

  it('canlı sahip: ek atama eskisi gibi gider (complete)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem(), 201)),
      http.post(`${ORIGIN}/v1/work-items/w1/assignments`, () => json({ added: 1 })),
    )
    const { create, unmount } = mountCreate()
    expect((await create.submit({ target, body, extraAssignees: ['acc-2'] })).kind).toBe('complete')
    expect(sent('POST', '/v1/work-items/w1/assignments')).toHaveLength(1)
    unmount()
  })
})
