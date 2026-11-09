/**
 * Durum geçişi (E-03-44 → E-03-58; `istemci-akislari` §5, §7, §8). Görünürlük ve hedefler
 * yalnız modelden: `canTransitionWorkItem` (s.141) + `transitionTargets` (§5 matrisi). Uç
 * varsayılanı `transitionWorkItem` (her aktöre yeter; IK yok, sürüm yok).
 *
 *  - Geri alma (`tamamlandi → devam_ediyor`) önce gerekçe ister (`reason` ≥ 3 bayt).
 *  - 409 `work.subtasks_open` → "Açık alt görevler kapatılsın mı?" → onayda AYNI hedef
 *    `close_subtasks: true` ile yeni eylem (yalnız `to = tamamlandi`).
 *  - 422 `work.attachment_required` → "Önce kanıt dosyası yükleyin" + `requestEvidence`
 *    (çağıran yükleme penceresini açar, E-03-52).
 *  - Diğer 409'lar ve "sonuç bilinmiyor": görev ve liste yeniden okunur, ileti gösterilir;
 *    otomatik tekrar yok (§8). İyimser güncelleme yok.
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { invalidationFilters } from '@/shared/http/query-keys'
import { useStanding } from '@/shared/scope/standing'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useTransitionWorkItem } from '../../api'
import { canTransitionWorkItem, workActorFacts } from '../../model/capabilities'
import { targetOf } from '../../model/target'
import { canCloseSubtasks, requiresReason, transitionTargets } from '../../model/transitions'
import type { TransitionBody, TransitionResult, WorkItem, WorkItemStatus } from '../../model/types'
import { formsText } from './messages'

/** Durum noktası sınıfı (`rp-dot--*`, E-03-23). */
export const STATUS_DOT: Readonly<Record<WorkItemStatus, string>> = {
  baslanmadi: 'rp-dot--todo',
  devam_ediyor: 'rp-dot--doing',
  onaya_sunuldu: 'rp-dot--review',
  iade_edildi: 'rp-dot--back',
  tamamlandi: 'rp-dot--done',
}

export interface TransitionHooks {
  transitioned: (result: TransitionResult) => void
  requestEvidence: () => void
}

type Outcome = MutationOutcome<unknown, TransitionResult, unknown>

const codeOf = (o: Outcome) => (o.kind === 'failed' ? o.error.code : null)

/** Sonuç görevi yeniden okumayı gerektiriyor mu (409 ailesi, sonuç bilinmiyor). */
function needsReread(o: Outcome): boolean {
  if (o.kind === 'unknown_outcome' || o.kind === 'conflict_retry') return true
  return o.kind === 'failed' && o.error.status === 409
}

function confirmCloseSubtasks(): Promise<boolean> {
  return useConfirm().confirm({
    title: formsText('workForms.transition.subtasks.title'),
    body: [formsText('workForms.transition.subtasks.body')],
    confirmLabel: formsText('workForms.transition.subtasks.confirm'),
    tone: 'primary',
  })
}

/** 409 / sonuç bilinmiyor sonrası: görev ve liste yeniden okunur (geçişin geçersizleme kümesi). */
function reread(client: QueryClient, scope: ScopeSnapshot, workItemId: string): void {
  for (const filter of invalidationFilters('transitionWorkItem', scope, { workItemId })) {
    void client.invalidateQueries(filter)
  }
}

export function useStatusTransition(item: MaybeRefOrGetter<WorkItem>, hooks: TransitionHooks) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const queryClient = useQueryClient()
  const transition = useTransitionWorkItem()

  const facts = computed(() => workActorFacts(standing.value, store.programId, toValue(item)))
  const targets = computed<WorkItemStatus[]>(() =>
    canTransitionWorkItem(facts.value) ? transitionTargets(facts.value, toValue(item).status) : [],
  )
  /** Gerekçe bekleyen hedef (geri alma penceresi açık). */
  const reasonFor = ref<WorkItemStatus | null>(null)

  async function settle(current: WorkItem, body: TransitionBody, o: Outcome): Promise<Outcome> {
    if (o.kind === 'success') {
      hooks.transitioned(o.data)
      return o
    }
    const code = codeOf(o)
    if (code === 'work.subtasks_open' && canCloseSubtasks(body.to) && !body.close_subtasks) {
      if (await confirmCloseSubtasks()) return send(current, { ...body, close_subtasks: true })
    } else if (code === 'work.attachment_required') {
      useToast().push({ message: formsText('workForms.transition.evidence'), tone: 'danger' })
      hooks.requestEvidence()
      return o
    } else if (code === 'work.revert_reason_required') {
      reasonFor.value = body.to
      return o
    } else {
      notifyOutcome(o)
    }
    if (needsReread(o)) reread(queryClient, store.snapshot, current.work_item_id)
    return o
  }

  /** Her çağrı yeni kullanıcı eylemidir (onaylı `close_subtasks` tekrarı dahil). */
  async function send(current: WorkItem, body: TransitionBody): Promise<Outcome> {
    const outcome = await transition.submit({
      target: targetOf(current),
      workItemId: current.work_item_id,
      body,
    })
    return settle(current, body, outcome)
  }

  /** Menüden hedef seçimi: geri almada önce gerekçe penceresi. */
  async function choose(to: WorkItemStatus): Promise<void> {
    const current = toValue(item)
    if (requiresReason(current.status, to)) {
      reasonFor.value = to
      return
    }
    await send(current, { to })
  }

  /** Gerekçe penceresinden gönderim; pencere başarıda kapanır. */
  async function submitReason(reason: string): Promise<Outcome | null> {
    const to = reasonFor.value
    if (to === null) return null
    const outcome = await send(toValue(item), { to, reason: reason.trim() })
    if (outcome.kind === 'success') reasonFor.value = null
    return outcome
  }

  return { targets, reasonFor, choose, submitReason, isPending: transition.isPending }
}
