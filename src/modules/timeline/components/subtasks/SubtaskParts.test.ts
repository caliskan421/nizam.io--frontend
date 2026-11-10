import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { COORD_SCOPE, http, json, ORIGIN, sent, server } from '../../__tests__/harness'
import SubtaskChip from './SubtaskChip.vue'
import SubtaskMode from './SubtaskMode.vue'
import SubtaskProgress from './SubtaskProgress.vue'
import SubtaskRows from './SubtaskRows.vue'
import SubtaskToggle from './SubtaskToggle.vue'
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

const base = { workItemId: 'w1', target: TASK_TARGET }

describe('SubtaskToggle (E-03C-33)', () => {
  it('kapalı: aria-expanded=false, "göster" adı, sayaç yok, istek yok; tık toggle yayar', async () => {
    serve([subtask()])
    const { wrapper } = mountSubtask(
      SubtaskToggle,
      { ...base, open: false, label: 'İDA-5' },
      COORD_SCOPE,
    )
    await flushPromises()
    const button = wrapper.get('button')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-label')).toBe('İDA-5 alt görevlerini göster')
    expect(wrapper.find('[data-testid="subtask-toggle-count"]').exists()).toBe(false)
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(0)
    await button.trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('kapalı satır: sayaç satırın subtask_counts değerinden (BE-051), istek yok; alt görevsizde yok', async () => {
    serve([subtask()])
    const withCounts = mountSubtask(
      SubtaskToggle,
      { ...base, open: false, label: 'İDA-5', rowCounts: { done: 1, total: 3 } },
      COORD_SCOPE,
    )
    await flushPromises()
    expect(withCounts.wrapper.get('[data-testid="subtask-toggle-count"]').text()).toBe('1/3')
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(0)
    const none = mountSubtask(
      SubtaskToggle,
      { ...base, open: false, label: 'İDA-5', rowCounts: { done: 0, total: 0 } },
      COORD_SCOPE,
    )
    await flushPromises()
    expect(none.wrapper.find('[data-testid="subtask-toggle-count"]').exists()).toBe(false)
  })

  it('açık: "gizle" adı; liste yüklenince "b/t" sayacı', async () => {
    serve([subtask({ done: true }), subtask({ subtask_id: 's2' }), subtask({ subtask_id: 's3' })])
    const { wrapper } = mountSubtask(
      SubtaskToggle,
      { ...base, open: true, label: 'İDA-5' },
      COORD_SCOPE,
    )
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="subtask-toggle-count"]').exists()).toBe(true),
    )
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('button').attributes('aria-label')).toBe('İDA-5 alt görevlerini gizle')
    expect(wrapper.get('[data-testid="subtask-toggle-count"]').text()).toBe('1/3')
  })
})

describe('SubtaskProgress / SubtaskChip (E-03C-44, 46)', () => {
  it("kapalı satırda DOM'da yok (veri yok → uydurma yok)", async () => {
    serve([subtask()])
    const progress = mountSubtask(SubtaskProgress, { ...base, open: false }, COORD_SCOPE)
    const chip = mountSubtask(SubtaskChip, { ...base, open: false }, COORD_SCOPE)
    await flushPromises()
    expect(progress.wrapper.find('progress').exists()).toBe(false)
    expect(chip.wrapper.find('[data-testid="subtask-chip"]').exists()).toBe(false)
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(0)
  })

  it('açık: çizgi biten/toplam, satır içi stil yok; çip "1/2", erişim adı', async () => {
    serve([subtask({ done: true }), subtask({ subtask_id: 's2' })])
    const progress = mountSubtask(SubtaskProgress, { ...base, open: true }, COORD_SCOPE)
    await vi.waitFor(() => expect(progress.wrapper.find('progress').exists()).toBe(true))
    const bar = progress.wrapper.get<HTMLProgressElement>('progress')
    expect([bar.element.value, bar.element.max]).toEqual([1, 2])
    expect(bar.attributes('style')).toBeUndefined()
  })

  it('açık satır: liste gelmeden çip ve çizgi satırın subtask_counts değerini gösterir (BE-051)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}${SUBTASKS_PATH}`, async () => {
        await gate
        return json({ subtasks: [], total: 0 })
      }),
    )
    const props = { ...base, open: true, rowCounts: { done: 1, total: 4 } }
    const chip = mountSubtask(SubtaskChip, props, COORD_SCOPE)
    const progress = mountSubtask(SubtaskProgress, props, COORD_SCOPE)
    await flushPromises()
    expect(chip.wrapper.get('[data-testid="subtask-chip"]').text()).toBe('1/4')
    const bar = progress.wrapper.get<HTMLProgressElement>('progress')
    expect([bar.element.value, bar.element.max]).toEqual([1, 4])
    release()
  })

  it('çip: hepsi bitince ✓ vurgusu; hiç alt görev yoksa çip ve çizgi yok', async () => {
    serve([subtask({ done: true }), subtask({ subtask_id: 's2', done: true })])
    const chip = mountSubtask(SubtaskChip, { ...base, open: true }, COORD_SCOPE)
    await vi.waitFor(() =>
      expect(chip.wrapper.find('[data-testid="subtask-chip"]').exists()).toBe(true),
    )
    const el = chip.wrapper.get('[data-testid="subtask-chip"]')
    expect(el.text()).toBe('2/2')
    expect(el.classes()).toContain('tl-subchip--all')
    expect(el.attributes('aria-label')).toBe('2 / 2 alt görev bitti')
    cleanupSubtask()

    serve([])
    const empty = mountSubtask(SubtaskChip, { ...base, open: true }, COORD_SCOPE)
    await vi.waitFor(() => expect(sent('GET', SUBTASKS_PATH).length).toBeGreaterThan(0))
    await flushPromises()
    expect(empty.wrapper.find('[data-testid="subtask-chip"]').exists()).toBe(false)
  })
})

describe('aynı satırın parçaları tek okumayı paylaşır (açılışta tek istek)', () => {
  it('düğme + çizgi + çip + satırlar → tek istek', async () => {
    serve([subtask({ done: true }), subtask({ subtask_id: 's2' })])
    const Row = defineComponent({
      setup: () => () =>
        h('div', [
          h(SubtaskToggle, { ...base, open: true, label: 'KOD' }),
          h(SubtaskProgress, { ...base, open: true }),
          h(SubtaskChip, { ...base, open: true }),
          h(SubtaskRows, { ...base, open: true }),
        ]),
    })
    const { wrapper } = mountSubtask(Row, {}, COORD_SCOPE)
    await vi.waitFor(() => expect(wrapper.findAll('[data-testid="subtask-row"]')).toHaveLength(2))
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(1)
    expect(wrapper.get('[data-testid="subtask-toggle-count"]').text()).toBe('1/2')
  })
})

describe('SubtaskMode (E-03C-13)', () => {
  it('"Kapalı" basılı; "Tümünü aç" devre dışı, tık istek atmaz', async () => {
    serve([subtask()])
    const { wrapper } = mountSubtask(SubtaskMode, {}, COORD_SCOPE)
    const [closed, all] = wrapper.findAll('button')
    expect(closed!.text()).toBe('Kapalı')
    expect(closed!.attributes('aria-pressed')).toBe('true')
    expect(all!.text()).toBe('Tümünü aç')
    expect(all!.attributes('disabled')).toBeDefined()
    expect(all!.attributes('aria-pressed')).toBe('false')
    await all!.trigger('click')
    await flushPromises()
    expect(all!.attributes('aria-pressed')).toBe('false')
    expect(sent('GET', SUBTASKS_PATH)).toHaveLength(0)
    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Alt görev gösterimi')
  })
})
