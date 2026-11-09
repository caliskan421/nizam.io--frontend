/**
 * Önbellekteki `listUsers` kayıtlarının dizini (hesap kimliği → `KnownUser`). Tekil kullanıcı
 * okuma ucu yoktur (BE-043): yan panel ve koordinatörlük süzgecindeki satırlar kişiyi yalnız
 * yüklenmiş liste sayfalarından tanır. İstek atmaz; önbellek değiştikçe yeniden hesaplanır.
 */
import { useQueryClient, type InfiniteData } from '@tanstack/vue-query'
import { computed, onScopeDispose, ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

import type { KnownUser, UserPage } from '../../model/types'

const USERS_ROOT = queryKeys.users.all()[0]

export function useUserCacheIndex() {
  const queryClient = useQueryClient()
  const version = ref(0)
  const stop = queryClient.getQueryCache().subscribe((event) => {
    if (event.query.queryKey[0] === USERS_ROOT) version.value += 1
  })
  onScopeDispose(stop)

  return computed(() => {
    void version.value
    const index = new Map<string, KnownUser>()
    const cached = queryClient.getQueriesData<InfiniteData<UserPage>>({
      queryKey: queryKeys.users.all(),
    })
    for (const [, data] of cached) {
      for (const page of Array.isArray(data?.pages) ? data.pages : []) {
        for (const user of page.page.users ?? []) {
          if (!index.has(user.account_id)) index.set(user.account_id, user)
        }
      }
    }
    return index
  })
}
