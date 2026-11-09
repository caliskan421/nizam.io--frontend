/**
 * 08 liste URL durumu ve kapsam değişimi (08 README satır dışı: "Kapsam (program) değişince
 * arama/görünüm korunur, sıralama varsayılana döner"). Süzgeç değişimi geçmişe kayıt eklemez
 * (`replace`). `onReset` bellekteki durumu (açık diyalog/menü) kapatmak içindir.
 */
import { computed, onScopeDispose } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { COORDINATORSHIPS_ROUTE, coordinatorshipsQueryAfterScopeChange } from '../../routes'
import { coordsQuery, parseCoordsQuery, type CoordsUrlState } from './url-state'

export function useCoordsUrl(onReset: () => void = () => {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useScopeStore()
  const state = computed(() => parseCoordsQuery(route.query))

  function update(patch: Partial<CoordsUrlState>) {
    return router.replace({
      name: COORDINATORSHIPS_ROUTE.name,
      query: coordsQuery({ ...state.value, ...patch }),
    })
  }

  const stop = store.onChange(() => {
    onReset()
    const kept = parseCoordsQuery(coordinatorshipsQueryAfterScopeChange(route.query))
    void router.replace({ name: COORDINATORSHIPS_ROUTE.name, query: coordsQuery(kept) })
  })
  onScopeDispose(stop)

  return { state, update }
}
