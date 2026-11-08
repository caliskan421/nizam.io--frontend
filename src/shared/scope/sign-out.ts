/**
 * Kapsam farkında çıkış (E-00-29; ortak-kurallar §8, CX-S-10).
 *
 *  - `POST /v1/auth/logout` (CSRF başlığı HTTP ara katmanında). Onay penceresi yok.
 *  - Sonuç ne olursa olsun: bellekteki erişim belirteci silinir (diğer sekmelere bildirilir),
 *    sorgu önbelleği boşaltılır, kapsam bellekten ve hatırlananlardan silinir (`scope.*`;
 *    `ui.theme` kalır).
 *  - İstek başarısız / zaman aşımı → durum "sunucu çıkışı doğrulanamadı": HttpOnly yenileme
 *    çerezinin iptal edildiği VARSAYILMAZ, sessiz yenileme denenmez, kullanıcıya kısa uyarı
 *    gösterilir (metin kabuk/giriş ekranında, i18n'den; sunucu `message` alanı kullanılmaz).
 */
import type { QueryClient } from '@tanstack/vue-query'
import { readonly, ref } from 'vue'

import { api, authSession, unwrap } from '@/shared/http'

import { useScopeStore } from './store'

export type SignOutOutcome = 'verified' | 'server_unverified'

export const SIGN_OUT_TIMEOUT_MS = 10_000

const notice = ref<SignOutOutcome | null>(null)

/** Son çıkışın sonucu; giriş ekranı `server_unverified` için uyarı gösterir. */
export const signOutNotice = readonly(notice)

export function acknowledgeSignOutNotice(): void {
  notice.value = null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('sign-out timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

async function callLogout(timeoutMs: number): Promise<SignOutOutcome> {
  // Belirteç yoksa sunucu oturumu kapatılamaz: çerezin durumu bilinmez.
  if (!authSession.token) return 'server_unverified'
  try {
    await withTimeout(unwrap(api.POST('/v1/auth/logout', {})), timeoutMs)
    return 'verified'
  } catch {
    return 'server_unverified'
  }
}

export async function signOut(
  client: QueryClient,
  options: { timeoutMs?: number } = {},
): Promise<SignOutOutcome> {
  const outcome = await callLogout(options.timeoutMs ?? SIGN_OUT_TIMEOUT_MS)
  authSession.clear()
  void client.cancelQueries()
  client.clear()
  const scope = useScopeStore()
  scope.reset()
  scope.forgetRemembered()
  notice.value = outcome
  return outcome
}
