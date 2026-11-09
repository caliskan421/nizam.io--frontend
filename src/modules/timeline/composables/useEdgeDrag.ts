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

export interface ActiveDrag {
  workItemId: string
  edge: GanttEdge
  day: string
}

interface Session extends EdgeDragStart {
  pointerId: number
  startX: number
  current: string
  target: Element | null
}

/** İşaretçinin `clientX`'indeki güne yapışmış tarih (kısıtlı). */
function dayAt(s: Session, px: number, clientX: number): string {
  const steps = px > 0 ? Math.round((clientX - s.startX) / px) : 0
  const raw = addDays(s.day, steps)
  if (raw === null) return s.current
  const range =
    s.edge === 'start' ? { start: s.day, end: s.opposite } : { start: s.opposite, end: s.day }
  const clamped = applyEdge(range, s.edge, raw)
  return clamped === null ? s.current : s.edge === 'start' ? clamped.start : clamped.end
}

const dragOf = (phase: GanttEdgeDrag['phase'], s: Session, day: string): GanttEdgeDrag => ({
  workItemId: s.workItemId,
  edge: s.edge,
  phase,
  day,
})

const ownerOf = (s: Session | null, e: PointerEvent): Session | null =>
  s && e.pointerId === s.pointerId ? s : null

function setCapture(target: Element | null, pointerId: number, on: boolean): void {
  const method = on ? 'setPointerCapture' : 'releasePointerCapture'
  // jsdom'da yakalama API'si yok; gerçek tarayıcıda zaten bırakılmış olabilir.
  if (!target || typeof target[method] !== 'function') return
  try {
    target[method](pointerId)
  } catch {
    // Yakalanamayan / zaten bırakılmış işaretçi: pencere dinleyicileri yeter.
  }
}

interface Handlers {
  move: (e: PointerEvent) => void
  up: (e: PointerEvent) => void
  cancel: () => void
  key: (e: KeyboardEvent) => void
}

/** Pencere dinleyicilerini kurar; kaldıran işlev döner. */
function listen(h: Handlers): () => void {
  window.addEventListener('pointermove', h.move)
  window.addEventListener('pointerup', h.up)
  window.addEventListener('pointercancel', h.cancel)
  window.addEventListener('keydown', h.key, true)
  return () => {
    window.removeEventListener('pointermove', h.move)
    window.removeEventListener('pointerup', h.up)
    window.removeEventListener('pointercancel', h.cancel)
    window.removeEventListener('keydown', h.key, true)
  }
}

export function useEdgeDrag(options: EdgeDragOptions): {
  /** Sürükleme sürerken `{ workItemId, edge, day }`, aksi `null`. */
  active: Readonly<Ref<ActiveDrag | null>>
  begin: (event: PointerEvent, start: EdgeDragStart) => void
  cancel: () => void
} {
  const active = shallowRef<ActiveDrag | null>(null)
  let session: Session | null = null
  let unlisten = (): void => {}

  const emit = (phase: GanttEdgeDrag['phase'], s: Session, day = s.current): void =>
    options.onDrag(dragOf(phase, s, day))

  function detach(): Session | null {
    const s = session
    unlisten()
    if (s) setCapture(s.target, s.pointerId, false)
    session = null
    active.value = null
    return s
  }

  function cancel(): void {
    const s = detach()
    if (s) emit('cancel', s, s.day)
  }

  function onMove(event: PointerEvent): void {
    const s = ownerOf(session, event)
    if (!s) return
    const next = dayAt(s, options.pxPerDay(), event.clientX)
    if (next === s.current) return
    s.current = next
    active.value = { workItemId: s.workItemId, edge: s.edge, day: next }
    emit('move', s)
  }

  function onUp(event: PointerEvent): void {
    const s = ownerOf(session, event)
    if (!s) return
    const day = dayAt(s, options.pxPerDay(), event.clientX)
    detach()
    emit(day === s.day ? 'cancel' : 'drop', s, day)
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !session) return
    event.stopPropagation()
    cancel()
  }

  function begin(event: PointerEvent, start: EdgeDragStart): void {
    if (session) cancel()
    if (event.button !== 0 || event.isPrimary === false) return
    event.preventDefault()
    const target = event.currentTarget instanceof Element ? event.currentTarget : null
    const [pointerId, startX] = [event.pointerId, event.clientX]
    session = { ...start, pointerId, startX, current: start.day, target }
    setCapture(target, pointerId, true)
    active.value = { workItemId: start.workItemId, edge: start.edge, day: start.day }
    unlisten = listen({ move: onMove, up: onUp, cancel, key: onKey })
  }

  if (getCurrentScope()) onScopeDispose(() => void detach())

  return { active, begin, cancel }
}
