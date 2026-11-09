/**
 * Çubuk ucu sürükleme (03c E-03C-47; `gantt-secimi.md` §7 `useEdgeDrag`): işaretçi yakalama,
 * güne yapışma ve bırakma. YALNIZ giriş katmanıdır: ne yazma ne politika bilir; `GanttEdgeDrag`
 * olaylarını (`move` / `drop` / `cancel`) yayar, tüketici (`useDateChange`) politikayı uygular.
 *
 *  - Tutamaçta `pointerdown` → `begin(event, …)`; yakalama tutamaçta, dinleyiciler pencerede.
 *  - Gün = taban gün + `round(dx / pxPerDay)`: ölçeğe göre piksel/gün çağıranın geometrisinden.
 *  - Başlangıç bitişi, bitiş başlangıcı AŞAMAZ (`applyEdge`).
 *  - `Esc` ya da `pointercancel` → `cancel`; hiç gün değişmeden bırakma da `cancel`'dır (istek
 *    doğurmaz, tıklama sürükleme sayılmaz).
 *  - Sahip (bileşen) sökülünce dinleyiciler kalkar, olay YAYILMAZ.
 * Tutamaç öğesi `touch-action: none` taşımalıdır (W92 çizimi); burada stil yoktur.
 */
import { getCurrentScope, onScopeDispose, shallowRef, type Ref } from 'vue'

import type { GanttEdge, GanttEdgeDrag } from '../components'
import { addDays, applyEdge } from '../model/date-change'

export interface EdgeDragStart {
  workItemId: string
  edge: GanttEdge
  /** Sürüklenen ucun bugünkü günü (`YYYY-MM-DD`). */
  day: string
  /** Karşı ucun günü: kısıt (başlangıç ≤ bitiş). */
  opposite: string
}

export interface EdgeDragOptions {
  /** Gün başına piksel (ölçeğe göre; > 0). */
  pxPerDay: () => number
  onDrag: (drag: GanttEdgeDrag) => void
}

interface Session extends EdgeDragStart {
  pointerId: number
  startX: number
  current: string
  target: Element | null
}

export function useEdgeDrag(options: EdgeDragOptions): {
  /** Sürükleme sürerken `{ workItemId, edge, day }`, aksi `null`. */
  active: Readonly<Ref<(Pick<Session, 'workItemId' | 'edge'> & { day: string }) | null>>
  begin: (event: PointerEvent, start: EdgeDragStart) => void
  cancel: () => void
} {
  const active = shallowRef<(Pick<Session, 'workItemId' | 'edge'> & { day: string }) | null>(null)
  let session: Session | null = null

  const emit = (phase: GanttEdgeDrag['phase'], s: Session): void =>
    options.onDrag({ workItemId: s.workItemId, edge: s.edge, phase, day: s.current })

  function dayAt(s: Session, clientX: number): string {
    const px = options.pxPerDay()
    const steps = px > 0 ? Math.round((clientX - s.startX) / px) : 0
    const raw = addDays(s.day, steps)
    if (raw === null) return s.current
    const range =
      s.edge === 'start' ? { start: s.day, end: s.opposite } : { start: s.opposite, end: s.day }
    const clamped = applyEdge(range, s.edge, raw)
    return clamped === null ? s.current : s.edge === 'start' ? clamped.start : clamped.end
  }

  function detach(): void {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('keydown', onKey, true)
    const s = session
    if (s?.target && 'releasePointerCapture' in s.target) {
      try {
        s.target.releasePointerCapture(s.pointerId)
      } catch {
        // Yakalama zaten bırakılmış olabilir.
      }
    }
    session = null
    active.value = null
  }

  function onMove(event: PointerEvent): void {
    const s = session
    if (!s || event.pointerId !== s.pointerId) return
    const next = dayAt(s, event.clientX)
    if (next === s.current) return
    s.current = next
    active.value = { workItemId: s.workItemId, edge: s.edge, day: next }
    emit('move', s)
  }

  function onUp(event: PointerEvent): void {
    const s = session
    if (!s || event.pointerId !== s.pointerId) return
    s.current = dayAt(s, event.clientX)
    const changed = s.current !== s.day
    detach()
    emit(changed ? 'drop' : 'cancel', changed ? s : { ...s, current: s.day })
  }

  function onCancel(event: PointerEvent): void {
    if (session && event.pointerId === session.pointerId) cancel()
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !session) return
    event.stopPropagation()
    cancel()
  }

  function cancel(): void {
    const s = session
    if (!s) return
    detach()
    emit('cancel', { ...s, current: s.day })
  }

  function begin(event: PointerEvent, start: EdgeDragStart): void {
    if (session) cancel()
    if (event.button !== 0 || event.isPrimary === false) return
    event.preventDefault()
    const target = event.currentTarget instanceof Element ? event.currentTarget : null
    session = {
      ...start,
      pointerId: event.pointerId,
      startX: event.clientX,
      current: start.day,
      target,
    }
    if (target && 'setPointerCapture' in target) {
      try {
        target.setPointerCapture(event.pointerId)
      } catch {
        // Yakalanamayan işaretçi (ör. sentetik olay): pencere dinleyicileri yeter.
      }
    }
    active.value = { workItemId: start.workItemId, edge: start.edge, day: start.day }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
  }

  // Sahip söküldü: dinleyiciler kalkar, olay yayılmaz.
  if (getCurrentScope()) onScopeDispose(detach)

  return { active, begin, cancel }
}
