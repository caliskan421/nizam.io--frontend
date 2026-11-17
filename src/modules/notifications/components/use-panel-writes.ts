/**
 * Panel yazmaları (14 `mekanizma.md` §3.2). Okundu yazması iyimser DEĞİLDİR: nokta ve sayaç
 * başarı + geçersizleme sonrası değişir (KESİN 29 `INVALIDATED_BY`). Satır tıklamasında yazma ve
 * gezinme BİRLİKTE başlar; gezinme yazmanın sonucunu beklemez (E-14-35). `useToast` kurulumda
 * alınır (KESİN 26a): sökülmüş panelin geç sonucu bildirim üretmez (`reachesOwner`). Satır
 * işlemleri (okundu, kaldır, sessize al) aynı `pending` kümesini paylaşır (satır başına tek yazma).
 */
import { ref } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { reachesOwner } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { outcomeToast } from '@/shared/ui/confirm'

import {
  NOTIFICATION_NOT_FOUND,
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMuteNotificationSubject,
  useUnmuteNotificationSubject,
} from '../api/writes'
import { notificationText } from '../messages'
import { muteKindOf } from '../model/mute'
import { notificationTarget, type NotificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'

type Outcome = MutationOutcome<unknown, unknown, unknown>

/** Satır başına tek yazma + sahibi sökülmemiş sonucun bildirimi. */
function useRowWriteState() {
  const toast = useToast()
  const pending = ref<ReadonlySet<string>>(new Set())

  function notify(outcome: Outcome): void {
    if (!reachesOwner(outcome)) return
    const message = outcomeToast(outcome)
    if (message) toast.push(message)
  }

  /** 404 satırı sessizce düşürür (yazma katmanı listeyi yeniden okur); sonuç yoksa `undefined`. */
  async function withPending(id: string, work: () => Promise<Outcome>) {
    if (pending.value.has(id)) return undefined
    pending.value = new Set([...pending.value, id])
    try {
      const outcome = await work()
      const gone = outcome.kind === 'failed' && outcome.error.code === NOTIFICATION_NOT_FOUND
      return gone ? undefined : outcome
    } finally {
      pending.value = new Set([...pending.value].filter((x) => x !== id))
    }
  }
  return { toast, pending, notify, withPending }
}

type RowState = ReturnType<typeof useRowWriteState>

/** "Kaldır" (BE-156; kayıt birleştirilmişse grubuyla) ve konu sessize alma/geri alma. */
function useRowActions({ toast, notify, withPending }: RowState) {
  const dismissW = useDismissNotification()
  const muteW = useMuteNotificationSubject()
  const unmuteW = useUnmuteNotificationSubject()
  const say = (key: Parameters<typeof notificationText>[0], tone?: 'danger'): void => {
    toast.push({ message: notificationText(key), ...(tone ? { tone } : {}) })
  }

  async function dismiss(id: string): Promise<void> {
    const outcome = await withPending(id, () => dismissW.submit({ id }))
    if (!outcome || !reachesOwner(outcome)) return
    if (outcome.kind === 'success') say('notifications.panel.toasts.dismissed')
    else notify(outcome)
  }

  /** Konu görev ya da toplantıdır; `muted` satırdan okunur (tahmin yok). */
  async function toggleMute(item: NotificationItem): Promise<void> {
    const kind = muteKindOf(item)
    if (!kind) return
    const vars = { kind, id: item.subject_ref.id }
    const muting = !item.muted
    const outcome = await withPending(item.id, () =>
      muting ? muteW.submit(vars) : unmuteW.submit(vars),
    )
    if (!outcome || !reachesOwner(outcome)) return
    if (outcome.kind === 'success') {
      say(muting ? 'notifications.panel.toasts.muted' : 'notifications.panel.toasts.unmuted')
      return
    }
    // 500 konu tavanı: 422, alan `subject_id`.
    const capped =
      outcome.kind === 'failed' && outcome.error.fields.some((f) => f.field === 'subject_id')
    if (muting && capped) say('notifications.panel.toasts.muteLimit', 'danger')
    else notify(outcome)
  }
  return { dismiss, toggleMute }
}

export function usePanelWrites(onNavigate: (target: NotificationTarget) => void) {
  const state = useRowWriteState()
  const { toast, pending, notify, withPending } = state
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const markAllBusy = ref(false)

  async function markOne(id: string): Promise<void> {
    const outcome = await withPending(id, () => markRead.submit({ id }))
    if (outcome && outcome.kind !== 'success') notify(outcome)
  }

  /**
   * Satır (ya da "İncele"/"Gündemi aç") etkinleştirme: okundu + hedefe gezinme birlikte. Sohbet
   * bildirimi İSTEMCİDE okundu işaretlenmez: konuşma açılınca mevcut okundu işaretçisi
   * `markChatRead` gönderir, sunucu sohbet bildirimlerini kapatır ve ilişki (`query-keys`) zil +
   * liste + iki sayacı yeniler (BE-027; `markNotificationRead` yalnız açık "Okundu say"da).
   */
  function activate(item: NotificationItem): void {
    const target = notificationTarget(item)
    if (!item.is_read && target?.route !== 'collaboration.chat') void markOne(item.id)
    if (target) onNavigate(target)
  }

  async function markAllRead(): Promise<void> {
    if (markAllBusy.value) return
    markAllBusy.value = true
    try {
      const outcome = await markAll.submit()
      if (outcome.kind !== 'success') return notify(outcome)
      if (!reachesOwner(outcome)) return
      const n = outcome.data.marked_count
      toast.push({
        message:
          n > 0
            ? notificationText('notifications.panel.markedAll', { n })
            : notificationText('notifications.panel.markedNone'),
      })
    } finally {
      markAllBusy.value = false
    }
  }

  return { pending, markAllBusy, markOne, activate, markAllRead, ...useRowActions(state) }
}
