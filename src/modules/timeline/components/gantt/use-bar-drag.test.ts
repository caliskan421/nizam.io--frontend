import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { task } from '../../model/__tests__/gantt-fixtures'
import type { GanttEdgeDrag } from '../index'
import { useBarDrag } from './use-bar-drag'

const RANGE = { start: '2026-11-02', end: '2026-12-06' }
const T = task({ start_on: '2026-11-04', end_on: '2026-11-10' }) // plan x: 42 → 189

function setup() {
  const events: GanttEdgeDrag[] = []
  let api!: ReturnType<typeof useBarDrag>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useBarDrag({ range: () => RANGE, scale: () => 'gun', emit: (e) => events.push(e) })
        return () => h('div')
      },
    }),
    { attachTo: document.body },
  )
  const handle = document.createElement('div')
  document.body.append(handle)
  function down(edge: 'start' | 'end', clientX = 100, over: Partial<PointerEventInit> = {}) {
    const event = new MouseEvent('pointerdown', {
      clientX,
      button: 0,
      cancelable: true,
      bubbles: true,
    })
    Object.defineProperty(event, 'pointerId', { value: 1 })
    Object.defineProperty(event, 'pointerType', { value: over.pointerType ?? 'mouse' })
    Object.defineProperty(event, 'currentTarget', { value: handle })
    api.begin(event as PointerEvent, T, edge, edge === 'start' ? 42 : 189)
    return event
  }
  const fire = (type: string, clientX: number) => {
    const event = new MouseEvent(type, { clientX, bubbles: true })
    Object.defineProperty(event, 'pointerId', { value: 1 })
    handle.dispatchEvent(event)
  }
  return { events, api, wrapper, handle, down, fire }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('uç sürükleme çekirdeği (olay üretir, politika yok)', () => {
  it('bitiş ucu: move günler boyunca, drop güne yapışık tarihle', () => {
    const { events, down, fire, api } = setup()
    expect(down('end').defaultPrevented).toBe(true)
    fire('pointermove', 100 + 42) // +2 gün
    expect(events.at(-1)).toEqual({
      workItemId: 'w1',
      edge: 'end',
      phase: 'move',
      day: '2026-11-12',
    })
    expect(api.preview.value).toEqual({ workItemId: 'w1', edge: 'end', day: '2026-11-12' })
    fire('pointermove', 100 + 42) // aynı gün: yeni olay yok
    expect(events).toHaveLength(1)
    fire('pointerup', 100 + 63) // +3 gün
    expect(events.map((e) => e.phase)).toEqual(['move', 'move', 'drop'])
    expect(events.at(-1)).toMatchObject({ phase: 'drop', day: '2026-11-13' })
    expect(api.preview.value).toBeNull()
  })

  it('başlangıç ucu: gün sol kenarına yapışır, bitişi aşamaz', () => {
    const { events, down, fire } = setup()
    down('start')
    fire('pointermove', 100 - 21)
    expect(events.at(-1)).toMatchObject({ edge: 'start', day: '2026-11-03' })
    fire('pointermove', 100 + 9999)
    expect(events.at(-1)).toMatchObject({ day: '2026-11-10' })
  })

  it('bitiş başlangıcın altına inemez', () => {
    const { events, down, fire } = setup()
    down('end')
    fire('pointermove', 100 - 9999)
    expect(events.at(-1)).toMatchObject({ edge: 'end', day: '2026-11-04' })
  })

  it('başladığı yerde bırakmak değişiklik değil: cancel', () => {
    const { events, down, fire } = setup()
    down('end')
    fire('pointerup', 100)
    expect(events).toEqual([{ workItemId: 'w1', edge: 'end', phase: 'cancel', day: '2026-11-10' }])
  })

  it('Esc ve işaretçi iptali cancel yayar, sonraki hareket olay üretmez', () => {
    const { events, down, fire } = setup()
    down('end')
    fire('pointermove', 100 + 21)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(events.at(-1)).toEqual({
      workItemId: 'w1',
      edge: 'end',
      phase: 'cancel',
      day: '2026-11-10',
    })
    const count = events.length
    fire('pointermove', 100 + 99)
    fire('pointerup', 100 + 99)
    expect(events).toHaveLength(count)
    down('start')
    fire('pointercancel', 100)
    expect(events.at(-1)?.phase).toBe('cancel')
  })

  it('bileşen sökülürken bekleyen sürükleme iptal edilir', () => {
    const { events, down, fire, wrapper } = setup()
    down('end')
    fire('pointermove', 100 + 21)
    wrapper.unmount()
    expect(events.at(-1)?.phase).toBe('cancel')
  })

  it('fare sağ düğmesi ve ikinci eşzamanlı sürükleme yok sayılır', () => {
    const { events, api, handle } = setup()
    const right = new MouseEvent('pointerdown', { button: 2, cancelable: true })
    Object.defineProperty(right, 'pointerType', { value: 'mouse' })
    Object.defineProperty(right, 'currentTarget', { value: handle })
    api.begin(right as PointerEvent, T, 'end', 189)
    expect(right.defaultPrevented).toBe(false)
    expect(events).toEqual([])
  })
})
