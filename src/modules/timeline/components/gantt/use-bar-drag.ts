/**
 * Çubuk ucu sürükleme çekirdeği (W92): işaretçiyi yakalar, güne yapıştırır ve `edge-drag`
 * olaylarını (`move` / `drop` / `cancel`) yayar. POLİTİKA YOKTUR — talep mi doğrudan yazma mı,
 * 5 sn gecikme, kimin sürükleyebildiği W95'in işidir (`capabilities.ts`, P8); burası yalnız
 * olayı üretir. Esc, işaretçi iptali ve bileşen sökülmesi `cancel` yayar. Başladığı yerde
 * bırakılan sürükleme değişiklik değildir, `drop` yerine `cancel` olur.
 */
import { onBeforeUnmount, ref, type Ref } from 'vue'

import { plannedEnd } from '../../model/dates'
import { snapEdgeDay } from '../../model/timeline'
import type { GanttTask } from '../../model/types'
import type { GanttDayRange, GanttEdge, GanttEdgeDrag, GanttScale } from '../index'

export interface DragPreview {
  workItemId: string
  edge: GanttEdge
  day: string
}

export interface BarDragOptions {
  range: () => GanttDayRange
  scale: () => GanttScale
  emit: (drag: GanttEdgeDrag) => void
}

/** Tek sürükleme oturumu: dinleyicileri kurar/söker, günü hesaplar, olayı yayar. */
class DragSession {
  lastDay: string

  constructor(
    private readonly options: BarDragOptions,
    private readonly preview: Ref<DragPreview | null>,
    private readonly done: () => void,
    private readonly task: GanttTask,
    private readonly edge: GanttEdge,
    private readonly startClientX: number,
    private readonly edgeX: number,
    private readonly target: Element,
    private readonly pointerId: number,
  ) {
    this.lastDay = this.originDay
    try {
      target.setPointerCapture(pointerId)
    } catch {
      // jsdom / eski tarayıcı: dinleyiciler hedef üzerinde yine çalışır.
    }
    target.addEventListener('pointermove', this.onMove as EventListener)
    target.addEventListener('pointerup', this.onUp as EventListener)
    target.addEventListener('pointercancel', this.abort)
    window.addEventListener('keydown', this.onKey)
  }

  get originDay(): string {
    return this.edge === 'start' ? this.task.start_on : plannedEnd(this.task)
  }

  /** İşaretçinin x'ine yapışan gün; başlangıç bitişi, bitiş başlangıcı aşamaz. */
  private dayFor(clientX: number): string {
    const x = this.edgeX + (clientX - this.startClientX)
    const day = snapEdgeDay(this.edge, x, this.options.range(), this.options.scale())
    if (this.edge === 'start') return day > plannedEnd(this.task) ? plannedEnd(this.task) : day
    return day < this.task.start_on ? this.task.start_on : day
  }

  private emitPhase(phase: GanttEdgeDrag['phase'], day: string): void {
    this.options.emit({ workItemId: this.task.work_item_id, edge: this.edge, phase, day })
  }

  private onMove = (event: PointerEvent): void => {
    const day = this.dayFor(event.clientX)
    if (day === this.lastDay) return
    this.lastDay = day
    this.preview.value = { workItemId: this.task.work_item_id, edge: this.edge, day }
    this.emitPhase('move', day)
  }

  private onUp = (event: PointerEvent): void => {
    this.onMove(event)
    this.release()
    this.emitPhase(this.lastDay === this.originDay ? 'cancel' : 'drop', this.lastDay)
  }

  abort = (): void => {
    this.release()
    this.emitPhase('cancel', this.originDay)
  }

  private onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.abort()
  }

  private release(): void {
    this.target.removeEventListener('pointermove', this.onMove as EventListener)
    this.target.removeEventListener('pointerup', this.onUp as EventListener)
    this.target.removeEventListener('pointercancel', this.abort)
    window.removeEventListener('keydown', this.onKey)
    try {
      this.target.releasePointerCapture(this.pointerId)
    } catch {
      // Yakalama zaten bırakılmış ya da desteklenmiyor.
    }
    this.preview.value = null
    this.done()
  }
}

export function useBarDrag(options: BarDragOptions) {
  const preview = ref<DragPreview | null>(null)
  let session: DragSession | null = null

  /** Tutamaçta `pointerdown`: `edgeX` ucun o anki x konumu (plot koordinatı). */
  function begin(event: PointerEvent, task: GanttTask, edge: GanttEdge, edgeX: number): void {
    if (session || (event.pointerType === 'mouse' && event.button !== 0)) return
    session = new DragSession(
      options,
      preview,
      () => (session = null),
      task,
      edge,
      event.clientX,
      edgeX,
      event.currentTarget as Element,
      event.pointerId,
    )
    event.preventDefault()
    event.stopPropagation()
  }

  onBeforeUnmount(() => session?.abort())

  return { preview, begin }
}
