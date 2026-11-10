import { describe, expect, it, vi } from 'vitest'

import { useGanttKeyboard, type DateKeyRequest, type KeyRow } from './useGanttKeyboard'

const ROWS: KeyRow[] = [
  { kind: 'group', key: 'g:a', open: true },
  { kind: 'task', key: 't1', groupKey: 'g:a' },
  { kind: 'task', key: 't2', groupKey: 'g:a' },
  { kind: 'group', key: 'g:b', open: false },
]

function setup(extra: Partial<Parameters<typeof useGanttKeyboard>[0]> = {}) {
  const calls = {
    focus: vi.fn<(i: number) => void>(),
    open: vi.fn<(key: string, open: boolean) => void>(),
    select: vi.fn<(id: string) => void>(),
  }
  const kb = useGanttKeyboard({
    rows: () => ROWS,
    pageSize: () => 2,
    focusRow: calls.focus,
    setGroupOpen: calls.open,
    select: calls.select,
    ...extra,
  })
  function press(key: string, index: number, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init })
    kb.onKeydown(event, index)
    return event
  }
  return { calls, press }
}

describe('Gantt klavye gezinmesi (treegrid)', () => {
  it('↑ ↓ bir satır; uçlarda kenetlenir', () => {
    const { calls, press } = setup()
    expect(press('ArrowDown', 1).defaultPrevented).toBe(true)
    expect(calls.focus).toHaveBeenLastCalledWith(2)
    press('ArrowDown', 3)
    expect(calls.focus).toHaveBeenLastCalledWith(3)
    press('ArrowUp', 1)
    expect(calls.focus).toHaveBeenLastCalledWith(0)
    press('ArrowUp', 0)
    expect(calls.focus).toHaveBeenLastCalledWith(0)
  })

  it('PageDown/PageUp sayfa adımı; Home/End uçlar', () => {
    const { calls, press } = setup()
    press('PageDown', 0)
    expect(calls.focus).toHaveBeenLastCalledWith(2)
    press('PageDown', 2)
    expect(calls.focus).toHaveBeenLastCalledWith(3)
    press('PageUp', 3)
    expect(calls.focus).toHaveBeenLastCalledWith(1)
    press('Home', 2)
    expect(calls.focus).toHaveBeenLastCalledWith(0)
    press('End', 0)
    expect(calls.focus).toHaveBeenLastCalledWith(3)
  })

  it('→ kapalı grubu açar, açık grupta ilk görevine geçer; ← açık grubu kapatır', () => {
    const { calls, press } = setup()
    expect(press('ArrowRight', 3).defaultPrevented).toBe(true)
    expect(calls.open).toHaveBeenLastCalledWith('g:b', true)
    press('ArrowRight', 0)
    expect(calls.focus).toHaveBeenLastCalledWith(1)
    press('ArrowLeft', 0)
    expect(calls.open).toHaveBeenLastCalledWith('g:a', false)
  })

  it('← görevde üst gruba geçer; → görevde ve ← kapalı grupta işlenmez', () => {
    const { calls, press } = setup()
    press('ArrowLeft', 2)
    expect(calls.focus).toHaveBeenLastCalledWith(0)
    calls.focus.mockClear()
    expect(press('ArrowRight', 1).defaultPrevented).toBe(false)
    expect(press('ArrowLeft', 3).defaultPrevented).toBe(false)
    expect(calls.focus).not.toHaveBeenCalled()
    expect(calls.open).not.toHaveBeenCalled()
  })

  it('Enter/Boşluk: görevde seçer, grupta açıp kapatır', () => {
    const { calls, press } = setup()
    press('Enter', 1)
    expect(calls.select).toHaveBeenLastCalledWith('t1')
    press(' ', 2)
    expect(calls.select).toHaveBeenLastCalledWith('t2')
    press('Enter', 0)
    expect(calls.open).toHaveBeenLastCalledWith('g:a', false)
    press(' ', 3)
    expect(calls.open).toHaveBeenLastCalledWith('g:b', true)
  })

  it('tanınmayan tuş, Ctrl/Meta birleşimi ve olmayan satır işlenmez', () => {
    const { calls, press } = setup()
    expect(press('a', 1).defaultPrevented).toBe(false)
    expect(press('ArrowDown', 1, { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(press('ArrowDown', 1, { metaKey: true }).defaultPrevented).toBe(false)
    expect(press('ArrowDown', 99).defaultPrevented).toBe(false)
    expect(press('Enter', 1, { altKey: true }).defaultPrevented).toBe(false)
    expect(calls.focus).not.toHaveBeenCalled()
  })
})

describe('tarih kısayolu uzantı noktası (W95)', () => {
  it('onDateKey yokken Shift+→/← hiçbir şey yapmaz, olay tarayıcıya kalır', () => {
    const { calls, press } = setup()
    expect(press('ArrowRight', 1, { shiftKey: true }).defaultPrevented).toBe(false)
    expect(press('ArrowLeft', 1, { shiftKey: true, altKey: true }).defaultPrevented).toBe(false)
    expect(calls.focus).not.toHaveBeenCalled()
    expect(calls.open).not.toHaveBeenCalled()
  })

  it('Shift bitişi, Alt+Shift başlangıcı ±1 gün ister; yalnız görev satırında', () => {
    const onDateKey = vi.fn<(r: DateKeyRequest) => boolean | void>()
    const { press } = setup({ onDateKey })
    expect(press('ArrowRight', 1, { shiftKey: true }).defaultPrevented).toBe(true)
    expect(onDateKey).toHaveBeenLastCalledWith({ workItemId: 't1', edge: 'end', days: 1 })
    press('ArrowLeft', 2, { shiftKey: true, altKey: true })
    expect(onDateKey).toHaveBeenLastCalledWith({ workItemId: 't2', edge: 'start', days: -1 })
    onDateKey.mockClear()
    expect(press('ArrowRight', 0, { shiftKey: true }).defaultPrevented).toBe(false)
    expect(onDateKey).not.toHaveBeenCalled()
  })

  it('onDateKey false dönerse (ör. üye yüzü) olay işlenmemiş sayılır', () => {
    const { press } = setup({ onDateKey: () => false })
    expect(press('ArrowRight', 1, { shiftKey: true }).defaultPrevented).toBe(false)
  })
})
