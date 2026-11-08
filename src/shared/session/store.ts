import type { QueryClient } from '@tanstack/vue-query'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { api, authSession } from '@/shared/http'
import { unwrap } from '@/shared/http/unwrap'
import type { components } from '@/shared/api/schema'
import { signOut, type SignOutOutcome } from '@/shared/scope/sign-out'

type LoginRequest = components['schemas']['LoginRequest']
type MeResponse = components['schemas']['MeResponse']

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

  async function login(body: LoginRequest): Promise<void> {
    const response = await unwrap(api.POST('/v1/auth/login', { body }))
    authSession.establish(response, response.force_password_change)
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
  }
})
