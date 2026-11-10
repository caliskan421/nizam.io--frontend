import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'

import { ADMIN_SCOPE, ganttTask, harness, MEMBER_SCOPE, resetHarness } from '../__tests__/harness'
import type { GanttFace } from '../model/types'
import { useDateChange } from './useDateChange'
import { dateKeyBinding, useGanttKeyboard, type KeyRow } from './useGanttKeyboard'

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] }))
afterEach(() => {
  vi.useRealTimers()
  resetHarness()
  if (authSession.snapshot.accountId) authSession.clear()
})

const ROWS: KeyRow[] = [
  { kind: 'group', key: 'g', open: true },
  { kind: 'task', key: 'w1', groupKey: 'g' },
]

function setup(face: GanttFace, canAct: boolean) {
  const h = harness(face === 'member' ? MEMBER_SCOPE : ADMIN_SCOPE)
  const task = ganttTask()
  const dc = h.run(() =>
    useDateChange({
      taskOf: (id) => (id === 'w1' ? task : undefined),
      face: () => face,
      actorFacts: (f) => ({ face: f, companyAdmin: canAct, coordinator: false, member: !canAct }),
    }),
  )
  const kb = useGanttKeyboard({
    rows: () => ROWS,
    pageSize: () => 2,
    focusRow: vi.fn(),
    setGroupOpen: vi.fn(),
    select: vi.fn(),
    onDateKey: dateKeyBinding(dc.nudge),
  })
  const press = (init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, ...init })
    kb.onKeydown(event, 1)
    return event
  }
  return { dc, press }
}

describe('klavye tarih bağlayıcısı (onDateKey → nudge)', () => {
  it('yetkili yüzde Shift+→ bırakmayla aynı bekleyen değişikliği kurar (bitiş +1)', () => {
    const { dc, press } = setup('admin', true)
    expect(press({ shiftKey: true }).defaultPrevented).toBe(true)
    expect(dc.snack.value?.props.after).toEqual({ start: '2026-11-01', end: '2026-11-11' })
  })

  it('Alt+Shift başlangıcı oynatır', () => {
    const { dc, press } = setup('admin', true)
    press({ shiftKey: true, altKey: true })
    expect(dc.snack.value?.props.after.start).toBe('2026-11-02')
  })

  it('üyede tarih kısayolu yok: olay işlenmez, bekleyen değişiklik doğmaz', () => {
    const { dc, press } = setup('member', false)
    expect(press({ shiftKey: true }).defaultPrevented).toBe(false)
    expect(dc.snack.value).toBeNull()
  })
})
