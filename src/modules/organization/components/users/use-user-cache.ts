/**
 * Önbellekteki kullanıcı kayıtlarının dizini (hesap kimliği → `KnownUser`): yüklenmiş `listUsers`
 * sayfaları ve `readUser` sonuçları (BE-043). İstek atmaz; önbellek değiştikçe yeniden hesaplanır.
 */
import { useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/vue-query'
import { computed, onScopeDispose, ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

import type { KnownUser, UserPage } from '../../model/types'

const USERS_ROOT = queryKeys.users.all()[0]

export function useUserCacheIndex() {
  const queryClient = useQueryClient()
  const version = ref(0)
  let queued = false
  // Yalnız veri değişimi (gözlemci ekle/çıkar olayları değil); bir sonraki mikro görevde tek
  // artış — render sırasında doğan önbellek olayı aynı render'ı yeniden tetiklemez.
  const stop = queryClient.getQueryCache().subscribe((event) => {
    if (event.query.queryKey[0] !== USERS_ROOT || queued) return
    if (event.type !== 'updated' && event.type !== 'removed') return
    queued = true
    queueMicrotask(() => {
      queued = false
      version.value += 1
    })
  })
  onScopeDispose(stop)

  return computed(() => {
    void version.value
    const index = new Map<string, KnownUser>()
    return collectCachedUsers(queryClient, index)
  })
}

/** Önbellekteki liste sayfaları + tekil okumalar (`readUser`) → hesap kimliğine göre kayıt. */
export function collectCachedUsers(
  queryClient: QueryClient,
  index = new Map<string, KnownUser>(),
): Map<string, KnownUser> {
  const cached = queryClient.getQueriesData<InfiniteData<UserPage> | KnownUser>({
    queryKey: queryKeys.users.all(),
  })
  for (const [, data] of cached) {
    if (data && 'account_id' in data) {
      if (!index.has(data.account_id)) index.set(data.account_id, data)
      continue
    }
    for (const page of Array.isArray(data?.pages) ? data.pages : []) {
      for (const user of page.page.users ?? []) {
        if (!index.has(user.account_id)) index.set(user.account_id, user)
      }
    }
  }
  return index
}
