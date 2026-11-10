/**
 * 05b kişi bilgisi (E-05-40…44). Kaynak sırası (BE-043, v0.14):
 *
 *  1. Kullanıcı önbelleği (`['users', …]`: yüklenmiş liste sayfaları ve `readUser` sonuçları).
 *  2. Önbellekte yoksa `readUser` (tek istek; ek `listUsers` taraması / ad ile arama yok).
 *  3. Ad için son çare görevlerin `assignees[].full_name`'i; o da yoksa "Bilinmeyen kişi".
 *
 * Roller ve birimler yalnız `memberships` etiketlerinden (seçili program; E-05-43/44); kişi
 * bulunamazsa (404 `organization.account_not_found`) `user = null`.
 */
import { useQueryClient } from '@tanstack/vue-query'
import { computed, onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter } from 'vue'

import type { WorkItem } from '@/modules/work/public'
import { useStanding } from '@/shared/scope/standing'

import { useUser } from '../../api'
import { administrationFacts, canSeeAdministration } from '../../model/capabilities'
import type { KnownUser } from '../../model/types'
import { collectCachedUsers } from '../users/use-user-cache'

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

  const findCached = (id: string) => collectCachedUsers(queryClient).get(id) ?? null

  const cached = shallowRef<KnownUser | null>(findCached(toValue(accountId)))
  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    const next = findCached(toValue(accountId))
    if (next !== cached.value) cached.value = next
  })
  onScopeDispose(unsubscribe)

  const itemName = computed(() => nameFromItems(toValue(items), toValue(accountId)))
  const allowed = computed(() => canSeeAdministration(administrationFacts(standing.value)))
  const lookup = useUser(accountId, () => allowed.value && cached.value === null)
  const looked = computed(
    () =>
      lookup.query.isError.value ||
      (lookup.query.isFetched.value && !lookup.query.isFetching.value),
  )

  const user = computed(() => cached.value ?? lookup.user.value)
  const name = computed(() => user.value?.full_name.trim() || itemName.value || null)
  /** Ad/üyelik kaynakları tükendi mi (yükleniyor iskeletinden "Bilinmeyen kişi"ye geçiş). */
  const resolved = computed(
    () => user.value !== null || (toValue(settled) && (looked.value || !allowed.value)),
  )

  return { user, name, resolved }
}
