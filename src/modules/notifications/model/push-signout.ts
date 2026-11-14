/**
 * Çıkış kancası (E-14-79): oturum nesli değişince (yerel çıkış, kardeş sekme çıkışı, doğrulanamayan
 * çıkış) ya da oturum başka hesaba geçince yerel abonelik iptal edilir. `shared/session` çıkış
 * akışına dokunmadan `authSession.subscribe` ile bağlanır (`bindSessionQueries` kalıbı).
 * `target_id` yerelde tutulmadığı için `unregisterPushTarget` kullanılmaz; sunucu hedefi sonraki
 * teslimde 404/410 ile düşürür (K12). Hata çıkışı engellemez (ortak-kurallar §8).
 */
import { authSession } from '@/shared/http'
import type { AuthSession } from '@/shared/session/auth-session'

import { unsubscribeLocal } from '../api/push-client'

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
    if (ended || switched) void unsubscribe()
  })
}

let hookInstalled = false
/** Uygulama başına bir kez (kutu modülü içe aktarılınca); testler `installPushSignOutHook`'u çağırır. */
export function ensurePushSignOutHook(): void {
  if (hookInstalled) return
  hookInstalled = true
  installPushSignOutHook()
}
