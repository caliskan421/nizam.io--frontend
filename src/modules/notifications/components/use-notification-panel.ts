/**
 * Panel durumu (14 `mekanizma.md` §3.1, §5). İstemci durumu bellektedir: `tab` (Tümü |
 * Okunmamış; "Senden bekleyen" devre dışı, BE-144). Sekme süzgeci istemcidedir (uçta süzgeç
 * yok, BE-145): yüklü sayfalardaki `is_read=false`; "Daha eski" ile genişler. Sunucu sırası
 * korunur (en yeni önce); gruplama kurulum saat diliminde Bugün / Dün / Daha eski.
 */
import { computed, ref, watch } from 'vue'

import { useNotifications } from '../api/queries'
import type { NotificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'
import { groupOf, type PanelGroup } from './panel-time'
import { usePanelClock } from './use-panel-clock'
import { usePanelWrites } from './use-panel-writes'

export type PanelTab = 'all' | 'unread'
export type PanelState = 'loading' | 'error' | 'empty' | 'list'

export interface PanelGroupRows {
  group: PanelGroup
  items: readonly NotificationItem[]
}

const GROUP_ORDER: readonly PanelGroup[] = ['today', 'yesterday', 'older']

export function useNotificationPanel(options: {
  open: () => boolean
  onNavigate: (target: NotificationTarget) => void
}) {
  const list = useNotifications(options.open)
  const writes = usePanelWrites(options.onNavigate)
  const clock = usePanelClock(options.open)
  const tab = ref<PanelTab>('all')
  // Panel kapanınca sekme "Tümü"ye döner (E-14-13).
  watch(options.open, (isOpen) => {
    if (!isOpen) tab.value = 'all'
  })

  const rows = computed(() =>
    tab.value === 'unread' ? list.items.value.filter((item) => !item.is_read) : list.items.value,
  )
  const groups = computed<PanelGroupRows[]>(() => {
    const byGroup = new Map<PanelGroup, NotificationItem[]>()
    for (const item of rows.value) {
      const group = groupOf(item.created_at, clock.now.value, clock.timeZone.value)
      byGroup.set(group, [...(byGroup.get(group) ?? []), item])
    }
    return GROUP_ORDER.flatMap((group) => {
      const items = byGroup.get(group)
      return items ? [{ group, items }] : []
    })
  })

  const hasMore = computed(() => list.query.hasNextPage.value === true)
  const state = computed<PanelState>(() => {
    if (list.query.data.value === undefined) {
      return list.query.isError.value ? 'error' : 'loading'
    }
    return rows.value.length === 0 && !hasMore.value ? 'empty' : 'list'
  })

  return {
    ...writes,
    ...clock,
    tab,
    state,
    groups,
    hasMore,
    unreadCount: list.unreadCount,
    error: computed(() => list.query.error.value),
    olderError: computed(() => list.query.isFetchNextPageError.value),
    olderLoading: computed(() => list.query.isFetchingNextPage.value),
    loadMore: list.loadMore,
    retry: () => void list.query.refetch(),
  }
}
