/**
 * Kapsam farkında çıkış (E-00-29; ortak-kurallar §8, CX-S-10).
 *
 *  - `POST /v1/auth/logout` (CSRF başlığı HTTP ara katmanında). Onay penceresi yok.
 *  - Sonuç ne olursa olsun: bellekteki erişim belirteci silinir (diğer sekmelere bildirilir),
 *    sorgu önbelleği boşaltılır, kapsam bellekten ve hatırlananlardan silinir (`scope.*`;
 *    `ui.theme` kalır).
 *  - 2xx dışı her sonuç / ağ hatası / zaman aşımı → "sunucu çıkışı doğrulanamadı"
 *    (`AuthSession` `serverLogoutUnverified`): HttpOnly yenileme çerezinin iptal edildiği
 *    VARSAYILMAZ, açık girişe kadar sessiz yenileme denenmez; kabuk kısa uyarı gösterir
 *    (metin i18n'den; sunucu `message` alanı kullanılmaz). Sayfa yenilemesinde bayrak kaybolur
 *    (izinli tercih anahtarı genişletilmez).
 *  - Giriş noktası `useSessionStore().logout()`; bu modül onun uygulamasıdır.
 */
import type { QueryClient } from '@tanstack/vue-query'
import { api, authSession, unwrap } from '@/shared/http'

import { useScopeStore } from './store'

export type SignOutOutcome = 'verified' | 'server_unverified'

export const SIGN_OUT_TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('sign-out timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Çıkıştan ÖNCE (belirteç hâlâ geçerliyken) çalışan en-iyi-çaba kancalar; modüller kendini kaydeder
 * (`shared` modül içe aktarmaz). Hata ve zaman aşımı çıkışı engellemez; sonuç beklenir ama süre
 * çıkış zaman aşımıyla aynı sınırdadır. Örnek: Web Push hedefini sunucudan silmek (E-14-79).
 */
type BeforeSignOutHook = () => Promise<void>
const beforeSignOutHooks = new Set<BeforeSignOutHook>()

export function onBeforeSignOut(hook: BeforeSignOutHook): () => void {
  beforeSignOutHooks.add(hook)
  return () => void beforeSignOutHooks.delete(hook)
}

async function runBeforeHooks(timeoutMs: number): Promise<void> {
  if (!authSession.token || beforeSignOutHooks.size === 0) return
  const runs = [...beforeSignOutHooks].map((hook) =>
    withTimeout(Promise.resolve().then(hook), timeoutMs).catch(() => undefined),
  )
  await Promise.all(runs)
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
  client: QueryClient | null,
  options: { timeoutMs?: number } = {},
): Promise<SignOutOutcome> {
  const timeoutMs = options.timeoutMs ?? SIGN_OUT_TIMEOUT_MS
  await runBeforeHooks(timeoutMs)
  const outcome = await callLogout(timeoutMs)
  authSession.clear({ serverUnverified: outcome === 'server_unverified' })
  if (client) {
    void client.cancelQueries()
    client.clear()
  }
  const scope = useScopeStore()
  scope.reset()
  scope.forgetRemembered()
  return outcome
}
