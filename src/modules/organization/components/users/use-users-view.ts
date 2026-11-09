/**
 * 05 Kullanıcılar veri görünümü (E-05-03, E-05-06…08, E-05-10, E-05-13…24). Sayfa bir kez kurar
 * ve `provideUsersView` ile tabloya/panele verir (aynı sorgu, aynı sıralama durumu); bağlam yoksa
 * tablo kendi örneğini kurar (prop/emit sözleşmesi değişmez).
 *
 *  - Kaynak: süzgeç yokken şirket geneli `listUsers` (S1, imleçli, "Daha fazla yükle"); tek
 *    koordinatörlük seçiliyken YALNIZ o birimin `listMembers`'ı (tek istek, ≤200; fan-out yok —
 *    K3, P4) ve arama/sıralama o kümede istemcide. Silinmiş ekip satırları gösterilmez (P14).
 *  - Sıralama "kullanıcı ↑/↓" bellekte; yön değişince yeni anahtar → eski imleç kullanılmaz.
 *  - Rol sekmesi ve sayaçlar yüklenen kümede, seçili programın etiketlerinden (E-05-06).
 */
import {
  computed,
  inject,
  provide,
  ref,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useScopeStore } from '@/shared/scope/store'

import { useDepartmentRoster, useProgramDepartmentIndex, useUserList } from '../../api'
import type { UserRoleTab } from '../../model/capabilities'
import type { SortOrder } from '../../model/types'
import { useUserCacheIndex } from './use-user-cache'
import {
  filterByTab,
  rowFromRoster,
  rowFromUser,
  searchRows,
  sortRows,
  tabCounts,
  type UserRow,
} from './user-rows'

export interface UsersViewInput {
  roleTab: UserRoleTab
  search: string
  departmentId: string | null
}

export function useUsersView(input: MaybeRefOrGetter<UsersViewInput>) {
  const store = useScopeStore()
  const sortOrder = ref<SortOrder>('asc')
  const search = computed(() => toValue(input).search.trim())
  const departmentId = computed(() =>
    store.programId === null ? null : toValue(input).departmentId,
  )
  const rosterMode = computed(() => departmentId.value !== null)

  const list = useUserList(
    () => ({ search: search.value || null, sortOrder: sortOrder.value }),
    () => !rosterMode.value,
  )
  const roster = useDepartmentRoster(departmentId, rosterMode)
  const departments = useProgramDepartmentIndex()
  const cache = useUserCacheIndex()

  const source = computed<UserRow[]>(() => {
    const programId = store.programId
    const id = departmentId.value
    if (id === null || programId === null) {
      return list.users.value.map((user) => rowFromUser(user, programId))
    }
    const members = roster.active.value.map((m) =>
      rowFromRoster(m, programId, id, cache.value.get(m.account_id)),
    )
    return sortRows(searchRows(members, search.value), sortOrder.value)
  })

  const status = viewStatus(rosterMode, list, roster, source)

  return {
    ...status,
    sortOrder,
    rosterMode,
    departments,
    source,
    rows: computed(() => filterByTab(source.value, toValue(input).roleTab)),
    counts: computed(() => tabCounts(source.value)),
    loadMore: () => void list.query.fetchNextPage(),
    toggleSort: () => {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    },
    rowFor: (accountId: string) => source.value.find((r) => r.accountId === accountId) ?? null,
  }
}

/** Yükleniyor / hata / tamlık / sayfalama durumu (etkin kaynağa göre). */
function viewStatus(
  rosterMode: ComputedRef<boolean>,
  list: ReturnType<typeof useUserList>,
  roster: ReturnType<typeof useDepartmentRoster>,
  source: ComputedRef<UserRow[]>,
) {
  const active = computed(() => (rosterMode.value ? roster.query : list.query))
  return {
    loading: computed(() => active.value.isPending.value),
    loadError: computed(() =>
      active.value.isError.value && source.value.length === 0
        ? toApiError(active.value.error.value)
        : null,
    ),
    nextError: computed(() =>
      !rosterMode.value && list.query.isFetchNextPageError.value
        ? toApiError(list.query.error.value)
        : null,
    ),
    /** İmleç bitti / tek birim okundu ve sunucu kesmedi: sayılar kesin (§10; CX-F2-K-03). */
    complete: computed(() =>
      rosterMode.value
        ? roster.query.data.value !== undefined && !roster.truncated.value
        : list.complete.value,
    ),
    truncated: computed(() => (rosterMode.value ? roster.truncated.value : list.truncated.value)),
    hasMore: computed(() => !rosterMode.value && list.query.hasNextPage.value === true),
    loadingMore: computed(() => !rosterMode.value && list.query.isFetchingNextPage.value),
    retrying: computed(() => active.value.isFetching.value),
    retry: () => void active.value.refetch(),
  }
}

export type UsersView = ReturnType<typeof useUsersView>

export const USERS_VIEW: InjectionKey<UsersView> = Symbol('organization.users-view')

/** Sayfa: görünümü kurar ve tablo/panel için sağlar. */
export function provideUsersView(input: MaybeRefOrGetter<UsersViewInput>): UsersView {
  const view = useUsersView(input)
  provide(USERS_VIEW, view)
  return view
}

/** Tablo/panel: sayfanın görünümü (yoksa `null`). */
export function injectUsersView(): UsersView | null {
  return inject(USERS_VIEW, null)
}
