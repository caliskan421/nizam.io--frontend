import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { useConfirm } from '@/shared/ui/confirm'

import {
  COORD_SCOPE,
  http,
  json,
  ORIGIN,
  sent,
  server,
  subtask,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItemSubtask } from '../../model/types'
import SubtaskBlock from './SubtaskBlock.vue'
import SubtaskTab from './SubtaskTab.vue'
import { cleanupSubtasks, deferred, listLoaded, mountSubtasks } from './__tests__/subtask-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => cleanupSubtasks())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'
const item = workItem({ subtask_counts: { total: 2, done: 0 } })

/** Liste uç taklidi: `rows` her okumada güncel hâli döndürür. */
function serveList(rows: { current: WorkItemSubtask[] }) {
  server.use(
    http.get(`${ORIGIN}${PATH}`, () =>
      json({ subtasks: rows.current, total: rows.current.length }),
    ),
  )
}

const coordinator = { role: 'koordinator' } as const

describe('SubtaskBlock (E-03-21, E-03-30…37)', () => {
  it('blok açılınca yalnız o görevin alt görevleri; başlık sayaç + isteğe bağlılık cümlesi; satır/hücre rolü', async () => {
    serveList({ current: [subtask(), subtask({ subtask_id: 's2', title: 'İkinci', done: true })] })
    const { wrapper } = mountSubtasks(SubtaskBlock, { item }, coordinator, COORD_SCOPE)
    expect(wrapper.get('[data-testid="subtask-count"]').text()).toBe('alt görevler · 0/2')
    await listLoaded(wrapper)
    expect(wrapper.get('[data-testid="subtask-count"]').text()).toBe('alt görevler · 1/2')
    expect(wrapper.text()).toContain('Kişi ve tarih isteğe bağlıdır.')
    expect(wrapper.get('[role="row"]').find('[role="cell"]').exists()).toBe(true)
    expect(sent('GET', PATH)).toHaveLength(1)
  })

  it('alt görev başlığı → openSubtasks(üst görev)', async () => {
    serveList({ current: [subtask()] })
    const { wrapper } = mountSubtasks(SubtaskBlock, { item }, coordinator, COORD_SCOPE)
    await listLoaded(wrapper)
    await wrapper.get('[data-testid="subtask-title"]').trigger('click')
    expect(wrapper.emitted('openSubtasks')).toEqual([['w1']])
  })

  it('kapat İYİMSER DEĞİL: istek sürerken kutu işaretsiz + devre dışı; yanıt ve yeniden okuma sonrası işaretli', async () => {
    const rows = { current: [subtask()] }
    serveList(rows)
    const gate = deferred()
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, async () => {
        await gate.gate
        rows.current = [subtask({ done: true })]
        return json(rows.current[0])
      }),
    )
    const { wrapper } = mountSubtasks(SubtaskBlock, { item }, coordinator, COORD_SCOPE)
    await listLoaded(wrapper)
    const box = () => wrapper.get<HTMLInputElement>('[data-testid="subtask-done"]').element
    box().click()
    await flushPromises()
    expect(box().checked).toBe(false)
    expect(box().disabled).toBe(true)
    gate.release()
    await vi.waitFor(() => expect(box().checked).toBe(true))
    expect(box().disabled).toBe(false)
    expect(sent('PATCH', `${PATH}/s1`)[0]!.body).toEqual({ done: true })
  })

  it('menü: "zorunlu alanlar" kutuları statik (BE-006, devre dışı); sil → onay → DELETE', async () => {
    const rows = { current: [subtask()] }
    serveList(rows)
    server.use(
      http.delete(`${ORIGIN}${PATH}/s1`, () => {
        rows.current = []
        return json({ status: 'deleted' })
      }),
    )
    const { wrapper } = mountSubtasks(SubtaskBlock, { item }, coordinator, COORD_SCOPE)
    await listLoaded(wrapper)
    await wrapper.get('[data-testid="subtask-menu"]').trigger('click')
    const flags = wrapper.get('[data-design-stub="BE-006"]')
    const boxes = flags.findAll('input[type="checkbox"]')
    expect(boxes).toHaveLength(3)
    expect(boxes.every((b) => (b.element as HTMLInputElement).disabled)).toBe(true)
    await wrapper.get('[data-testid="subtask-remove"]').trigger('click')
    const confirm = useConfirm()
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    await confirm.accept(confirm.current.value!.id)
    await vi.waitFor(() => expect(wrapper.find('[data-testid="subtask-s1"]').exists()).toBe(false))
    expect(sent('DELETE', `${PATH}/s1`)).toHaveLength(1)
  })

  it('yönetici: kutu yok (s.147), yönetim var; üye: yönetim (menü, ekle, seçici) yok', async () => {
    serveList({ current: [subtask()] })
    const admin = mountSubtasks(SubtaskBlock, { item }, { admin: true }, COORD_SCOPE)
    await listLoaded(admin.wrapper)
    expect(admin.wrapper.find('[data-testid="subtask-done"]').exists()).toBe(false)
    expect(admin.wrapper.find('[data-testid="subtask-menu"]').exists()).toBe(true)
    expect(admin.wrapper.find('[data-testid="subtask-add-input"]').exists()).toBe(true)
    admin.wrapper.unmount()
    const member = mountSubtasks(SubtaskBlock, { item }, { role: 'uye' }, COORD_SCOPE)
    await listLoaded(member.wrapper)
    expect(member.wrapper.find('[data-testid="subtask-done"]').exists()).toBe(true)
    expect(member.wrapper.find('[data-testid="subtask-menu"]').exists()).toBe(false)
    expect(member.wrapper.find('[data-testid="subtask-add-input"]').exists()).toBe(false)
    expect(member.wrapper.find('[data-testid="subtask-person"]').exists()).toBe(false)
  })
})

describe('satır içi blok ↔ panel sekmesi AYNI sorgu (E-03-60)', () => {
  it('tek okuma; blokta kapatma panel sayacını da günceller', async () => {
    const rows = { current: [subtask(), subtask({ subtask_id: 's2', title: 'İkinci' })] }
    serveList(rows)
    server.use(
      http.patch(`${ORIGIN}${PATH}/s1`, () => {
        rows.current = [subtask({ done: true }), rows.current[1]!]
        return json(rows.current[0])
      }),
    )
    const Both = defineComponent(() => () => [h(SubtaskBlock, { item }), h(SubtaskTab, { item })])
    const { wrapper } = mountSubtasks(Both, {}, coordinator, COORD_SCOPE)
    await listLoaded(wrapper)
    expect(sent('GET', PATH)).toHaveLength(1)
    const tabCount = () => wrapper.get('[data-testid="subtask-tab"] [data-testid="subtask-count"]')
    expect(tabCount().text()).toBe('0/2')
    wrapper
      .get<HTMLInputElement>('[data-testid="subtask-block"] [data-testid="subtask-done"]')
      .element.click()
    await vi.waitFor(() => expect(tabCount().text()).toBe('1/2'))
  })
})
