/**
 * Panel durumu (14 `mekanizma.md` §3.1, §5). İstemci durumu bellektedir: `tab` (Senden bekleyen |
 * Tümü | Okunmamış) ve `view` (liste | sessize alınan konular). Sekme süzgeci SUNUCUDADIR
 * (BE-144/145: `awaiting`, `unread_only`; her sekmenin imleç zinciri ayrıdır); süzülmüş sayfa
 * kısa/boş dönebilir, devam `next_cursor`'dadır ("Daha eski"). Sunucu sırası korunur (en yeni
 * önce); gruplama kurulum saat diliminde Bugün / Dün / Daha eski. İki sayaç AYRIDIR: sekme
 * sayıları sunucunun `unread_count` (okunmamış GRUP) ve `awaiting_count` alanlarıdır.
 */
import { computed, ref, watch } from 'vue'

import type { NotificationListFilters } from '@/shared/http/query-keys'
import { useSessionStore } from '@/shared/session/store'

import { useNotifications } from '../api/queries'
import type { NotificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'
import { groupOf, type PanelGroup } from './panel-time'
import { usePanelClock } from './use-panel-clock'
import { usePanelDecisions } from './use-panel-decisions'
import { usePanelWrites } from './use-panel-writes'

export type PanelTab = 'awaiting' | 'all' | 'unread'
export type PanelView = 'list' | 'mutes'
export type PanelState = 'loading' | 'error' | 'empty' | 'list'

export interface PanelGroupRows {
  group: PanelGroup
  items: readonly NotificationItem[]
}

const GROUP_ORDER: readonly PanelGroup[] = ['today', 'yesterday', 'older']

function groupRows(
  items: readonly NotificationItem[],
  now: Date,
  timeZone: string | undefined,
): PanelGroupRows[] {
  const byGroup = new Map<PanelGroup, NotificationItem[]>()
  for (const item of items) {
    const group = groupOf(item.created_at, now, timeZone)
    byGroup.set(group, [...(byGroup.get(group) ?? []), item])
  }
  return GROUP_ORDER.flatMap((group) => {
    const rowsOfGroup = byGroup.get(group)
    return rowsOfGroup ? [{ group, items: rowsOfGroup }] : []
  })
}

export function useNotificationPanel(options: {
  open: () => boolean
  onNavigate: (target: NotificationTarget) => void
}) {
  const session = useSessionStore()
  const tab = ref<PanelTab>('all')
  const view = ref<PanelView>('list')
  const filters = computed<NotificationListFilters>(() =>
    tab.value === 'awaiting'
      ? { awaiting: true }
      : tab.value === 'unread'
        ? { unread_only: true }
        : {},
  )
  const list = useNotifications(options.open, filters)
  const writes = usePanelWrites(options.onNavigate)
  const decisions = usePanelDecisions()
  const clock = usePanelClock(options.open)
  // Panel kapanınca sekme "Tümü"ye, görünüm listeye döner (E-14-13).
  watch(options.open, (isOpen) => {
    if (isOpen) return
    tab.value = 'all'
    view.value = 'list'
  })

  const rows = list.items
  const groups = computed(() => groupRows(rows.value, clock.now.value, clock.timeZone.value))

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
    decide: decisions.decide,
    deciding: decisions.busy,
    me: computed(() => session.accountId),
    rows,
    tab,
    view,
    state,
    groups,
    hasMore,
    unreadCount: list.unreadCount,
    awaitingCount: list.awaitingCount,
    error: computed(() => list.query.error.value),
    olderError: computed(() => list.query.isFetchNextPageError.value),
    olderLoading: computed(() => list.query.isFetchingNextPage.value),
    loadMore: list.loadMore,
    retry: () => void list.query.refetch(),
  }
}
