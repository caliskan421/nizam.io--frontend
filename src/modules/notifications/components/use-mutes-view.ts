/**
 * "Sessize alınan konular" görünümü (BE-156; P86): `listNotificationSubjectMutes` imleçli listesi ve
 * `unmuteNotificationSubject`. Sözleşme yalnız `subject_kind`, `subject_id`, `created_at` taşır:
 * konu adı UYDURULMAZ ve work/meeting GET'i ÇAĞRILMAZ. Başlık yalnız panelin mevcut bildirim
 * verisinde aynı konu için EN YENİ satır `subject.state = available` iken kullanılır (kalıcı
 * önbellek yok; forbidden/deleted/unknown'da eski başlık taşınmaz). Yoksa nötr "Sessize alınmış
 * görev/toplantı". Sessizi kaldırma S1 kişisel işlemdir: konuya erişim kalmamış olsa da çalışır.
 */
import { computed, ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { outcomeToast } from '@/shared/ui/confirm'

import { useSubjectMutes } from '../api/queries'
import { useUnmuteNotificationSubject } from '../api/writes'
import { notificationText } from '../messages'
import type { NotificationItem, NotificationSubjectMute } from '../model/types'

export const muteKey = (m: Pick<NotificationSubjectMute, 'subject_kind' | 'subject_id'>) =>
  `${m.subject_kind}/${m.subject_id}`

/** Konu → güncel başlık (yalnız en yeni satır available ise). */
export function currentTitles(items: readonly NotificationItem[]): Map<string, string> {
  const seen = new Set<string>()
  const titles = new Map<string, string>()
  for (const item of items) {
    const { kind, id } = item.subject_ref
    if (kind !== 'work_item' && kind !== 'meeting') continue
    const key = `${kind}/${id}`
    if (seen.has(key)) continue
    seen.add(key)
    const { state, title } = item.subject
    if (state === 'available' && title) titles.set(key, title)
  }
  return titles
}

export function useMutesView(open: () => boolean, items: () => readonly NotificationItem[]) {
  const mutes = useSubjectMutes(open)
  const unmute = useUnmuteNotificationSubject()
  const toast = useToast()
  const pending = ref<ReadonlySet<string>>(new Set())
  const titles = computed(() => currentTitles(items()))

  async function remove(mute: NotificationSubjectMute): Promise<void> {
    const key = muteKey(mute)
    if (pending.value.has(key)) return
    pending.value = new Set([...pending.value, key])
    try {
      const outcome = await unmute.submit({ kind: mute.subject_kind, id: mute.subject_id })
      if (!reachesOwner(outcome)) return
      if (outcome.kind === 'success') {
        toast.push({ message: notificationText('notifications.panel.toasts.unmuted') })
        return
      }
      const message = outcomeToast(outcome)
      if (message) toast.push(message)
    } finally {
      pending.value = new Set([...pending.value].filter((x) => x !== key))
    }
  }

  return {
    items: mutes.items,
    titles,
    pending,
    remove,
    query: mutes.query,
    retry: () => void mutes.query.refetch(),
    loadMore: () => void mutes.query.fetchNextPage(),
  }
}
