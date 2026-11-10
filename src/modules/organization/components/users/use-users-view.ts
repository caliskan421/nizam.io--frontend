/**
 * 05 Kullanıcılar veri görünümü (E-05-03, E-05-06…08, E-05-10, E-05-13…24). Sayfa bir kez kurar
 * ve `provideUsersView` ile tabloya/panele verir (aynı sorgu, aynı sıralama durumu); bağlam yoksa
 * tablo kendi örneğini kurar (prop/emit sözleşmesi değişmez).
 *
 *  - Kaynak TEK uç: şirket geneli `listUsers` (S1, imleçli, "Daha fazla yükle"). Rol sekmesi
 *    (`role`), arama (`search`: ad ya da e-posta), koordinatörlük süzgeci (`program_id` +
 *    `department_id`) ve sıralama SUNUCUDA (BE-011/041/042, v0.14); tek birim için ayrı
 *    `listMembers` yoktur. Süzgeçsiz "Tümü" ekip satırsız hesapları da içerir (BE-045).
 *  - Sayılar sunucudan: liste toplamı `total`, sekme sayaçları `role_counts` (ayrı `limit=1`
 *    okumalar, bkz. `useUserCounts`); yüklenen satır sayılmaz. K/Ü sekmeleri seçili programa
 *    daralır (`program_id`), Tümü/Admin şirket geneli kalır.
 *  - Sıralama "kullanıcı ↑/↓" sunucuda; yön değişince yeni anahtar → eski imleç kullanılmaz.
 */
import {
  computed,
  inject,
  provide,
  ref,
  toValue,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useScopeStore } from '@/shared/scope/store'

import { useProgramDepartmentIndex, useUserCounts, useUserList } from '../../api'
import {
  countsByTab,
  isProgramScopedTab,
  userRoleFilterOf,
  type UserRoleTab,
} from '../../model/capabilities'
import type { SortOrder } from '../../model/types'
import { rowFromUser, type UserRow } from './user-rows'

export interface UsersViewInput {
  roleTab: UserRoleTab
  search: string
  departmentId: string | null
}

const NO_COUNTS: Record<UserRoleTab, number> = { tumu: 0, admin: 0, koordinator: 0, uye: 0 }

export function useUsersView(input: MaybeRefOrGetter<UsersViewInput>) {
  const store = useScopeStore()
  const sortOrder = ref<SortOrder>('asc')
  const search = computed(() => toValue(input).search.trim())
  const departmentId = computed(() =>
    store.programId === null ? null : toValue(input).departmentId,
  )

  const tab = computed(() => toValue(input).roleTab)
  // Tümü/Admin şirket geneli (ekip satırsız hesaplar dahil — BE-045; Admin şirket olgusu);
  // Koordinatör/Üye seçili programın rolleri (`program_id` rol süzgecini o programa daraltır —
  // G16): satırdaki etiketlerle aynı kapsam. Koordinatörlük süzgeci her zaman program+departman.
  const scopedTab = computed(() => isProgramScopedTab(tab.value))
  const programId = computed(() =>
    departmentId.value !== null || scopedTab.value ? store.programId : null,
  )

  const list = useUserList(() => ({
    search: search.value || null,
    sortOrder: sortOrder.value,
    role: userRoleFilterOf(tab.value),
    programId: programId.value,
    departmentId: departmentId.value,
  }))
  const departments = useProgramDepartmentIndex()

  // Sayaçlar sekmeden bağımsız ayrı okumalardan: sekme değişince titremez (`useUserCounts`).
  const tabCounts = useUserCounts(() => ({
    search: search.value || null,
    programId: store.programId,
    departmentId: departmentId.value,
  }))

  const source = computed<UserRow[]>(() =>
    list.users.value.map((user) => rowFromUser(user, store.programId)),
  )

  return {
    ...viewStatus(list),
    sortOrder,
    departments,
    source,
    rows: source,
    /** Süzgeçlere uyan toplam hesap (sunucu `total`); yüklenmediyse `null`. */
    total: list.total,
    counts: computed(() =>
      tabCounts.counts.value ? countsByTab(tabCounts.counts.value) : NO_COUNTS,
    ),
    loadMore: () => void list.query.fetchNextPage(),
    toggleSort: () => {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    },
    rowFor: (accountId: string) => source.value.find((r) => r.accountId === accountId) ?? null,
  }
}

/** Yükleniyor / hata / tamlık / sayfalama durumu. */
function viewStatus(list: ReturnType<typeof useUserList>) {
  const query = list.query
  return {
    loading: computed(() => query.isPending.value),
    loadError: computed(() =>
      query.isError.value && list.users.value.length === 0 ? toApiError(query.error.value) : null,
    ),
    nextError: computed(() =>
      query.isFetchNextPageError.value ? toApiError(query.error.value) : null,
    ),
    /** İmleç bitti ve sunucu kesmedi: yüklenen küme listenin tamamıdır (§10; CX-F2-K-03). */
    complete: list.complete,
    truncated: list.truncated,
    hasMore: computed(() => query.hasNextPage.value === true),
    loadingMore: computed(() => query.isFetchingNextPage.value),
    retrying: computed(() => query.isFetching.value),
    retry: () => void query.refetch(),
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
