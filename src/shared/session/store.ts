import type { QueryClient } from '@tanstack/vue-query'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { api, authSession } from '@/shared/http'
import { unwrap } from '@/shared/http/unwrap'
import type { components } from '@/shared/api/schema'
import { signOut, type SignOutOutcome } from '@/shared/scope/sign-out'
import { useScopeStore } from '@/shared/scope/store'

type LoginRequest = components['schemas']['LoginRequest']
type MeResponse = components['schemas']['MeResponse']

/**
 * Parola değişimi başarılı (`changePassword` 200): sunucu bu hesabın BÜTÜN oturumlarını düşürdü
 * ve yenileme çerezini temizledi (IDENTITY-K15/K16) — doğrulanmış çıkışla aynı sonuç. Çıkış
 * isteği atılmaz (oturum zaten yok); bellek, sorgu önbelleği ve kapsam çıkıştaki gibi temizlenir,
 * kardeş sekmelere bildirilir. Kullanıcı yeni parolasıyla açıkça giriş yapar (W83 K-1).
 */
function endLocally(queryClient: QueryClient | null): void {
  authSession.clear()
  if (queryClient) {
    void queryClient.cancelQueries()
    queryClient.clear()
  }
  const scope = useScopeStore()
  scope.reset()
  scope.forgetRemembered()
}

/**
 * Oturum deposu (Pinia setup store). Belirteç bu depoda DEĞİLDİR (devtools/serileştirme
 * yüzeyine girmesin); yalnız `AuthSession`'ın özel alanındadır. Depo durumu yansıtır.
 */
export const useSessionStore = defineStore('session', () => {
  const state = shallowRef(authSession.snapshot)
  authSession.subscribe((s) => {
    state.value = s
  })

  const status = computed(() => state.value.status)
  const accountId = computed(() => state.value.accountId)
  const forcePasswordChange = computed(() => state.value.forcePasswordChange)
  const isAuthenticated = computed(() => state.value.status === 'authenticated')
  /** Son çıkışta sunucu doğrulaması alınamadı (ortak-kurallar §8); açık girişe kadar sürer. */
  const serverLogoutUnverified = computed(() => state.value.serverLogoutUnverified)
  const me = shallowRef<MeResponse | null>(null)

  /**
   * Açılışta sessiz refresh: HttpOnly çerez geçerliyse oturum döner; 401 → `anonymous`.
   * Ağ/5xx hatasında oturum hakkında hüküm yoktur → `unavailable` (yeniden denenebilir;
   * `ended` DEĞİL). `unavailable` iken yeniden çağrılabilir.
   */
  async function bootstrap(): Promise<void> {
    const current = state.value.status
    if (current !== 'unknown' && current !== 'unavailable') return
    // Doğrulanamayan çıkıştan sonra çerezle sessiz giriş yok; yalnız açık giriş (§8).
    if (state.value.serverLogoutUnverified) return
    const outcome = await authSession.refresh(null)
    if (outcome === 'failed' && authSession.snapshot.status !== 'authenticated') {
      authSession.markUnavailable()
    }
  }

  /**
   * Açık giriş. Nesil istekten önce alınır: yanıt gelmeden çıkış olduysa (bu ya da kardeş
   * sekmede) yanıt uygulanmaz, oturum anonim kalır (CX-F0-E-03).
   */
  async function login(body: LoginRequest): Promise<void> {
    const generation = authSession.generation
    const response = await unwrap(api.POST('/v1/auth/login', { body }))
    authSession.establish(response, response.force_password_change, generation)
  }

  async function loadMe(): Promise<MeResponse | null> {
    // 403 identity.force_password_change_required bayrağı HTTP ara katmanında işlenir;
    // hata çağırana normalize ApiError olarak geçer.
    me.value = null
    me.value = await unwrap(api.GET('/v1/me'))
    return me.value
  }

  /**
   * Çıkış (E-00-29): `scope/sign-out.ts` `signOut` — API çağrısı, bellek/önbellek/kapsam
   * temizliği, diğer sekmelere bildirim. Başarısız/zaman aşımı → `server_unverified`.
   * `queryClient` verilirse sorgu önbelleği de boşaltılır (bileşende `useQueryClient()`).
   */
  async function logout(queryClient: QueryClient | null = null): Promise<SignOutOutcome> {
    try {
      return await signOut(queryClient)
    } finally {
      me.value = null
    }
  }

  /** Parola değişimi başarılı: `endLocally` (aşağıda); `me` de boşaltılır. */
  function endAfterPasswordChange(queryClient: QueryClient | null = null): void {
    endLocally(queryClient)
    me.value = null
  }

  return {
    status,
    accountId,
    forcePasswordChange,
    isAuthenticated,
    serverLogoutUnverified,
    me,
    bootstrap,
    login,
    loadMe,
    logout,
    endAfterPasswordChange,
  }
})
