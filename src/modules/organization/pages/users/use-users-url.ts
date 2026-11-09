/**
 * 05 URL durumu ve kapsam değişimi (README satır dışı, 03 kalıbı): süzgeç değişimi geçmişe kayıt
 * eklemez (`replace`); panel açma/kapama ekler (`push`: geri tuşu paneli kapatır). Kapsam
 * (program/mercek/birim) değişince arama ve rol sekmesi korunur; koordinatörlük süzgeci, `secili`
 * ve imleç sıfırlanır (`usersQueryAfterScopeChange`; imleç anahtarla düşer). `onReset` açık
 * diyalogları kapatmak içindir. Kapsamın ilk çözümü (program yokken program seçilmesi) değişim
 * sayılmaz (S1 rotası kapsamdan önce çizilir).
 */
import { computed, onScopeDispose } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { USERS_ROUTE, usersQueryAfterScopeChange } from '../../routes'
import { parseUsersQuery, usersQuery, type UsersUrlState } from './url-state'

export function useUsersUrl(onReset: () => void = () => {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useScopeStore()
  const state = computed(() => parseUsersQuery(route.query))

  function update(patch: Partial<UsersUrlState>, history: 'push' | 'replace' = 'replace') {
    const query = usersQuery({ ...state.value, ...patch })
    return router[history]({ name: USERS_ROUTE.name, query })
  }

  // S1 rotası kapsam çözülmeden çizilir: ilk çözüm (program yok → program) kapsam DEĞİŞİMİ
  // değildir; derin bağlantıdaki `secili`/`koordinatorluk` korunur.
  const stop = store.onChange((_current, previous) => {
    if (previous.programId === null) return
    onReset()
    const kept = parseUsersQuery(usersQueryAfterScopeChange(route.query))
    void router.replace({ name: USERS_ROUTE.name, query: usersQuery(kept) })
  })
  onScopeDispose(stop)

  return { state, update }
}
