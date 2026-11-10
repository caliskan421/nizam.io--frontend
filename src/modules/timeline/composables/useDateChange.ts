/**
 * Tarih değişimi akışı (03c E-03C-47, 67…72; P8, P18): Gantt'ın `edge-drag` olayını (ve
 * klavye adımını) yazma eylemine eşler ve **5 sn gecikmeli** gönderir. Politika yalnız
 * `model/capabilities.ts`'ten (`datePolicy`, `dateWriteFor`); burada rol dizesi yok. Gönderim
 * ve sonuç bildirimi `useDateSend`'de.
 *
 *  - Koordinatör → `requestDateChange` (talep); Admin → `extendWorkItem` (yalnız bitiş ileri
 *    1–90 gün) ya da `updateWorkItem`; Üye → tutamaç da klavye adımı da yok. Tamamlanmış görevde
 *    tutamaç yok (`canDragHandles`; extend 409 `work.item_completed`).
 *  - Gönderim öncesi 5 sn "İptal et" → istek HİÇ gitmez; gönderildikten sonra geri alma yok (P18).
 *    ✕ yalnız bildirimi gizler. Sahip sökülünce, kapsam ya da oturum değişince bekleyen gönderim
 *    iptal (`useDelayedSend`).
 *  - Aynı görevde art arda bırakma/klavye adımı tek bekleyen değişiklikte birleşir (`before`
 *    ilk durumdur). Başka görevdeki değişiklik önceki görevin 5 sn penceresini KESMEZ
 *    (CX-F3-Ö-01): görev başına ayrı süre/iptal; bildirim en son değişeni gösterir ve "İptal et"
 *    onu iptal eder (`useDelayedSend`). İyimser güncelleme yok: çubuk sunucu yanıtı + yeniden okumayla değişir.
 */
import { computed, shallowRef, type ComputedRef, type Ref } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import type { DateChangeSnackProps, GanttEdge, GanttEdgeDrag } from '../components'
import {
  canDragHandles,
  datePolicy,
  dateWriteFor,
  timelineActorFacts,
  type TimelineActorFacts,
} from '../model/capabilities'
import { applyEdge, sameRange, shiftEdge, type DayRange } from '../model/date-change'
import type { GanttFace, GanttTask } from '../model/types'
import { dragText, formatDay } from './drag-messages'
import { useDateSend, type DateChange } from './useDateSend'
import { useDelayedSend, type PendingSend } from './useDelayedSend'

export interface DateChangeOptions {
  /** Görünen görevler arasında kimlikle arama. */
  taskOf: (workItemId: string) => GanttTask | undefined
  /** Gantt yüzü (`ganttFace(scope)`); `null` → hiçbir şey yapılmaz. */
  face: () => GanttFace | null
  /** Sınama kancası: varsayılan `useStanding` + kapsam deposu. */
  actorFacts?: (face: GanttFace, task: GanttTask) => TimelineActorFacts
  delayMs?: number
}

export interface DateChangeSnackView {
  props: DateChangeSnackProps
  /** ✕ ile gizlendiyse `false` (gönderim sürer). */
  visible: boolean
}

export interface DateChangeApi {
  /** Sürüklenirken anlık uç (çubuk önizlemesi); yoksa `null`. */
  preview: Readonly<Ref<{ workItemId: string; edge: GanttEdge; day: string } | null>>
  /** Seçili satırda tutamaç çizilecek görevler (`GanttView.draggableIds`). */
  draggableIds: (tasks: readonly GanttTask[]) => ReadonlySet<string>
  /** `GanttView` `edge-drag` olayı. */
  onEdgeDrag: (drag: GanttEdgeDrag) => void
  /** Klavye adımı (Shift/Alt+Shift+→/←): sürükleme bırakmasıyla AYNI yol. `false` → izin yok. */
  nudge: (workItemId: string, edge: GanttEdge, delta: 1 | -1) => boolean
  snack: ComputedRef<DateChangeSnackView | null>
  /** Ekran okuyucu duyurusu (`aria-live`); her adımda yenilenir. */
  announcement: Readonly<Ref<string>>
  /** "İptal et": istek gitmez. */
  cancel: () => void
  /** ✕: yalnız bildirimi gizler. */
  dismiss: () => void
}

type Plan = { kind: 'refuse' } | { kind: 'revert' } | { kind: 'schedule'; change: DateChange }

/** Bırakma / adım → bekleyen değişiklik kararı (saf). `held`: aynı görevde bekleyen. */
function plan(
  task: GanttTask,
  facts: TimelineActorFacts,
  held: DateChange | null,
  pick: (base: DayRange) => DayRange | null,
): Plan {
  if (!canDragHandles({ ...facts, completed: task.status === 'tamamlandi' })) {
    return { kind: 'refuse' }
  }
  const before: DayRange = held?.before ?? { start: task.start_on, end: task.end_on }
  const after = pick(held?.after ?? before)
  if (after === null) return { kind: 'refuse' }
  if (sameRange(after, before)) return held ? { kind: 'revert' } : { kind: 'refuse' }
  const policy = datePolicy(facts)
  const write = dateWriteFor(
    policy,
    { start_on: before.start, end_on: before.end },
    { start_on: after.start, end_on: after.end },
  )
  if (write === null) return { kind: 'refuse' }
  const target = { programId: task.program_id, departmentId: task.department_id }
  return {
    kind: 'schedule',
    change: {
      workItemId: task.work_item_id,
      title: task.title,
      policy,
      write,
      before,
      after,
      datesRevision: held?.datesRevision ?? task.dates_revision,
      target,
    },
  }
}

function announce(change: DateChange, edge: GanttEdge): string {
  const key = edge === 'start' ? 'timeline.drag.announce.start' : 'timeline.drag.announce.end'
  const date = formatDay(edge === 'start' ? change.after.start : change.after.end)
  const pending = dragText('timeline.drag.announce.pending', { title: change.title })
  return `${dragText(key, { title: change.title, date })} ${pending}`
}

/** Tutamaç çizilecek görevler (yüz yoksa hiçbiri). */
function draggable(
  tasks: readonly GanttTask[],
  face: GanttFace | null,
  factsOf: (face: GanttFace, task: GanttTask) => TimelineActorFacts,
): ReadonlySet<string> {
  const ok = (t: GanttTask): boolean =>
    face !== null && canDragHandles({ ...factsOf(face, t), completed: t.status === 'tamamlandi' })
  return new Set(tasks.filter(ok).map((t) => t.work_item_id))
}

function snackView(p: PendingSend<DateChange> | null): DateChangeSnackView | null {
  if (!p) return null
  const { payload } = p
  return {
    visible: p.visible,
    props: {
      // `face` YAZMA YOLUNU taşır: talep → coordinator, doğrudan → admin.
      face: payload.policy === 'request' ? 'coordinator' : 'admin',
      title: payload.title,
      before: payload.before,
      after: payload.after,
      remainingMs: p.remainingMs,
      totalMs: p.totalMs,
    },
  }
}

export function useDateChange(options: DateChangeOptions): DateChangeApi {
  const store = useScopeStore()
  const standing = options.actorFacts ? null : useStanding().standing
  const delayed = useDelayedSend<DateChange>({ send: useDateSend(), delayMs: options.delayMs })
  const preview = shallowRef<{ workItemId: string; edge: GanttEdge; day: string } | null>(null)
  const announcement = shallowRef('')

  const factsOf = (face: GanttFace, task: GanttTask): TimelineActorFacts =>
    options.actorFacts
      ? options.actorFacts(face, task)
      : timelineActorFacts(standing!.value, store.snapshot, face, task.department_id)

  function stage(
    task: GanttTask,
    face: GanttFace,
    edge: GanttEdge,
    pick: (base: DayRange) => DayRange | null,
  ): boolean {
    // Bekleyen, gösterilen değil ANAHTARIN bekleyenidir (başka görevin bildirimi öndeyken de).
    const held = delayed.peek(task.work_item_id)?.payload ?? null
    const result = plan(task, factsOf(face, task), held, pick)
    if (result.kind === 'schedule') {
      delayed.schedule(task.work_item_id, result.change)
      announcement.value = announce(result.change, edge)
    } else if (result.kind === 'revert') {
      delayed.cancel(task.work_item_id)
      announcement.value = dragText('timeline.drag.announce.cancelled', { title: task.title })
    }
    return result.kind !== 'refuse'
  }

  function onEdgeDrag(drag: GanttEdgeDrag): void {
    preview.value =
      drag.phase === 'move' ? { workItemId: drag.workItemId, edge: drag.edge, day: drag.day } : null
    if (drag.phase !== 'drop') return
    const [face, task] = [options.face(), options.taskOf(drag.workItemId)]
    if (face !== null && task)
      stage(task, face, drag.edge, (b) => applyEdge(b, drag.edge, drag.day))
  }

  function nudge(workItemId: string, edge: GanttEdge, delta: 1 | -1): boolean {
    const [face, task] = [options.face(), options.taskOf(workItemId)]
    return face !== null && !!task && stage(task, face, edge, (b) => shiftEdge(b, edge, delta))
  }

  function cancel(): void {
    const p = delayed.pending.value
    if (delayed.cancel() && p) {
      announcement.value = dragText('timeline.drag.announce.cancelled', { title: p.payload.title })
    }
  }

  const snack = computed(() => snackView(delayed.pending.value))
  const draggableIds = (tasks: readonly GanttTask[]) => draggable(tasks, options.face(), factsOf)
  return {
    preview,
    draggableIds,
    onEdgeDrag,
    nudge,
    snack,
    announcement,
    cancel,
    dismiss: delayed.dismiss,
  }
}
