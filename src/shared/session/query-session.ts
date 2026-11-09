/**
 * Sorgu önbelleğinin oturum ayrımı (Codex CX-F1-Ö-08; ortak-kurallar §8).
 *
 * Sorgu anahtarları hesaptan bağımsızdır (`['me']`, kapsamlı anahtarlar); önbellek tek bir
 * oturuma aittir. Çıkış (bu sekme ya da kardeş sekme) → başka hesapla giriş sırasında eski
 * oturumun sorgusu yeni oturumun önbelleğine karışmamalıdır. İki katman:
 *
 *  1. **Yaşam döngüsü (tek yer):** `bindSessionQueries(client)` oturum nesli değişince (her
 *     çıkış: yerel `clear`, kardeş `logout` / `logout-unverified`) ya da oturum başka bir hesaba
 *     geçince bütün sorguları iptal eder (`AbortSignal` tüketen okuyucuda istek kesilir; TanStack
 *     tekrar zamanlayıcısı durur) ve önbelleği boşaltır. Kabukta kapsam yaşam döngüsüyle bir kez
 *     kurulur (`useScopeLifecycle`).
 *  2. **Okuyucu kapısı (derinlik):** `sessionBound(queryFn)` sorgunun ilk denemesinde oturum
 *     damgasını (nesil + hesap) alır — TanStack tekrarları aynı `signal`'i taşır, damga ona
 *     bağlanır. Tekrar öncesi damga değiştiyse istek gönderilmez; yanıt geldiğinde değiştiyse
 *     veri önbelleğe yazılmaz. İkisi de `SessionChangedError` (tekrarlanmaz) ile biter.
 */
import type { QueryClient, QueryFunctionContext } from '@tanstack/vue-query'

import { authSession } from '@/shared/http'

import type { AuthSession } from './auth-session'

/** Sorgu başka bir oturumda başladı: sonucu/tekrarı bu oturuma uygulanmaz. Tekrarlanmaz. */
export class SessionChangedError extends Error {
  constructor() {
    super('session changed')
    this.name = 'SessionChangedError'
  }
}

type SessionLike = Pick<AuthSession, 'generation' | 'snapshot' | 'subscribe'>

interface Stamp {
  generation: number
  accountId: string | null
}

const stampOf = (session: SessionLike): Stamp => ({
  generation: session.generation,
  accountId: session.snapshot.accountId,
})

const sameStamp = (a: Stamp, b: Stamp) =>
  a.generation === b.generation && a.accountId === b.accountId

/** İlk denemenin damgası; anahtar TanStack'in sorgu getirmesi başına tek `AbortSignal`'i. */
const STAMPS = new WeakMap<AbortSignal, Stamp>()

/**
 * Sorgu işlevini oturuma bağlar (okuyucu kapısı). İşlev bağlamdaki `signal`'i okuyucuya geçirir
 * (çıkışta iptal edilen sorgunun isteği kesilir).
 */
export function sessionBound<C extends Pick<QueryFunctionContext, 'signal'>, T>(
  fn: (context: C) => Promise<T>,
  session: SessionLike = authSession,
): (context: C) => Promise<T> {
  return async (context) => {
    const now = stampOf(session)
    const born = STAMPS.get(context.signal) ?? now
    STAMPS.set(context.signal, born)
    // Tekrar (aynı getirme) başka oturumda: eski sorgu yeni kimlikle sürdürülmez.
    if (!sameStamp(born, now)) throw new SessionChangedError()
    const data = await fn(context)
    // Geç yanıt: oturum bu arada değişti — veri yeni oturumun önbelleğine yazılmaz.
    if (!sameStamp(born, stampOf(session))) throw new SessionChangedError()
    return data
  }
}

/**
 * Sorgu istemcisini oturum yaşamına bağlar (tek yer): nesil değişimi (her çıkış, kardeş sekme
 * dahil) ya da başka hesaba geçiş → bütün sorgular iptal + önbellek boşaltılır. Dinlemeyi
 * bırakan işlev döner.
 */
export function bindSessionQueries(
  client: QueryClient,
  session: SessionLike = authSession,
): () => void {
  let generation = session.generation
  let lastAccount = session.snapshot.accountId
  const off = session.subscribe((snapshot) => {
    const ended = session.generation !== generation
    const switched =
      snapshot.accountId !== null && lastAccount !== null && snapshot.accountId !== lastAccount
    generation = session.generation
    if (snapshot.accountId !== null) lastAccount = snapshot.accountId
    if (!ended && !switched) return
    void client.cancelQueries()
    client.clear()
  })
  return () => void off()
}
