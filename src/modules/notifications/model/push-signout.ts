/**
 * Çıkış kancası (E-14-79): oturum nesli değişince (yerel çıkış, kardeş sekme çıkışı, doğrulanamayan
 * çıkış) ya da oturum başka hesaba geçince yerel abonelik iptal edilir ve BELLEKTEKİ `target_id`
 * varsa `unregisterPushTarget` (DELETE, gövdesiz) gönderilir; 404 ve her hata sessizdir, çıkışı
 * engellemez (ortak-kurallar §8). `shared/session` çıkış akışına dokunmadan `authSession.subscribe`
 * ile bağlanır (`bindSessionQueries` kalıbı).
 *
 * Açık çıkışta (`signOut`) belirteç `authSession.clear()` ile düşmeden ÖNCE `onBeforeSignOut` ile
 * aynı silme çalışır (belirteç geçerliyken); kimlik orada alındığı için nesil kancası yalnız yerel
 * aboneliği iptal eder. Kardeş sekme çıkışında belirteç yoktur: DELETE gönderilmez, yalnız yerel abonelik iptal edilir.
 * Bu yazma bileşen sahibi olmayan oturum kancasıdır; `useProtectedMutation` değil, `signOut`'taki
 * `POST /v1/auth/logout` gibi doğrudan istemci çağrısıdır (sahipsiz, tek atış, sonucu bekleyen yok).
 */
import { api, authSession, unwrap } from '@/shared/http'
import { onBeforeSignOut } from '@/shared/scope/sign-out'
import type { AuthSession } from '@/shared/session/auth-session'

import { unsubscribeLocal } from '../api/push-client'
import { takePushTarget } from './push-target'

/** Sunucudaki hedefi siler (`unregisterPushTarget`); 404 dahil her hata sessiz. */
export async function unregisterTargetQuietly(targetId: string): Promise<void> {
  try {
    await unwrap(
      api.DELETE('/v1/notifications/targets/{target_id}', {
        params: { path: { target_id: targetId } },
      }),
    )
  } catch {
    // 404 `notifications.target_not_found` (zaten düşmüş) ve ağ hataları: sessiz (K12).
  }
}

async function endTarget(): Promise<void> {
  const targetId = takePushTarget()
  // Belirteçsiz DELETE yalnız 401 + gereksiz yenileme denemesi olurdu (kardeş sekme çıkışı).
  if (targetId !== null && authSession.token !== null) await unregisterTargetQuietly(targetId)
}

async function endTargetAndSubscription(unsubscribe: () => Promise<void>): Promise<void> {
  await Promise.all([endTarget(), unsubscribe()])
}

export function installPushSignOutHook(
  session: Pick<AuthSession, 'generation' | 'snapshot' | 'subscribe'> = authSession,
  unsubscribe: () => Promise<void> = unsubscribeLocal,
): () => void {
  let generation = session.generation
  let lastAccount = session.snapshot.accountId
  return session.subscribe((snapshot) => {
    const ended = session.generation !== generation
    const switched =
      snapshot.accountId !== null && lastAccount !== null && snapshot.accountId !== lastAccount
    generation = session.generation
    if (snapshot.accountId !== null) lastAccount = snapshot.accountId
    if (ended || switched) void endTargetAndSubscription(unsubscribe)
  })
}

let hookInstalled = false
/** Uygulama başına bir kez (kutu modülü içe aktarılınca); testler `installPushSignOutHook`'u çağırır. */
export function ensurePushSignOutHook(): void {
  if (hookInstalled) return
  hookInstalled = true
  installPushSignOutHook()
  onBeforeSignOut(endTarget)
}
