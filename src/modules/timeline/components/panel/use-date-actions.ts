/**
 * Panelin tarih yazmaları: Admin "Kaydet" (`updateWorkItem`, `expected_dates_revision`; 409
 * `work.edit_conflict` → `shared/ui/conflict` alan alan seçim) ve bekleyen talepte
 * "Onayla"/"Reddet" (`reviewDateChangeRequest`). İkisi de anahtarsızdır (K5): istek sürerken
 * düğmeler kilitli (`busy`), sonuç bilinmiyorsa kör tekrar yok (veri katmanı yeniden okutur,
 * taslak korunur), iyimser güncelleme yok. `cascade_count`/`affected_tasks_count` onay
 * diyaloğu olmadan SONRADAN bildirilir. Sahibi sökülmüş sonuç bildirim/yeniden okuma yapmaz.
 */
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import type { WorkItem } from '@/modules/work/public'
import { ownerLife, reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'
import { conflictRows, resolveDraft, useConflictResolver } from '@/shared/ui/conflict'
import { useToast } from '@/shared/ui'

import { useReviewDateChangeRequest, useUpdateWorkItemDates } from '../../api'
import type { DatePatch, ReviewDecision } from '../../model/types'
import { checkDraft, type DateInputError, formatInputDay } from './date-input'
import { panelText } from './messages'
import { failedCode, failedText, needsReread, rereadItem } from './outcomes'
import { plannedEndOf, type TaskPanel } from './use-task-panel'

type Outcome = MutationOutcome<unknown, unknown, unknown>

/** Çakışma satırlarının alanları (gövde anahtarları) ve tarih biçimi. */
function conflictLabels(): Record<string, string> {
  const end = panelText('end')
  return { start_on: panelText('start'), end_on: end, planned_end_on: end }
}
const conflictFormat = (_field: string, value: unknown) =>
  typeof value === 'string' ? formatInputDay(value) : ''

/** Girdi ile görevdeki tarih farkı (yalnız değişen alanlar); bitiş alanı planlanan bitişe göre. */
export function changedDates(base: WorkItem, value: { startOn: string; endOn: string }): DatePatch {
  const patch: DatePatch = {}
  if (value.startOn !== base.start_on) patch.start_on = value.startOn
  if (value.endOn !== plannedEndOf(base)) {
    patch[base.planned_end_on ? 'planned_end_on' : 'end_on'] = value.endOn
  }
  return patch
}

/** Çakışma yanıtındaki sunucu kaydı (`readCurrent`; tür `unknown` taşınır): görev değilse `null`. */
function serverItem(value: unknown): WorkItem | null {
  const candidate = value as Partial<WorkItem> | null
  const ok = typeof candidate === 'object' && typeof candidate?.dates_revision === 'number'
  return ok ? (candidate as WorkItem) : null
}

/** Girdi hataları, form hatası ve sonuç sonrası ortak yol (paylaşılan durum). */
function useActionState(panel: TaskPanel) {
  const client = useQueryClient()
  const errors = ref<{ start: DateInputError | null; end: DateInputError | null }>({
    start: null,
    end: null,
  })
  const formError = ref<string | null>(null)

  function reset(): void {
    errors.value = { start: null, end: null }
    formError.value = null
  }

  /** 409 → görev yeniden okunur; `failed` satır içi (kendi kod metni önce), diğerleri ortak bildirim. */
  function settle(outcome: Outcome, ownCodes: Record<string, string> = {}): void {
    if (needsReread(outcome)) {
      rereadItem(client, panel.scope(), outcome, panel.task.value.work_item_id)
    }
    const code = failedCode(outcome)
    formError.value = (code === null ? undefined : ownCodes[code]) ?? failedText(outcome)
    if (formError.value === null) notifyOutcome(outcome)
  }

  return { errors, formError, reset, settle }
}

type ActionState = ReturnType<typeof useActionState>

/** "Kaydet": çakışmada yalnız gerçek çakışan alanlar sorulur, seçimle YENİ eylem gönderilir. */
function useSave(panel: TaskPanel, state: ActionState) {
  const toast = useToast() // kurulumda: sökülmüş sahibin geç sonucu bildirim üretmez
  const update = useUpdateWorkItemDates()
  const conflict = useConflictResolver()
  const owner = ownerLife()

  async function send(base: WorkItem, dates: DatePatch, autoRetried = false): Promise<void> {
    const outcome = await update.submit({
      target: { ...panel.target.value },
      workItemId: base.work_item_id,
      base: { dates_revision: base.dates_revision },
      dates: { ...dates },
    })
    if (!reachesOwner(outcome)) return
    if (outcome.kind === 'success') {
      toast.push({ message: panelText('done.saved') })
      // Girdiler, engine geçersizlemesiyle yenilenen taze görevden yeniden tohumlanır.
      panel.dirty.value = false
      return
    }
    const server = outcome.kind === 'edit_conflict' ? serverItem(outcome.server) : null
    // Sürüm ilerlemediyse yeniden göndermek aynı çakışmayı doğurur: bildirilir.
    if (!server || server.dates_revision === base.dates_revision) return state.settle(outcome)
    const input = {
      base: { ...base },
      draft: { ...dates },
      server: { ...server },
      labels: conflictLabels(),
      format: conflictFormat,
    }
    const automatic = conflictRows(input).length === 0
    if (automatic && autoRetried) return state.settle(outcome)
    const choices = await conflict.resolve(input)
    if (choices === null || !owner.alive()) return
    const next = resolveDraft(dates, server, choices)
    if (Object.keys(next).length > 0) await send(server, next, automatic)
    else panel.dirty.value = false
  }

  /** "Kaydet" (Admin): önce doğrulama, sonra yalnız değişen tarihler. */
  async function save(): Promise<void> {
    const base = panel.item.value
    if (update.isPending.value || !base) return
    state.reset()
    const check = checkDraft(panel.start.value, panel.end.value)
    state.errors.value = { start: check.start, end: check.end }
    if (!check.value) return
    const dates = changedDates(base, check.value)
    if (Object.keys(dates).length === 0) {
      state.formError.value = panelText('errors.unchanged')
      return
    }
    await send(base, dates)
  }

  return { save, conflict, pending: update.isPending }
}

/** Bekleyen talebi onayla / reddet (Admin). */
function useReview(panel: TaskPanel, state: ActionState) {
  const toast = useToast()
  const review = useReviewDateChangeRequest()

  async function decide(decision: ReviewDecision): Promise<void> {
    const request = panel.item.value?.pending_date_request
    if (review.isPending.value || !request) return
    state.reset()
    const outcome = await review.submit({
      requestId: request.request_id,
      workItemId: panel.task.value.work_item_id,
      decision,
    })
    if (!reachesOwner(outcome)) return
    if (outcome.kind !== 'success') {
      return state.settle(outcome, {
        'work.date_request_already_reviewed': panelText('errors.alreadyReviewed'),
      })
    }
    toast.push({ message: panelText(decision === 'approved' ? 'done.approved' : 'done.rejected') })
    const moved = outcome.data.affected_tasks_count
    if (decision === 'approved' && moved > 0) {
      toast.push({ message: panelText('done.cascade', { n: moved }) })
    }
    panel.dirty.value = false
  }

  return { decide, pending: review.isPending }
}

export function useDateActions(panel: TaskPanel) {
  const state = useActionState(panel)
  const saving = useSave(panel, state)
  const reviewing = useReview(panel, state)
  return {
    errors: state.errors,
    formError: state.formError,
    reset: state.reset,
    busy: computed(() => saving.pending.value || reviewing.pending.value),
    save: saving.save,
    conflict: saving.conflict,
    decide: reviewing.decide,
  }
}
