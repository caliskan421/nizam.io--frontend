/**
 * Geri / İleri (E-00-33/34). 00-ortak README kabulü: "geçmiş var mı" UYGULAMA İÇİ gezinme
 * yığınıyla izlenir, `history.length` kullanılmaz (dış sitelerin girdilerini de sayar).
 *
 * Yığın vue-router'ın geçmiş kaydıdır: web geçmişi her girdiye uygulama içi önceki (`back`) ve
 * sonraki (`forward`) konumu yazar; uygulamaya ilk girişte `back` boştur, yeni gezinme `forward`'ı
 * siler. Kayıt sayfa yenilemesinde de korunur (tarayıcı `history.state`).
 */
import { computed, onScopeDispose, shallowRef } from 'vue'
import type { Router } from 'vue-router'

export interface NavAvailability {
  canBack: boolean
  canForward: boolean
}

/** Geçmiş kaydından geri/ileri durumu (saf). Kayıt yoksa ikisi de kapalı. */
export function navAvailability(state: unknown): NavAvailability {
  if (typeof state !== 'object' || state === null) return { canBack: false, canForward: false }
  const { back, forward } = state as { back?: unknown; forward?: unknown }
  return { canBack: typeof back === 'string', canForward: typeof forward === 'string' }
}

/** Router'a bağlı geri/ileri durumu; her gezinmede (itme, değiştirme, geri/ileri) güncellenir. */
export function useNavHistory(router: Router) {
  const history = router.options.history
  const availability = shallowRef(navAvailability(history.state))
  const update = () => {
    availability.value = navAvailability(history.state)
  }
  const offAfter = router.afterEach(update)
  const offPop = history.listen(update)
  onScopeDispose(() => {
    offAfter()
    offPop()
  })
  return {
    canBack: computed(() => availability.value.canBack),
    canForward: computed(() => availability.value.canForward),
    back: () => {
      if (availability.value.canBack) router.back()
    },
    forward: () => {
      if (availability.value.canForward) router.forward()
    },
  }
}
