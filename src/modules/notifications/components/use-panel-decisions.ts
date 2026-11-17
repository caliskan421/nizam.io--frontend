/**
 * Satır içi karar (BE-146; P88): bildirim `action` kabiliyeti BACKEND'in verdiği `kind`/`state`'tir —
 * eski global görev-aktör matrisi bu yüzde kapı değildir (yalnız bu yüze özel dar tüketim).
 * Mevcut korumalı yazmalar kullanılır, ikinci HTTP istemcisi yoktur:
 *  - `review_date_request` → `reviewDateChangeRequest` (`action.request_id`; S1, başlıksız).
 *  - `approve_task` → görev geçişi (S3; başlıklar `Notification.program_id`/`department_id`, görev
 *    `subject_ref.id`): Onayla `tamamlandi`; Reddet = iade (`iade_edildi`, isteğe bağlı gerekçe,
 *    `RevertReasonDialog`). 409 `work.subtasks_open` → ortak onay → AYNI hedef `close_subtasks`.
 * Seçili programdan alan TAHMİN EDİLMEZ: program/departman satırdan yoksa karar verilemez. İyimser
 * güncelleme yok; 403/404/409 sunucu cevabı kanoniktir (metin i18n'den) ve liste + iki sayaç
 * yeniden okunur ("başkası karar verdi" satırı sunucudan gelir). Başarıda satırın program/görev
 * önbellekleri de eylemin KENDİ kapsamında tazelenir. `useToast`/`useConfirm` kurulumda alınır.
 */
import { useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'

import { useReviewDateChangeRequest } from '@/modules/timeline/public'
import { useTransitionWorkItem } from '@/modules/work/public'
import { reachesOwner, type ActionContext, type MutationOutcome } from '@/shared/http/mutation'
import { invalidationFilters, queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { notificationText } from '../messages'
import { decisionOf, taskTarget } from '../model/decision'
import type { NotificationItem } from '../model/types'

type Outcome = MutationOutcome<unknown, unknown, unknown>
type Verb = 'approve' | 'reject'

/** Karar isteklerini kuran yazma kancaları (kurulumda alınır; ikinci HTTP istemcisi yok). */
function useDecisionRequests() {
  const review = useReviewDateChangeRequest()
  const transition = useTransitionWorkItem()
  const { confirmWrite } = useConfirm()

  function sendTransition(
    item: NotificationItem,
    body: { to: 'tamamlandi' | 'iade_edildi'; reason?: string; close_subtasks?: true },
    context?: ActionContext,
  ): Promise<Outcome> {
    const target = taskTarget(item)
    if (!target) return Promise.reject(new Error('karar hedefi eksik'))
    return transition.submit({ target, workItemId: item.subject_ref.id, body }, { context })
  }

  async function settleTask(item: NotificationItem, first: Outcome): Promise<Outcome> {
    const code = first.kind === 'failed' ? first.error.code : null
    if (code !== 'work.subtasks_open') return first
    const again = await confirmWrite(
      {
        title: notificationText('notifications.rows.decision.subtasksTitle'),
        body: [notificationText('notifications.rows.decision.subtasksBody')],
        confirmLabel: notificationText('notifications.rows.decision.subtasksConfirm'),
        tone: 'primary',
      },
      (context) => sendTransition(item, { to: 'tamamlandi', close_subtasks: true }, context),
      { context: first.kind === 'failed' ? first.context : undefined },
    )
    return again ?? first
  }

  return function start(item: NotificationItem, verb: Verb, reason?: string): Promise<Outcome> {
    const action = item.action
    if (action?.kind === 'review_date_request' && action.request_id) {
      return review.submit({
        requestId: action.request_id,
        workItemId: item.subject_ref.id,
        decision: verb === 'approve' ? 'approved' : 'rejected',
      })
    }
    if (verb === 'approve') {
      return sendTransition(item, { to: 'tamamlandi' }).then((first) => settleTask(item, first))
    }
    return sendTransition(item, { to: 'iade_edildi', ...(reason ? { reason } : {}) })
  }
}

export function usePanelDecisions() {
  const client = useQueryClient()
  const store = useScopeStore()
  const toast = useToast()
  const start = useDecisionRequests()
  /** Kararı süren bildirim (tek seferde bir karar). */
  const busy = ref<string | null>(null)

  function rereadNotifications(): void {
    void client.invalidateQueries({ queryKey: queryKeys.notifications.list() })
    void client.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
  }

  /** Eylemin hedef programı/görevi (seçili kapsamdan farklı olabilir) önbellekleri tazelenir. */
  function refreshTarget(item: NotificationItem): void {
    const target = taskTarget(item)
    if (!target) return
    const scope = { ...target, lens: store.snapshot.lens }
    for (const filter of invalidationFilters('transitionWorkItem', scope, {
      workItemId: item.subject_ref.id,
    })) {
      void client.invalidateQueries(filter)
    }
  }

  /** Kararı gönderir; başarıda ve bayat/yetkisiz sonuçta liste + iki sayaç sunucudan okunur. */
  async function decide(item: NotificationItem, verb: Verb, reason?: string): Promise<boolean> {
    if (busy.value !== null || decisionOf(item) !== 'ready') return false
    busy.value = item.id
    try {
      const outcome = await start(item, verb, reason)
      if (!reachesOwner(outcome)) return false
      if (outcome.kind === 'success') {
        toast.push({ message: notificationText('notifications.panel.toasts.decided') })
        refreshTarget(item)
        return true
      }
      notifyOutcome(outcome)
      rereadNotifications()
      return false
    } finally {
      busy.value = null
    }
  }

  return { busy, decide }
}
