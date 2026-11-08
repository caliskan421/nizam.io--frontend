/**
 * Klavye ile grup içi odak gezinmesi (segment, sekme, menü): ok tuşları, Home/End. Devre dışı
 * öğeler atlanır; uçlarda başa/sona sarar. Tuş işlendiyse hedef öğeyi döndürür.
 */
export type RovingAxis = 'horizontal' | 'vertical'

const KEYS: Record<RovingAxis, { prev: string; next: string }> = {
  horizontal: { prev: 'ArrowLeft', next: 'ArrowRight' },
  vertical: { prev: 'ArrowUp', next: 'ArrowDown' },
}

export function rovingTarget(
  event: KeyboardEvent,
  items: readonly HTMLElement[],
  axis: RovingAxis,
): HTMLElement | null {
  const enabled = items.filter((el) => !(el as HTMLButtonElement).disabled)
  if (enabled.length === 0) return null
  const current = enabled.indexOf(document.activeElement as HTMLElement)
  const { prev, next } = KEYS[axis]
  let index: number
  if (event.key === next) index = current < 0 ? 0 : (current + 1) % enabled.length
  else if (event.key === prev)
    index = current < 0 ? enabled.length - 1 : (current - 1 + enabled.length) % enabled.length
  else if (event.key === 'Home') index = 0
  else if (event.key === 'End') index = enabled.length - 1
  else return null
  event.preventDefault()
  const target = enabled[index] ?? null
  target?.focus()
  return target
}
