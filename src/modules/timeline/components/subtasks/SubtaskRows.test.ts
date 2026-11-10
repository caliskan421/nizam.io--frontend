import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
} from '../../__tests__/harness'
import SubtaskRows from './SubtaskRows.vue'
import {
  cleanupSubtask,
  mountSubtask,
  SUBTASKS_PATH,
  subtask,
  TASK_TARGET,
} from './__tests__/subtask-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => cleanupSubtask())
afterAll(() => server.close())

function serve(rows: ReturnType<typeof subtask>[]) {
  server.use(
    http.get(`${ORIGIN}${SUBTASKS_PATH}`, () => json({ subtasks: rows, total: rows.length })),
  )
}

const props = (open: boolean) => ({ workItemId: 'w1', target: TASK_TARGET, open })

describe('SubtaskRows — kapalı varsayılan (E-03C-13, 73)', () => {
  it('kapalıyken hiçbir şey çizmez ve istek ATMAZ (fan-out yok)', async () => {
    serve([subtask()])
    const { wrapper } = mountSubtask(SubtaskRows, props(false), COORD_SCOPE)
    await flushPromises()
    expect(wrapper.find('[data-testid="subtask-rows"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('Taslak')
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(0)
  })

  it('açılınca tek okuma; görevin KENDİ kapsamı başlıklarda; kapanınca satırlar kalkar', async () => {
    serve([subtask()])
    const { wrapper } = mountSubtask(SubtaskRows, props(false), COORD_SCOPE)
    await wrapper.setProps({ open: true })
    await vi.waitFor(() => expect(wrapper.findAll('[data-testid="subtask-row"]')).toHaveLength(1))
    const requests = sent('GET', SUBTASKS_PATH)
    expect(requests).toHaveLength(1)
    // Seçili birim d1; görev d2'de → başlık görevin kendi birimi.
    expect(requests[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(requests[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
    await wrapper.setProps({ open: false })
    expect(wrapper.find('[data-testid="subtask-rows"]').exists()).toBe(false)
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(1)
  })
})

describe('SubtaskRows — açılmış satırlar (E-03C-48…53)', () => {
  async function opened() {
    serve([
      subtask({
        subtask_id: 's1',
        title: 'Zemin etüdü',
        done: true,
        start_on: '2026-10-01',
        end_on: '2026-10-08',
      }),
      subtask({
        subtask_id: 's2',
        title: 'Sıkıştırma',
        start_on: '2026-10-22',
        end_on: '2026-11-05',
      }),
      subtask({ subtask_id: 's3', title: 'Son faz' }),
    ])
    const { wrapper } = mountSubtask(SubtaskRows, props(true), COORD_SCOPE)
    await vi.waitFor(() => expect(wrapper.findAll('[data-testid="subtask-row"]')).toHaveLength(3))
    return wrapper
  }

  it('durum dairesi erişim adı, biten başlık üstü çizili (E-03C-49/50)', async () => {
    const w = await opened()
    const states = w.findAll('[data-testid="subtask-state"]')
    expect(states.map((s) => s.attributes('aria-label'))).toEqual(['Tamamlandı', 'Açık', 'Açık'])
    expect(states[0]!.find('svg').exists()).toBe(true)
    expect(states[1]!.find('svg').exists()).toBe(false)
    const titles = w.findAll('[data-testid="subtask-title"]')
    expect(titles[0]!.classes()).toContain('tl-sub__title--done')
    expect(titles[1]!.classes()).not.toContain('tl-sub__title--done')
  })

  it('tarih metni ve "Tarih yok" (E-03C-52/53); "ana görev süresince" yazılmaz', async () => {
    const w = await opened()
    const dates = w.findAll('[data-testid="subtask-date"]').map((d) => d.text())
    expect(dates).toEqual(['1 Eki – 8 Eki', '22 Eki – 5 Kas'])
    expect(w.get('[data-testid="subtask-nodate"]').text()).toBe('Tarih yok')
    expect(w.text()).not.toContain('ana görev süresince')
  })

  it('ağaç çizgisi: yalnız son satır "last" (E-03C-48)', async () => {
    const w = await opened()
    const trees = w.findAll('.tl-sub__tree')
    expect(trees.map((t) => t.classes().includes('tl-sub__tree--last'))).toEqual([
      false,
      false,
      true,
    ])
  })

  it('tarihli alt görev için çubuk/elmas çizilmez (E-03C-45/51; sahte çizim yok)', async () => {
    const w = await opened()
    expect(w.find('svg rect, [class*="sbar"], [class*="tick"], [class*="diamond"]').exists()).toBe(
      false,
    )
    expect(w.find('progress').exists()).toBe(false)
  })

  it('satırlar treegrid düzeyi 2, hücreleri gridcell', async () => {
    const w = await opened()
    const row = w.get('[data-testid="subtask-row"]')
    expect(row.attributes('role')).toBe('row')
    expect(row.attributes('aria-level')).toBe('2')
    expect(row.findAll('[role="gridcell"]')).toHaveLength(2)
  })
})

describe('SubtaskRows — boş ve hata', () => {
  it('alt görev yoksa "Alt görev yok"', async () => {
    serve([])
    const { wrapper } = mountSubtask(SubtaskRows, props(true), COORD_SCOPE)
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="subtask-empty"]').exists()).toBe(true),
    )
    expect(wrapper.get('[data-testid="subtask-empty"]').text()).toBe('Alt görev yok')
  })

  it('hata: hata koduyla metin (sunucu message yok) + "Yeniden dene" tek yeni istek', async () => {
    server.use(
      http.get(`${ORIGIN}${SUBTASKS_PATH}`, () => errorEnvelope('work.item_not_found', 404)),
    )
    const { wrapper } = mountSubtask(SubtaskRows, props(true), COORD_SCOPE)
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.text()).not.toContain('sunucu iletisi')
    const before = sent('GET', SUBTASKS_PATH).length
    serve([subtask()])
    await wrapper.get('[role="alert"] button').trigger('click')
    await vi.waitFor(() => expect(wrapper.findAll('[data-testid="subtask-row"]')).toHaveLength(1))
    expect(sent('GET', SUBTASKS_PATH).length).toBe(before + 1)
  })
})
