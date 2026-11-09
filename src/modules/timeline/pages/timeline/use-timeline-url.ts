/**
 * Zaman çizelgesi URL durumu (K10). Süzgeç/ölçek değişimi geçmişe yeni kayıt eklemez
 * (`replace`); görev seçimi ekler (`push`: geri tuşu paneli kapatır). Kapsam (program / mercek /
 * birim) değişince (03c satır dışı varsayım 8) Gantt, seçili görev ve bekleyen gecikmeli
 * gönderim düşer; ölçek, durum süzgeci ve alt görev gösterimi korunur (`departman`, `secili`
 * sıfırlanır — `timelineQueryAfterScopeChange`). `onReset` bellekteki durumu (görünen aralık,
 * odak izi) temizlemek içindir.
 */
import { computed, onScopeDispose } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { TIMELINE_ROUTE, timelineQueryAfterScopeChange } from '../../routes'
import { parseTimelineQuery, timelineQuery, type TimelineUrlState } from './url-state'

export function useTimelineUrl(onReset: () => void = () => {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useScopeStore()
  const state = computed(() => parseTimelineQuery(route.query))

  function update(patch: Partial<TimelineUrlState>, history: 'push' | 'replace' = 'replace') {
    const query = timelineQuery({ ...state.value, ...patch })
    return router[history]({ name: TIMELINE_ROUTE.name, query })
  }

  const stop = store.onChange(() => {
    onReset()
    const kept = parseTimelineQuery(timelineQueryAfterScopeChange(route.query))
    void router.replace({ name: TIMELINE_ROUTE.name, query: timelineQuery(kept) })
  })
  onScopeDispose(stop)

  return { state, update }
}
