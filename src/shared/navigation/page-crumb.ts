/**
 * Konum izinin (E-00-35) dinamik son parçası: kayıt sayfasının verdiği etiket (08b birim adı,
 * 05b kişi adı). Sayfa `usePageCrumb(() => ad | null)` çağırır; etiket yalnız sayfa bağlıyken ve
 * değer `null` değilken geçerlidir, sayfa sökülünce düşer. Etiket yokken kabuk katalog başlığını
 * gösterir (veri gelmeden sahte ad yok). Modüller `app/`'i göremediği için durum `shared`'dadır;
 * okuyan yalnız kabuk (`app/shell/topbar`).
 */
import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
} from 'vue'

interface Claim {
  owner: symbol
  label: string
}

const claim = shallowRef<Claim | null>(null)

/** Kabuğun okuduğu etiket (yoksa `null` → katalog başlığı). */
export const pageCrumb = computed(() => claim.value?.label ?? null)

/** Sayfanın son parça etiketi; bileşen kurulumunda çağrılır. */
export function usePageCrumb(label: MaybeRefOrGetter<string | null>): void {
  const owner = Symbol('page-crumb')
  const release = () => {
    if (claim.value?.owner === owner) claim.value = null
  }
  watchEffect(() => {
    const text = toValue(label)?.trim() ?? ''
    if (text) claim.value = { owner, label: text }
    else release()
  })
  if (getCurrentScope()) onScopeDispose(release)
}
