/**
 * Öneri listeleri (E-10-50/61): `@` → sohbet üyeleri, ilgili koordinatörlükler, "herkes" (yalnız
 * grupta ve yönetici/kurucuya); `#` → program görevleri (`listProgramWorkItems`; `q` yok → yüklenen
 * sayfalarda istemci süzmesi + "Daha fazla yükle", GAP-212). Görev özeti sohbetteki herkese
 * görünür; görevi açmak görev yetkisi ister (P60: kilit yok, "<n> kişi kilitli görür" yok).
 */
import { computed, ref, watch, type Ref } from 'vue'

import { useWorkItemList } from '@/modules/work/public'

import type { ThreadContext } from '../thread/use-thread'
import { mentionOptions, taskOptions, type SuggestOption } from './suggest-options'
import { detectTrigger, type Trigger } from './suggest'

export type { SuggestOption }

export function useSuggest(text: Ref<string>, caret: Ref<number>, thread: ThreadContext) {
  const trigger = computed<Trigger | null>(() => detectTrigger(text.value, caret.value))
  const sign = computed(() => trigger.value?.sign ?? null)
  const dismissed = ref<string | null>(null)
  const index = ref(0)
  const work = useWorkItemList(null, undefined, () => sign.value === '#')

  const key = (t: Trigger) => `${t.sign}:${t.start}`
  const open = computed(() => trigger.value !== null && dismissed.value !== key(trigger.value))

  const options = computed<SuggestOption[]>(() => {
    if (!open.value) return []
    const query = trigger.value?.query ?? ''
    if (sign.value === '#') return taskOptions(query, work.items.value, thread.departmentCode)
    return mentionOptions(query, {
      chat: thread.chat.value,
      allowAll: thread.caps.value?.mentionAll === true,
      departments: thread.departments.value,
      members: thread.members.value,
      meId: thread.meId.value,
    })
  })
  watch([() => options.value.length, () => trigger.value?.query], () => {
    index.value = 0
  })
  watch(
    () => trigger.value === null,
    (none) => {
      if (none) dismissed.value = null
    },
  )

  return {
    trigger,
    sign,
    open,
    options,
    index,
    /** `#` listesi için: yüklenmemiş sayfa var mı / yükleniyor mu. */
    hasMore: computed(() => sign.value === '#' && work.query.hasNextPage.value === true),
    loading: computed(() => sign.value === '#' && work.query.isFetching.value),
    loadMore: () => void work.query.fetchNextPage(),
    move(step: 1 | -1): void {
      const n = options.value.length
      if (n > 0) index.value = (index.value + step + n) % n
    },
    dismiss(): void {
      if (trigger.value) dismissed.value = key(trigger.value)
    },
  }
}
