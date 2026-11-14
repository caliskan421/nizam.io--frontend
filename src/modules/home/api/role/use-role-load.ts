/**
 * K1/Ü1 tek yüklemi (KESİN 21, K3; mekanizma §9.2): `countProgramWorkItems` sunucu sayaçları +
 * AYNI süzgeçle `listProgramWorkItems` (`limit` 200) imleçle sürdürülür — aynı ucun sayfalaması
 * fan-out değildir (ortak-kurallar §9). Birim başına ikinci yükleme yoktur. İmleç `MAX_PAGES`
 * sayfada bitmezse küme tam değildir (`complete = false`): istemci türetimleri "yüklenen
 * kayıtlar içinde" diye etiketlenir (P4, ortak-kurallar §10); sayı uydurulmaz.
 *
 * Tamlık bilgisi bütün istemci türevlerine taşınır (CX-F6-E-03): `partial` (veri var, imleç
 * bitmedi), `scope` (`loading` sürüyor / `capped` tavana dayandı / `failed` sonraki sayfa
 * hatası) ve `loaded` (yüklenen kayıt sayısı; "ilk N görev"). `loadMore()` tavanı aşan kullanıcı
 * eylemi ya da hata sonrası yeniden denemedir (tek sayfa). Kesin toplamlar yalnız `counts`'tan.
 *
 * K1: `department` = seçili birim, `assignee` = `null`. Ü1: `department = null` (program geneli),
 * `assignee` = ben (`lensAssignee`; sunucu `assignee_account_id`, BE-038). `enabled` kapalıyken
 * istek yok.
 */
import { computed, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

import { useWorkItemCounts, useWorkItemList } from '@/modules/work/public'

import type { RoleLoadScope } from '../../model/role/common'

export const ROLE_LOAD_MAX_PAGES = 5

export function useRoleLoad(
  department: MaybeRefOrGetter<string | null>,
  assignee: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const assignees = () => {
    const id = toValue(assignee)
    return id === null ? [] : [id]
  }
  const counts = useWorkItemCounts(department, assignees, enabled)
  const { query, items, complete } = useWorkItemList(department, assignees, enabled)

  const pages = computed(() => query.data.value?.pages.length ?? 0)
  // Sonraki sayfa: önceki sayfa yerleşince, hata yokken, tavana kadar (kullanıcı eylemi yok).
  watchEffect(() => {
    if (!toValue(enabled)) return
    if (!query.hasNextPage.value || query.isFetchingNextPage.value) return
    if (query.isFetchNextPageError.value || query.isError.value) return
    if (pages.value === 0 || pages.value >= ROLE_LOAD_MAX_PAGES) return
    void query.fetchNextPage()
  })

  /** Liste hâlâ sürüyor (ilk sayfa ya da tavana kadar devam). */
  const loadingMore = computed(
    () =>
      query.isFetchingNextPage.value ||
      (query.hasNextPage.value === true &&
        pages.value < ROLE_LOAD_MAX_PAGES &&
        !query.isFetchNextPageError.value),
  )
  const partial = computed(() => query.data.value !== undefined && !complete.value)
  const scope = computed<RoleLoadScope | null>(() => {
    if (!partial.value) return null
    if (query.isFetchNextPageError.value) return 'failed'
    return loadingMore.value ? 'loading' : 'capped'
  })
  /** Sonraki sayfa: tavandan sonra devam ya da hata sonrası yeniden deneme (kullanıcı eylemi). */
  function loadMore(): void {
    if (!query.hasNextPage.value || query.isFetchingNextPage.value) return
    void query.fetchNextPage()
  }
  return {
    counts,
    list: query,
    items,
    complete,
    loadingMore,
    partial,
    scope,
    loaded: computed(() => items.value.length),
    loadMore,
  }
}
