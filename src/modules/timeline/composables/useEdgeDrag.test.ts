import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import type { GanttEdgeDrag } from '../components'
import { useEdgeDrag, type EdgeDragStart } from './useEdgeDrag'

const START: EdgeDragStart = {
  workItemId: 'w1',
  edge: 'end',
  day: '2026-09-10',
  opposite: '2026-06-22',
}

function pointer(
  type: string,
  init: { clientX?: number; pointerId?: number; button?: number } = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent
  Object.assign(event, { pointerId: 1, clientX: 0, button: 0, isPrimary: true, ...init })
  return event
}

function setup(pxPerDay = 21) {
  const events: GanttEdgeDrag[] = []
  let api!: ReturnType<typeof useEdgeDrag>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useEdgeDrag({ pxPerDay: () => pxPerDay, onDrag: (d) => events.push(d) })
        return () => h('button', { type: 'button', id: 'handle' })
      },
    }),
    { attachTo: document.body },
  )
  const handle = wrapper.element as HTMLElement
  const capture = vi.fn()
  const release = vi.fn()
  Object.assign(handle, { setPointerCapture: capture, releasePointerCapture: release })
  const down = (x: number, start: EdgeDragStart = START) => {
    const event = pointer('pointerdown', { clientX: x })
    Object.defineProperty(event, 'currentTarget', { value: handle })
    api.begin(event, start)
    return event
  }
  return { api, events, wrapper, handle, down, capture, release }
}

afterEach(() => document.body.replaceChildren())

describe('useEdgeDrag', () => {
  it('işaretçiyi yakalar, güne yapışarak move yayar, bırakınca drop', () => {
    const t = setup(21)
    const down = t.down(100)
    expect(down.defaultPrevented).toBe(true)
    expect(t.capture).toHaveBeenCalledWith(1)
    window.dispatchEvent(pointer('pointermove', { clientX: 100 + 10 })) // 0.48 gün → 0
    expect(t.events).toEqual([])
    window.dispatchEvent(pointer('pointermove', { clientX: 100 + 21 * 3 + 4 })) // 3 gün
    window.dispatchEvent(pointer('pointermove', { clientX: 100 + 21 * 3 + 5 })) // aynı gün: yeni olay yok
    expect(t.events).toEqual([{ workItemId: 'w1', edge: 'end', phase: 'move', day: '2026-09-13' }])
    expect(t.api.active.value).toEqual({ workItemId: 'w1', edge: 'end', day: '2026-09-13' })
    window.dispatchEvent(pointer('pointerup', { clientX: 100 + 21 * 21 }))
    expect(t.events.at(-1)).toEqual({
      workItemId: 'w1',
      edge: 'end',
      phase: 'drop',
      day: '2026-10-01',
    })
    expect(t.api.active.value).toBeNull()
    expect(t.release).toHaveBeenCalledWith(1)
  })

  it('gün sayısı ölçeğin piksel/gün değerinden (hafta ölçeği daha sık)', () => {
    const t = setup(4)
    t.down(0)
    window.dispatchEvent(pointer('pointerup', { clientX: 40 }))
    expect(t.events.at(-1)).toMatchObject({ phase: 'drop', day: '2026-09-20' })
  })

  it('bitiş başlangıcın, başlangıç bitişin ötesine geçemez', () => {
    const t = setup(1)
    t.down(0)
    window.dispatchEvent(pointer('pointerup', { clientX: -500 }))
    expect(t.events.at(-1)).toMatchObject({ phase: 'drop', day: '2026-06-22' })
    const s = setup(1)
    s.down(0, { ...START, edge: 'start', day: '2026-06-22', opposite: '2026-09-10' })
    window.dispatchEvent(pointer('pointerup', { clientX: 500 }))
    expect(s.events.at(-1)).toMatchObject({ edge: 'start', phase: 'drop', day: '2026-09-10' })
  })

  it('gün değişmeden bırakma (tıklama) cancel — istek doğurmaz', () => {
    const t = setup(21)
    t.down(50)
    window.dispatchEvent(pointer('pointerup', { clientX: 52 }))
    expect(t.events).toEqual([
      { workItemId: 'w1', edge: 'end', phase: 'cancel', day: '2026-09-10' },
    ])
  })

  it('Esc ve pointercancel iptal eder; sonraki hareket yok sayılır', () => {
    const t = setup(21)
    t.down(0)
    window.dispatchEvent(pointer('pointermove', { clientX: 63 }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(t.events.map((e) => e.phase)).toEqual(['move', 'cancel'])
    expect(t.events.at(-1)?.day).toBe('2026-09-10')
    window.dispatchEvent(pointer('pointermove', { clientX: 200 }))
    window.dispatchEvent(pointer('pointerup', { clientX: 200 }))
    expect(t.events).toHaveLength(2)
    t.down(0)
    window.dispatchEvent(pointer('pointercancel'))
    expect(t.events.at(-1)?.phase).toBe('cancel')
  })

  it('yalnız birincil düğme; başka işaretçi kimliği yok sayılır', () => {
    const t = setup(21)
    const right = pointer('pointerdown', { button: 2 })
    t.api.begin(right, START)
    expect(t.api.active.value).toBeNull()
    t.down(0)
    window.dispatchEvent(pointer('pointermove', { clientX: 100, pointerId: 9 }))
    window.dispatchEvent(pointer('pointerup', { clientX: 100, pointerId: 9 }))
    expect(t.events).toEqual([])
    expect(t.api.active.value).not.toBeNull()
  })

  it('sahip sökülünce dinleyiciler kalkar ve olay yayılmaz', () => {
    const t = setup(21)
    t.down(0)
    t.wrapper.unmount()
    window.dispatchEvent(pointer('pointermove', { clientX: 100 }))
    window.dispatchEvent(pointer('pointerup', { clientX: 100 }))
    expect(t.events).toEqual([])
  })
})
