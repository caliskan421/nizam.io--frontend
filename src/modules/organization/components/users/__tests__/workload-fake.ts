// Birim testleri için sahte iş yükü seçimi (sağlayıcı sözleşmesi: `WorkloadSelection`).
import { computed, ref } from 'vue'

import type { WorkloadSelection } from '../use-workload-selection'

export function fakeSelection(
  options: { enabled?: boolean; programReady?: boolean; picked?: string[]; blocked?: boolean } = {},
): WorkloadSelection {
  const picked = ref(new Set(options.picked ?? []))
  return {
    enabled: computed(() => options.enabled ?? true),
    programReady: computed(() => options.programReady ?? true),
    ids: computed(() => [...picked.value]),
    count: computed(() => picked.value.size),
    isSelected: (id) => picked.value.has(id),
    canPick: () => options.blocked !== true,
    toggle(id) {
      const next = new Set(picked.value)
      if (!next.delete(id)) next.add(id)
      picked.value = next
    },
    setMany(ids, on) {
      const next = new Set(picked.value)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      picked.value = next
    },
    clear: () => (picked.value = new Set()),
  }
}
