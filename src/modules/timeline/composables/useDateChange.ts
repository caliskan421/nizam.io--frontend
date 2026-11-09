/**
 * Tarih değişimi akışı (03c E-03C-47, 67…72; P8, P18): Gantt'ın `edge-drag` olayını (ve
 * klavye adımını) yazma eylemine eşler ve **5 sn gecikmeli** gönderir. Politika yalnız
 * `model/capabilities.ts`'ten (`datePolicy`, `dateWriteFor`); burada rol dizesi yok.
 *
 *  - Koordinatör → `requestDateChange` (talep); Admin → `extendWorkItem` (yalnız bitiş ileri
 *    1–90 gün) ya da `updateWorkItem` (önce taze `getWorkItem` → `dates_revision`); Üye →
 *    tutamaç da klavye adımı da yok. Tamamlanmış görevde tutamaç yok (`canDragHandles`).
 *  - Gönderim öncesi 5 sn "İptal et" → istek HİÇ gitmez; gönderildikten sonra geri alma yok (P18).
 *    ✕ yalnız bildirimi gizler. Sahip sökülünce, kapsam ya da oturum değişince bekleyen gönderim
 *    iptal (`useDelayedSend`).
 *  - İyimser güncelleme yok: çubuk sunucu yanıtı + yeniden okumayla değişir. Sonuç bilinmiyorsa
 *    kör tekrar yok (sarmalayıcı Gantt/görev/talebi yeniden okur); bildirim ortak
 *    `notifyOutcome`'dan.
 *  - `updateWorkItem` yolu: taze görevin tarihleri sürüklemenin `before`'undan farklıysa (başkası
 *    değiştirdi) YAZILMAZ, kullanıcı bilgilendirilir.
 */
import { useQueryClient } from '@tanstack/vue-query'
import { computed, shallowRef, type ComputedRef, type Ref } from 'vue'

import { fetchWorkItem } from '@/modules/work/public'
import { ApiError } from '@/shared/errors/api-error'
import type { ActionContext, MutationOutcome } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome, outcomeText } from '@/shared/ui/confirm'

import { useExtendWorkItem, useRequestDateChange, useUpdateWorkItemDates } from '../api'
import type { DateChangeSnackProps, GanttEdge, GanttEdgeDrag } from '../components'
import {
  canDragHandles,
  datePolicy,
  dateWriteFor,
  timelineActorFacts,
  type DatePolicy,
  type DateWrite,
  type TimelineActorFacts,
} from '../model/capabilities'
import { applyEdge, sameRange, shiftEdge, type DayRange } from '../model/date-change'
import type { GanttFace, GanttTask } from '../model/types'
import { dragText, formatDay } from './drag-messages'
import { useDelayedSend } from './useDelayedSend'

export interface DateChangeOptions {
  /** Görünen görevler arasında kimlikle arama. */
  taskOf: (workItemId: string) => GanttTask | undefined
  /** Gantt yüzü (`ganttFace(scope)`); `null` → hiçbir şey yapılmaz. */
  face: () => GanttFace | null
  /** Sınama kancası: varsayılan `useStanding` + kapsam deposu. */
  actorFacts?: (face: GanttFace, task: GanttTask) => TimelineActorFacts
  delayMs?: number
}

/** Bekleyen değişikliğin yükü. */
interface DateChange {
  workItemId: string
  title: string
  policy: DatePolicy
  write: DateWrite
  before: DayRange
  after: DayRange
  target: { programId: string; departmentId: string }
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

export function useDateChange(options: DateChangeOptions): DateChangeApi {
  const store = useScopeStore()
  const queryClient = useQueryClient()
  const toast = useToast() // sahip yaşamını bilir (KESİN 26a)
  const standing = options.actorFacts ? null : useStanding().standing
  const requestDate = useRequestDateChange()
  const extend = useExtendWorkItem()
  const update = useUpdateWorkItemDates()

  const preview = shallowRef<{ workItemId: string; edge: GanttEdge; day: string } | null>(null)
  const announcement = shallowRef('')

  function factsOf(face: GanttFace, task: GanttTask): TimelineActorFacts {
    if (options.actorFacts) return options.actorFacts(face, task)
    return timelineActorFacts(standing!.value, store.snapshot, face, task.department_id)
  }

  const completed = (task: GanttTask): boolean => task.status === 'tamamlandi'

  function draggableIds(tasks: readonly GanttTask[]): ReadonlySet<string> {
    const face = options.face()
    const ids = new Set<string>()
    if (face === null) return ids
    for (const task of tasks) {
      if (canDragHandles({ ...factsOf(face, task), completed: completed(task) })) {
        ids.add(task.work_item_id)
      }
    }
    return ids
  }

  const delayed = useDelayedSend<DateChange>({ send, delayMs: options.delayMs })

  function reread(scope: ScopeSnapshot, workItemId: string): void {
    void queryClient.invalidateQueries({ queryKey: queryKeys.gantt.all(scope) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dateRequests.all(scope) })
    void queryClient.invalidateQueries({
      queryKey: queryKeys.workItems.item(scope, workItemId),
      exact: true,
    })
  }

  function succeeded(change: DateChange, data: unknown): void {
    const { write, title } = change
    const cascade = (data as { cascade_count?: number } | undefined)?.cascade_count ?? 0
    const message =
      write.kind === 'extend'
        ? cascade > 0
          ? dragText('timeline.drag.sent.extendedCascade', {
              title,
              days: write.days,
              count: cascade,
            })
          : dragText('timeline.drag.sent.extended', { title, days: write.days })
        : write.kind === 'update'
          ? dragText('timeline.drag.sent.changed', { title })
          : dragText('timeline.drag.sent.requested', { title })
    toast.push({ message })
  }

  /** Sonuç bildirimi: başarı özel metin, diğerleri ortak `notifyOutcome`; 409/bilinmeyen → yeniden okuma. */
  function settle(
    change: DateChange,
    context: ActionContext,
    outcome: MutationOutcome<unknown, unknown, unknown>,
  ): void {
    if (outcome.kind === 'success') {
      succeeded(change, outcome.data)
      return
    }
    notifyOutcome(outcome)
    const rereadNeeded =
      outcome.kind === 'edit_conflict' ||
      outcome.kind === 'conflict_retry' ||
      (outcome.kind === 'failed' && outcome.error.status === 409)
    if (rereadNeeded && context.scope) reread(context.scope, change.workItemId)
  }

  async function send(change: DateChange, context: ActionContext): Promise<void> {
    const { write, target, workItemId } = change
    const opts = { context }
    if (write.kind === 'request') {
      const outcome = await requestDate.submit(
        { target, workItemId, newStartOn: write.newStartOn, newEndOn: write.newEndOn },
        opts,
      )
      settle(change, context, outcome)
      return
    }
    if (write.kind === 'extend') {
      settle(change, context, await extend.submit({ target, workItemId, days: write.days }, opts))
      return
    }
    // Admin `updateWorkItem`: sürüm GanttTask'ta yok (yeni-2) → önce taze görev.
    let fresh: Awaited<ReturnType<typeof fetchWorkItem>>
    try {
      fresh = await fetchWorkItem(target, workItemId)
    } catch (error) {
      if (error instanceof ApiError)
        toast.push({ message: outcomeText({ kind: 'failed', error }), tone: 'danger' })
      return
    }
    if (fresh.start_on !== change.before.start || fresh.end_on !== change.before.end) {
      toast.push({ message: dragText('timeline.drag.datesChanged'), tone: 'danger', timeout: 0 })
      if (context.scope) reread(context.scope, workItemId)
      return
    }
    settle(
      change,
      context,
      await update.submit(
        {
          target,
          workItemId,
          base: { dates_revision: fresh.dates_revision },
          dates: { start_on: write.start_on, end_on: write.end_on },
        },
        opts,
      ),
    )
  }

  /** Bırakma / klavye adımı → bekleyen değişiklik (aynı görevde birleşir, `before` korunur). */
  function stage(
    task: GanttTask,
    face: GanttFace,
    edge: GanttEdge,
    pick: (base: DayRange) => DayRange | null,
  ): boolean {
    const facts = factsOf(face, task)
    if (!canDragHandles({ ...facts, completed: completed(task) })) return false
    const policy = datePolicy(facts)
    const current = delayed.pending.value
    const held = current?.key === task.work_item_id ? current.payload : null
    const before: DayRange = held?.before ?? { start: task.start_on, end: task.end_on }
    const base: DayRange = held?.after ?? before
    const after = pick(base)
    if (after === null) return false
    if (sameRange(after, before)) {
      if (held) {
        delayed.cancel()
        announcement.value = dragText('timeline.drag.announce.cancelled', { title: task.title })
      }
      return true
    }
    const write = dateWriteFor(
      policy,
      { start_on: before.start, end_on: before.end },
      { start_on: after.start, end_on: after.end },
    )
    if (write === null) return false
    delayed.schedule(task.work_item_id, {
      workItemId: task.work_item_id,
      title: task.title,
      policy,
      write,
      before,
      after,
      target: { programId: task.program_id, departmentId: task.department_id },
    })
    announcement.value =
      dragText(edge === 'start' ? 'timeline.drag.announce.start' : 'timeline.drag.announce.end', {
        title: task.title,
        date: formatDay(edge === 'start' ? after.start : after.end),
      }) +
      ' ' +
      dragText('timeline.drag.announce.pending', { title: task.title })
    return true
  }

  function onEdgeDrag(drag: GanttEdgeDrag): void {
    if (drag.phase === 'move') {
      preview.value = { workItemId: drag.workItemId, edge: drag.edge, day: drag.day }
      return
    }
    preview.value = null
    if (drag.phase === 'cancel') return
    const face = options.face()
    const task = options.taskOf(drag.workItemId)
    if (face === null || !task) return
    stage(task, face, drag.edge, (base) => applyEdge(base, drag.edge, drag.day))
  }

  function nudge(workItemId: string, edge: GanttEdge, delta: 1 | -1): boolean {
    const face = options.face()
    const task = options.taskOf(workItemId)
    if (face === null || !task) return false
    return stage(task, face, edge, (base) => shiftEdge(base, edge, delta))
  }

  const snack = computed<DateChangeSnackView | null>(() => {
    const p = delayed.pending.value
    if (!p) return null
    const { payload } = p
    return {
      visible: p.visible,
      props: {
        face: payload.policy === 'request' ? 'coordinator' : 'admin',
        title: payload.title,
        before: payload.before,
        after: payload.after,
        remainingMs: p.remainingMs,
        totalMs: p.totalMs,
      },
    }
  })

  return {
    preview: preview as Readonly<Ref<typeof preview.value>>,
    draggableIds,
    onEdgeDrag,
    nudge,
    snack,
    announcement,
    cancel: () => {
      const p = delayed.pending.value
      if (delayed.cancel() && p) {
        announcement.value = dragText('timeline.drag.announce.cancelled', {
          title: p.payload.title,
        })
      }
    },
    dismiss: delayed.dismiss,
  }
}
