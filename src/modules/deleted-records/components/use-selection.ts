/**
 * Satır seçimi (E-12-21…23; BE-114): yüklenen satırlar içinde onay kutusuyla seçilen kimlikler.
 * Seçim türe, süzgece, sıraya ve kapsama/oturuma bağlıdır: `resetOn` değişince, kapsam ya da
 * oturum değişince temizlenir; liste yenilenince listede olmayan kimlikler düşer (silinmiş/
 * işlenmiş kayıt seçili kalmaz). Seçim yalnız yüklenen kümedir: "tümünü seç" bu sayfaları kapsar.
 */
import { computed, shallowRef, watch } from 'vue'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import type { DeletedRow } from '../model/types'

export function useSelection(rows: () => readonly DeletedRow[], resetOn: () => unknown) {
  const ids = shallowRef<ReadonlySet<string>>(new Set())
  const loaded = computed(() => rows())
  const selectedRows = computed(() => loaded.value.filter((row) => ids.value.has(row.id)))

  const clear = () => {
    if (ids.value.size > 0) ids.value = new Set()
  }
  const toggle = (id: string) => {
    const next = new Set(ids.value)
    if (!next.delete(id)) next.add(id)
    ids.value = next
  }
  const allSelected = computed(
    () => loaded.value.length > 0 && selectedRows.value.length === loaded.value.length,
  )
  const toggleAll = () => {
    ids.value = allSelected.value ? new Set() : new Set(loaded.value.map((row) => row.id))
  }
  /** Yalnız verilen kimlikleri bırakır (işlemden sonra başarısız olanlar seçili kalır). */
  const keepOnly = (keep: readonly string[]) => {
    ids.value = new Set(keep.filter((id) => ids.value.has(id)))
  }

  watch(resetOn, clear)
  watch(loaded, (list) => {
    const live = new Set(list.map((row) => row.id))
    const next = [...ids.value].filter((id) => live.has(id))
    if (next.length !== ids.value.size) ids.value = new Set(next)
  })
  const stopScope = useScopeStore().onChange(clear)
  const stopSession = authSession.subscribe(clear)

  return {
    ids,
    selectedRows,
    count: computed(() => ids.value.size),
    allSelected,
    some: computed(() => selectedRows.value.length > 0 && !allSelected.value),
    toggle,
    toggleAll,
    clear,
    keepOnly,
    dispose: () => {
      stopScope()
      stopSession()
    },
  }
}
