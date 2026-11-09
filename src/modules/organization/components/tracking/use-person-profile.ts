/**
 * 05b kişi bilgisi (E-05-40…44). Tekil kullanıcı okuma ucu yok (BE-043); kaynak sırası:
 *
 *  1. 05 liste önbelleği (`['users', …]` anahtarlı her sonsuz sorgu; ek istek yok).
 *  2. Önbellekte yoksa TEK `listUsers` sayfası: kişinin görevlerinden ad biliniyorsa o adla
 *     `search` (yalnız ad aranır, E-05-07), bilinmiyorsa varsayılan liste (05 ile aynı anahtar).
 *     Görev çekimi bitmeden (`settled`) başlatılmaz: ad önce görevlerden gelebilir.
 *  3. Ad için son çare görevlerin `assignees[].full_name`'i; o da yoksa "Bilinmeyen kişi".
 *
 * Roller ve birimler yalnız `memberships` etiketlerinden (seçili program; E-05-43/44); kişi
 * bulunamazsa `user = null` (rozet ve birim satırı çizilmez, "Görev ata" seçeneği okunamaz).
 */
import { useQueryClient, type InfiniteData } from '@tanstack/vue-query'
import { computed, onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter } from 'vue'

import type { WorkItem } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { useStanding } from '@/shared/scope/standing'

import { useUserList } from '../../api'
import { administrationFacts, canSeeAdministration } from '../../model/capabilities'
import type { KnownUser, UserPage } from '../../model/types'

type PersonItem = Pick<WorkItem, 'assignees'>

/** Görevlerin atanan listesinden kişinin adı (boş/`null` yok sayılır). */
export function nameFromItems(items: readonly PersonItem[], accountId: string): string | null {
  for (const item of items) {
    for (const person of item.assignees) {
      const name = person.account_id === accountId ? person.full_name?.trim() : undefined
      if (name) return name
    }
  }
  return null
}

export function usePersonProfile(
  accountId: MaybeRefOrGetter<string>,
  items: MaybeRefOrGetter<readonly PersonItem[]>,
  settled: MaybeRefOrGetter<boolean>,
) {
  const queryClient = useQueryClient()
  const { standing } = useStanding()

  function findCached(id: string): KnownUser | null {
    const entries = queryClient.getQueriesData<InfiniteData<UserPage>>({
      queryKey: queryKeys.users.all(),
    })
    for (const [, data] of entries) {
      for (const page of data?.pages ?? []) {
        const hit = page.page.users?.find((u) => u.account_id === id)
        if (hit) return hit
      }
    }
    return null
  }

  const cached = shallowRef<KnownUser | null>(findCached(toValue(accountId)))
  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    const next = findCached(toValue(accountId))
    if (next !== cached.value) cached.value = next
  })
  onScopeDispose(unsubscribe)

  const itemName = computed(() => nameFromItems(toValue(items), toValue(accountId)))
  const allowed = computed(() => canSeeAdministration(administrationFacts(standing.value)))
  const lookup = useUserList(
    () => ({ search: itemName.value, sortOrder: 'asc' }),
    () => allowed.value && cached.value === null && toValue(settled),
  )
  const looked = computed(
    () =>
      lookup.query.isError.value ||
      (lookup.query.isFetched.value && !lookup.query.isFetching.value),
  )

  const user = computed(
    () =>
      cached.value ?? lookup.users.value.find((u) => u.account_id === toValue(accountId)) ?? null,
  )
  const name = computed(() => user.value?.full_name.trim() || itemName.value || null)
  /** Ad/üyelik kaynakları tükendi mi (yükleniyor iskeletinden "Bilinmeyen kişi"ye geçiş). */
  const resolved = computed(
    () => user.value !== null || (toValue(settled) && (looked.value || !allowed.value)),
  )

  return { user, name, resolved }
}
