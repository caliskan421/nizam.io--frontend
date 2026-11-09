/**
 * Sekmeler arası oturum kanalının ileti sözleşmesi ve SIKI çalışma zamanı doğrulaması.
 *
 * Güven varsayımı (docs/refresh-coordination.md "Güvenlik varsayımı"): aynı origin tek güven
 * alanıdır. Kanal bu varsayımın ötesinde yetki vermez; yine de bozuk, eski sürümlü, fazla
 * alanlı, zaman aralığı dışı ya da başka hesaba ait ileti sessizce YOK SAYILIR.
 */

export const SESSION_MESSAGE_VERSION = 1

export type TokenMessage = {
  v: typeof SESSION_MESSAGE_VERSION
  type: 'token'
  token: string
  accountId: string
  /** Erişim belirtecinin bitişi (Unix saniyesi). */
  expiresAt: number
  forcePasswordChange: boolean
  /** Gönderen sekmenin belirteci aldığı an (ms). Daha yenisi kazanır. */
  issuedAt: number
}

export type LogoutMessage = {
  v: typeof SESSION_MESSAGE_VERSION
  type: 'logout'
  accountId: string
}

/**
 * Sunucu çıkışı doğrulanamadı (ortak-kurallar §8): kardeş sekmeler de açık girişe kadar sessiz
 * yenileme yapmasın diye bayrak aktarılır. Belirteç taşımaz. `logout`'tan ÖNCE yayınlanır;
 * bu türü tanımayan (eski sürüm) sekme yok sayar ve ardından gelen `logout`'u uygular.
 */
export type LogoutUnverifiedMessage = {
  v: typeof SESSION_MESSAGE_VERSION
  type: 'logout-unverified'
  accountId: string
}

/** Kilidi alan ama belirteci değişmemiş sekmenin, kardeşlerinden güncel belirteci istemesi. */
export type SyncRequestMessage = {
  v: typeof SESSION_MESSAGE_VERSION
  type: 'sync-request'
}

export type SessionMessage =
  TokenMessage | LogoutMessage | LogoutUnverifiedMessage | SyncRequestMessage

/** Sınırlar: belirteç biçimi, hesap kimliği, zaman pencereleri. */
export const MESSAGE_LIMITS = {
  tokenMin: 16,
  tokenMax: 4096,
  accountIdMax: 128,
  /** `issuedAt` ile alıcının saati arasındaki en büyük fark (ms; aynı makine). */
  issuedSkewMs: 5 * 60 * 1000,
} as const

const TOKEN_KEYS = [
  'accountId',
  'expiresAt',
  'forcePasswordChange',
  'issuedAt',
  'token',
  'type',
  'v',
]
const LOGOUT_KEYS = ['accountId', 'type', 'v']
const SYNC_KEYS = ['type', 'v']

const TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]+$/
const ACCOUNT_PATTERN = /^[A-Za-z0-9_-]+$/

function hasExactKeys(obj: Record<string, unknown>, keys: string[]): boolean {
  const own = Object.keys(obj).sort()
  return own.length === keys.length && own.every((k, i) => k === keys[i])
}

function isAccountId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MESSAGE_LIMITS.accountIdMax &&
    ACCOUNT_PATTERN.test(value)
  )
}

function isToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= MESSAGE_LIMITS.tokenMin &&
    value.length <= MESSAGE_LIMITS.tokenMax &&
    TOKEN_PATTERN.test(value)
  )
}

/** `token` iletisi (alan kümesi önceden denetlenir). */
function parseToken(m: Record<string, unknown>, nowMs: number): TokenMessage | null {
  const { token, accountId, expiresAt, forcePasswordChange, issuedAt } = m
  if (!isToken(token) || !isAccountId(accountId)) return null
  if (typeof forcePasswordChange !== 'boolean') return null
  const nowSec = Math.floor(nowMs / 1000)
  if (
    // Üst sınır YOK: oturum ömrü backend yapılandırmasıdır (NIZAMIO_SESSION_TTL'nin
    // üst sınırı yoktur); istemci geçerli bir belirteci keyfi sınırla reddetmez.
    typeof expiresAt !== 'number' ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= nowSec
  ) {
    return null
  }
  if (
    typeof issuedAt !== 'number' ||
    !Number.isFinite(issuedAt) ||
    Math.abs(issuedAt - nowMs) > MESSAGE_LIMITS.issuedSkewMs
  ) {
    return null
  }
  return {
    v: SESSION_MESSAGE_VERSION,
    type: 'token',
    token,
    accountId,
    expiresAt,
    forcePasswordChange,
    issuedAt,
  }
}

/** `logout` / `logout-unverified`: yalnız hesap kimliği taşır. */
function parseAccountOnly(
  m: Record<string, unknown>,
  type: 'logout' | 'logout-unverified',
): LogoutMessage | LogoutUnverifiedMessage | null {
  if (!hasExactKeys(m, LOGOUT_KEYS) || !isAccountId(m.accountId)) return null
  return { v: SESSION_MESSAGE_VERSION, type, accountId: m.accountId }
}

/**
 * Ham kanal verisini doğrular; geçersizse null. `nowMs` alıcının saati.
 * Kabul edilen ileti yalnız bilinen biçimdedir — başka hiçbir alan taşınmaz.
 */
export function parseSessionMessage(raw: unknown, nowMs: number): SessionMessage | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  if (Object.getPrototypeOf(raw) !== Object.prototype) return null
  const m = raw as Record<string, unknown>
  if (m.v !== SESSION_MESSAGE_VERSION) return null

  switch (m.type) {
    case 'token':
      return hasExactKeys(m, TOKEN_KEYS) ? parseToken(m, nowMs) : null
    case 'logout':
    case 'logout-unverified':
      return parseAccountOnly(m, m.type)
    case 'sync-request':
      if (!hasExactKeys(m, SYNC_KEYS)) return null
      return { v: SESSION_MESSAGE_VERSION, type: 'sync-request' }
    default:
      return null
  }
}
