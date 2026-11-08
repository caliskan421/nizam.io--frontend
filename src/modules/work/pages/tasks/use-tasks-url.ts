/**
 * Görev listesi URL durumu (K10) ve kapsam değişimi davranışı. Süzgeç değişimi geçmişe yeni
 * kayıt eklemez (`replace`); panel açma/kapama ekler (`push`: geri tuşu paneli kapatır).
 *
 * Kapsam (program / mercek / birim) değişince (03 README satır dışı varsayım, kabul): arama,
 * sekme, talep süzgeci ve sıralama korunur; koordinatörlük süzgeci, açık panel ve imleç sıfırlanır
 * (`tasksQueryAfterScopeChange`; imleç sonsuz sorgu anahtarıyla zaten düşer). `onReset` bellekteki
 * durumu (açık alt görev blokları, panel sekmesi) temizlemek içindir.
 */
import { computed, onScopeDispose } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { TASKS_ROUTE, tasksQueryAfterScopeChange } from '../../routes'
import { parseTasksQuery, tasksQuery, type TasksUrlState } from './url-state'

export function useTasksUrl(onReset: () => void = () => {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useScopeStore()
  const state = computed(() => parseTasksQuery(route.query))

  function update(patch: Partial<TasksUrlState>, history: 'push' | 'replace' = 'replace') {
    const query = tasksQuery({ ...state.value, ...patch })
    return router[history]({ name: TASKS_ROUTE.name, query })
  }

  function href(patch: Partial<TasksUrlState>): string {
    return router.resolve({
      name: TASKS_ROUTE.name,
      query: tasksQuery({ ...state.value, ...patch }),
    }).href
  }

  const stop = store.onChange(() => {
    onReset()
    const kept = parseTasksQuery(tasksQueryAfterScopeChange(route.query))
    void router.replace({ name: TASKS_ROUTE.name, query: tasksQuery(kept) })
  })
  onScopeDispose(stop)

  return { state, update, href }
}
