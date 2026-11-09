/**
 * Organizasyon ekranlarının görev okuması — work sorgusunun YENİDEN kullanımı (`work/public.ts`;
 * ayrı uç/anahtar yok). Tek uç `listProgramWorkItems`, sonuna dek imleçli sayfalama (aynı ucun
 * sayfalaması fan-out değildir, ortak-kurallar §9); sayfalar sürerken `complete = false` →
 * sayaçlar "yüklenen kayıtlar içinde" (§10).
 *
 *  - 08b tek birim (E-08-66/68/81/83): `department_id = birim` (kullanıcının açtığı tek kayıt).
 *  - 05 panel özeti ve 05b kişisel takip (E-05-29, E-05-49…75): `department_id` YOK (program
 *    geneli), kişiye süzme istemcide TEK yüklemle (`assignedSubset`, KESİN 21; BE-038). 05 ve 05b
 *    AYNI anahtarı paylaşır.
 */
import { computed, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

import { assignedSubset, useWorkItemList } from '@/modules/work/public'

/** Görev listesini sonuna dek çeker (imleç bitene, hata olana ya da sorgu kapanana dek). */
export function useAllWorkItemPages(departmentId: MaybeRefOrGetter<string | null>) {
  const list = useWorkItemList(departmentId)
  const { query } = list
  watchEffect(() => {
    const idle = !query.isFetching.value && !query.isError.value
    if (idle && query.hasNextPage.value) void query.fetchNextPage()
  })
  return list
}

/** Tek birimin görevleri (08b): yalnız o birimin `department_id` süzgeciyle tek uç. */
export function useDepartmentWorkItems(departmentId: MaybeRefOrGetter<string>) {
  return useAllWorkItemPages(() => toValue(departmentId))
}

/** Kişinin görevleri (05 E-05-29, 05b): program geneli liste ∩ `assignee_account_ids ∋ kişi`. */
export function usePersonWorkItems(accountId: MaybeRefOrGetter<string>) {
  const list = useAllWorkItemPages(null)
  return {
    query: list.query,
    complete: list.complete,
    items: computed(() => assignedSubset(list.items.value, toValue(accountId))),
  }
}
