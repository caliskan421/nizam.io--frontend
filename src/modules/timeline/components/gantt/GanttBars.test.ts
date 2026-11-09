import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { task } from '../../model/__tests__/gantt-fixtures'
import type { GanttTask } from '../../model/types'
import GanttBars from './GanttBars.vue'
import { layoutOf, NAMES, RANGE, TODAY, windowOf } from './gantt-test-support'

const TASKS: GanttTask[] = [
  task({
    work_item_id: 'a',
    department_id: 'd1',
    title: 'Hidrofor kurulumu',
    start_on: '2026-11-04',
    end_on: '2026-11-20',
  }),
  task({
    work_item_id: 'b',
    department_id: 'd1',
    title: 'Gecikmiş iş',
    status: 'onaya_sunuldu',
    start_on: '2026-11-05',
    end_on: '2026-11-07',
    lateness: { ...task().lateness, is_overdue: true, days_overdue: 3 },
  }),
  task({ work_item_id: 'c', department_id: 'd2', title: 'Tarihsiz', start_on: '', end_on: '' }),
]

function mountBars(over: Record<string, unknown> = {}, tasks = TASKS, collapsed: string[] = []) {
  const layout = layoutOf(tasks, [], collapsed)
  return mount(GanttBars, {
    props: {
      tasks,
      scale: 'gun',
      range: RANGE,
      today: TODAY,
      selectedId: null,
      draggableIds: new Set<string>(),
      layout,
      window: windowOf(layout),
      ...over,
    },
  })
}

describe('çubuk katmanı (E-03C-29, 35, 36…41, 43, 47)', () => {
  it('görev çubukları durum tonuyla; tarihi bozuk görev çizilmez; süs katmanı', () => {
    const bars = mountBars()
    expect(bars.attributes('aria-hidden')).toBe('true')
    expect(bars.findAll('.gantt-bar').map((n) => n.attributes('data-work-item'))).toEqual([
      'a',
      'b',
    ])
    expect(bars.get('[data-work-item="a"]').classes()).toContain('gantt-bar--doing')
    expect(bars.get('[data-work-item="b"]').classes()).toContain('gantt-bar--review')
    expect(bars.find('[data-work-item="c"]').exists()).toBe(false)
  })

  it('çubuk metni başlık + süre (gün ölçeği "g"), plan genişliği tarihe göre', () => {
    const bars = mountBars()
    const a = bars.get('[data-work-item="a"]')
    expect(a.get('.gantt-bar__text').text()).toBe('Hidrofor kurulumu')
    expect(a.get('.gantt-bar__dur').text()).toBe('17 g')
    // 4 Kas → 20 Kas: x = 2*21, genişlik 17*21
    const plan = a.get('.gantt-bar__plan').attributes('d')!
    expect(plan.startsWith(`M${42 + 8},0`.replace(',0', ',10'))).toBe(true)
  })

  it('gecikmede taşma bölümü + ayırıcı + kesik kenar; gecikmesiz çubukta yok', () => {
    const bars = mountBars()
    const late = bars.get('[data-work-item="b"]')
    expect(late.find('.gantt-bar__over').exists()).toBe(true)
    expect(late.find('.gantt-bar__split').exists()).toBe(true)
    expect(late.find('.gantt-bar__late').exists()).toBe(true)
    const ok = bars.get('[data-work-item="a"]')
    expect(ok.find('.gantt-bar__over').exists()).toBe(false)
    expect(ok.find('.gantt-bar__late').exists()).toBe(false)
  })

  it('geç bitişte taşma var ama kesik kenar yok (yalnız gecikmede)', () => {
    const done = task({
      work_item_id: 'd',
      status: 'tamamlandi',
      start_on: '2026-11-03',
      end_on: '2026-11-05',
      completed_on: '2026-11-08',
      lateness: { ...task().lateness, is_completed_late: true, days_late: 3 },
    })
    const bars = mountBars({}, [done])
    expect(bars.find('.gantt-bar__over').exists()).toBe(true)
    expect(bars.find('.gantt-bar__late').exists()).toBe(false)
  })

  it('zincir simgesi yalnız bağımlı görevde', () => {
    const layout = layoutOf(TASKS, [
      { dependency_id: 'l', source: 'a', target: 'b', cross_department: false },
    ])
    const bars = mountBars({ layout, window: windowOf(layout) })
    expect(bars.get('[data-work-item="b"]').find('.gantt-bar__dep').exists()).toBe(true)
    expect(bars.get('[data-work-item="a"]').find('.gantt-bar__dep').exists()).toBe(false)
  })

  it('ölçeğe göre süre birimi: hafta "hf", ay "ay"', () => {
    const week = mountBars({ scale: 'hafta' })
    expect(week.get('[data-work-item="a"] .gantt-bar__dur').text()).toBe('2 hf')
    const month = mountBars({ scale: 'ay' }, [
      task({ work_item_id: 'a', start_on: '2026-11-02', end_on: '2026-12-05' }),
    ])
    // 34 gün ay ölçeğinde 68 px < 96: süre yazılmaz
    expect(month.find('.gantt-bar__dur').exists()).toBe(false)
  })

  it('uzun başlık kesilir, dar çubukta metin yok', () => {
    const long = task({
      work_item_id: 'a',
      title: 'Çok uzun bir görev başlığı '.repeat(4),
      start_on: '2026-11-03',
      end_on: '2026-11-08',
    })
    const text = mountBars({}, [long]).get('.gantt-bar__text').text()
    expect(text.endsWith('…')).toBe(true)
    const tiny = task({ work_item_id: 'a', start_on: '2026-11-03', end_on: '2026-11-03' })
    expect(mountBars({}, [tiny]).find('.gantt-bar__text').exists()).toBe(false)
  })

  it('grup izi: bitti oranı kadar dolu; kapalı grupta görev çubuğu yok', () => {
    const bars = mountBars()
    // d1 grubunda tarihli iki görev → iz var; d2 yalnız tarihsiz görev → iz yok
    expect(bars.findAll('.gantt-trace').map((n) => n.attributes('data-group'))).toEqual(['d1'])
    expect(bars.find('.gantt-trace__track').exists()).toBe(true)
    const closed = mountBars({}, TASKS, ['g:d1'])
    expect(closed.find('[data-work-item="a"]').exists()).toBe(false)
    expect(closed.find('[data-group="d1"]').exists()).toBe(true)
  })

  it('satır arka planı: seçili görev işaretli', () => {
    const bars = mountBars({ selectedId: 'a' })
    expect(bars.get('[data-row="a"] .gantt-bg').classes()).toContain('is-selected')
    expect(bars.get('[data-row="b"] .gantt-bg').classes()).not.toContain('is-selected')
  })

  it('tıklama görevi seçer; arka plana tıklama da', async () => {
    const bars = mountBars()
    await bars.get('[data-work-item="a"]').trigger('click')
    await bars.get('[data-row="b"] .gantt-bg').trigger('click')
    await bars.get('[data-row="g:d1"] .gantt-bg').trigger('click')
    expect(bars.emitted('select')).toEqual([['a'], ['b']])
  })
})

describe('seçim halkası ve tutamaçlar (E-03C-47)', () => {
  it('yalnız seçili + sürüklenebilir satırda iki tutamaç; üyede (sürüklenemez) yok', () => {
    const drag = mountBars({ selectedId: 'a', draggableIds: new Set(['a', 'b']) })
    expect(
      drag.findAll('[data-work-item="a"] [data-handle]').map((n) => n.attributes('data-handle')),
    ).toEqual(['start', 'end'])
    expect(drag.find('[data-work-item="b"] [data-handle]').exists()).toBe(false)
    expect(drag.find('[data-work-item="a"] .gantt-bar__ring').exists()).toBe(true)
    const member = mountBars({ selectedId: 'a', draggableIds: new Set<string>() })
    expect(member.find('[data-handle]').exists()).toBe(false)
    expect(member.find('.gantt-bar__ring').exists()).toBe(true)
  })

  it('tutamaç sürükleme edge-drag yayar (move → drop); tutamaç planlanan bitişte', () => {
    const bars = mountBars({ selectedId: 'a', draggableIds: new Set(['a']) })
    const hit = bars.get('[data-handle="end"] .gantt-handle__hit')
    const down = new MouseEvent('pointerdown', {
      clientX: 50,
      button: 0,
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(down, 'pointerId', { value: 7 })
    Object.defineProperty(down, 'pointerType', { value: 'mouse' })
    hit.element.dispatchEvent(down)
    const move = new MouseEvent('pointermove', { clientX: 50 + 21 * 2, bubbles: true })
    Object.defineProperty(move, 'pointerId', { value: 7 })
    hit.element.dispatchEvent(move)
    const up = new MouseEvent('pointerup', { clientX: 50 + 21 * 2, bubbles: true })
    Object.defineProperty(up, 'pointerId', { value: 7 })
    hit.element.dispatchEvent(up)
    const events = bars.emitted('edge-drag')!.map(([e]) => e)
    expect(events).toEqual([
      { workItemId: 'a', edge: 'end', phase: 'move', day: '2026-11-22' },
      { workItemId: 'a', edge: 'end', phase: 'drop', day: '2026-11-22' },
    ])
  })

  it('sürüklenebilir olmayan görevin tutamacı yoktur; zorlanan sürükleme olay üretmez', () => {
    const bars = mountBars({ selectedId: 'a', draggableIds: new Set<string>() })
    expect(bars.emitted('edge-drag')).toBeUndefined()
    expect(NAMES.size).toBe(2)
  })
})
