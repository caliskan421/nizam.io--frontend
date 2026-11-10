/**
 * Açılmış alt görev satırlarının Gantt durumu (03d E-03C-33): hangi görevler açık, her açık
 * bloğun satır sayısı (yükleniyor / boş / hata = 1). Bellek durumudur (URL `altgorev` yalnız
 * `kapali`); kapsam değişince Gantt yeniden kurulduğundan kendiliğinden sıfırlanır.
 */
import { computed, ref } from 'vue'

export function useSubtaskRows() {
  const open = ref<ReadonlySet<string>>(new Set())
  const counts = ref<ReadonlyMap<string, number>>(new Map())

  /** `buildLayout` girdisi: açık görev → alt satır sayısı (henüz bilinmiyorsa 1). */
  const rows = computed(
    () => new Map([...open.value].map((id) => [id, counts.value.get(id) ?? 1] as const)),
  )

  function toggle(workItemId: string): void {
    const next = new Set(open.value)
    if (!next.delete(workItemId)) next.add(workItemId)
    open.value = next
  }

  function setCount(workItemId: string, count: number): void {
    if (counts.value.get(workItemId) === count) return
    counts.value = new Map(counts.value).set(workItemId, count)
  }

  return { open, rows, toggle, setCount }
}
