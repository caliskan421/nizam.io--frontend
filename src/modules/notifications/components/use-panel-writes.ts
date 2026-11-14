/**
 * Panel yazmaları (14 `mekanizma.md` §3.2). Okundu yazması iyimser DEĞİLDİR: nokta ve sayaç
 * başarı + geçersizleme sonrası değişir (KESİN 29 `INVALIDATED_BY`). Satır tıklamasında yazma ve
 * gezinme BİRLİKTE başlar; gezinme yazmanın sonucunu beklemez (E-14-35). `useToast` kurulumda
 * alınır (KESİN 26a): sökülmüş panelin geç sonucu bildirim üretmez (`reachesOwner`).
 */
import { ref } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { reachesOwner } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { outcomeToast } from '@/shared/ui/confirm'

import {
  NOTIFICATION_NOT_FOUND,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../api/writes'
import { notificationText } from '../messages'
import { notificationTarget, type NotificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'

export function usePanelWrites(onNavigate: (target: NotificationTarget) => void) {
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const toast = useToast()
  const pending = ref<ReadonlySet<string>>(new Set())
  const markAllBusy = ref(false)

  function notify(outcome: MutationOutcome<unknown, unknown, unknown>): void {
    if (!reachesOwner(outcome)) return
    const message = outcomeToast(outcome)
    if (message) toast.push(message)
  }

  async function markOne(id: string): Promise<void> {
    if (pending.value.has(id)) return
    pending.value = new Set([...pending.value, id])
    try {
      const outcome = await markRead.submit({ id })
      // 404: satır listeden düşer (yazma katmanı listeyi yeniden okur), sessiz (E-14-47).
      if (outcome.kind === 'failed' && outcome.error.code === NOTIFICATION_NOT_FOUND) return
      if (outcome.kind !== 'success') notify(outcome)
    } finally {
      pending.value = new Set([...pending.value].filter((x) => x !== id))
    }
  }

  /** Satır (ya da "İncele"/"Gündemi aç") etkinleştirme: okundu + hedefe gezinme birlikte. */
  function activate(item: NotificationItem): void {
    if (!item.is_read) void markOne(item.id)
    const target = notificationTarget(item)
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

  return { pending, markAllBusy, markOne, activate, markAllRead }
}
