import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN_SCOPE,
  click,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import TransferItems from './TransferItems.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ work_item_id: `w${i}`, title: `Görev ${i}` }))

describe('aktarılacak görevler', () => {
  it('tek departman süzgeciyle tek uç; "Tümünü seç" en çok 200 (PROGRAM-K33)', async () => {
    server.use(http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: items(205) })))
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(TransferItems, { departmentId: 'd1', modelValue: [] })
    await vi.waitFor(() => expect($('[data-testid="pg-select-all"]')).not.toBeNull())
    expect(sent('GET', '/v1/program/work-items')[0]!.query.get('department_id')).toBe('d1')
    click('[data-testid="pg-select-all"]')
    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0] as string[]
    expect(emitted).toHaveLength(200)
    await wrapper.setProps({ modelValue: emitted })
    expect(document.body.textContent).toContain('Tek aktarım en çok 200 görev taşır.')
    expect(($('[data-item="w204"]') as HTMLInputElement).disabled).toBe(true)
  })

  it('boş departman notu', async () => {
    server.use(http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: [] })))
    const h = harness(ADMIN_SCOPE)
    h.mount(TransferItems, { departmentId: 'd1', modelValue: [] })
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Bu departmanda aktarılacak görev yok.'),
    )
  })
})
