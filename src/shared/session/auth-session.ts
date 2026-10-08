import type { components } from '@/shared/api/schema'

import type { RefreshCoordination } from './coordination'

type LoginResponse = components['schemas']['LoginResponse']
type RefreshResponse = components['schemas']['RefreshResponse']

/** Oturum durumu (UI'ın gözlediği yüz). Belirteç bu nesnede YOKTUR. */
export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated' | 'ended'

export interface SessionSnapshot {
  status: SessionStatus
  accountId: string | null
  /** Erişim belirtecinin bitişi (Unix saniyesi). */
  expiresAt: number | null
  forcePasswordChange: boolean
}

/** Sekmeler arası kanalda taşınan iletiler. Kalıcı depolamaya hiçbir şey yazılmaz. */
export type SessionMessage =
  | {
      type: 'token'
      token: string
      accountId: string
      expiresAt: number
      forcePasswordChange: boolean
      /** Gönderen sekmenin belirteci aldığı an (ms). Daha yenisi kazanır. */
      issuedAt: number
    }
  | { type: 'logout' }

export interface AuthSessionDeps {
  /** Ham fetch (ara katmansız). Refresh çağrısı API istemcisinin dışından yapılır: döngü olmaz. */
  fetch: (input: Request) => Promise<Response>
  baseUrl: string
  coordination: RefreshCoordination
  /** Refresh 401'inde kardeş sekmenin yeni belirtecini bekleme süresi (ms). */
  peerWaitMs?: number
  now?: () => number
}

/** Refresh sonucu: `ok` yeni/güncel belirteç var; `ended` oturum bitti; `failed` geçici hata. */
export type RefreshOutcome = 'ok' | 'ended' | 'failed'

export const REFRESH_PATH = '/v1/auth/refresh'
export const REFRESH_LOCK_NAME = 'nizamio:auth-refresh'

/**
 * Web oturumu: erişim belirteci YALNIZ bu nesnenin özel alanındadır (bellek). Yenileme belirteci
 * HttpOnly çerezdedir (Path=/v1/auth); istemci onu hiçbir zaman okumaz.
 *
 * Tek uçuş yenileme (F06 kapsam 4; platform.md §1):
 *  - Sekme içi: eşzamanlı 401'ler aynı refresh promise'ini bekler.
 *  - Sekmeler arası: refresh yalnız `navigator.locks` özel kilidi içinde yapılır. Kilidi
 *    kazanan sekme yeni belirteci BroadcastChannel ile yayınlar (kilit bırakılmadan önce);
 *    sıradaki sekme kilidi aldığında belirteci başarısız isteğindekinden farklıysa refresh
 *    ATMAZ, yayınlanan belirteci kullanır. Gerekçe: docs/refresh-coordination.md.
 */
export class AuthSession {
  #token: string | null = null
  #issuedAt = 0
  #snapshot: SessionSnapshot = {
    status: 'unknown',
    accountId: null,
    expiresAt: null,
    forcePasswordChange: false,
  }
  #inflight: Promise<RefreshOutcome> | null = null
  #listeners = new Set<(s: SessionSnapshot) => void>()
  #tokenWaiters = new Set<() => void>()
  readonly #deps: Required<Omit<AuthSessionDeps, 'coordination'>> & {
    coordination: RefreshCoordination
  }

  constructor(deps: AuthSessionDeps) {
    this.#deps = { peerWaitMs: 1000, now: () => Date.now(), ...deps }
    deps.coordination.subscribe((message) => this.#onMessage(message))
  }

  /** Geçerli erişim belirteci (yalnız HTTP ara katmanı kullanır). */
  get token(): string | null {
    return this.#token
  }

  get snapshot(): SessionSnapshot {
    return this.#snapshot
  }

  subscribe(listener: (s: SessionSnapshot) => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  /** Giriş yanıtını uygular ve diğer sekmelere yayınlar. */
  establish(response: LoginResponse | RefreshResponse, forcePasswordChange?: boolean): void {
    const token = response.token
    if (typeof token !== 'string' || token === '') {
      // Web yanıtında `token` zorunludur; yoksa sözleşme dışı yanıt — oturum kurulmaz.
      this.#end('anonymous')
      return
    }
    const force =
      forcePasswordChange ??
      ('force_password_change' in response
        ? response.force_password_change
        : this.#snapshot.forcePasswordChange)
    const issuedAt = Math.max(this.#deps.now(), this.#issuedAt + 1)
    this.#apply(token, response.account_id, response.expires_at, force, issuedAt)
    this.#deps.coordination.publish({
      type: 'token',
      token,
      accountId: response.account_id,
      expiresAt: response.expires_at,
      forcePasswordChange: force,
      issuedAt,
    })
  }

  /** `/v1/me` 403 `identity.force_password_change_required` → bayrak. */
  markForcePasswordChange(): void {
    if (this.#snapshot.forcePasswordChange) return
    this.#setSnapshot({ ...this.#snapshot, forcePasswordChange: true })
  }

  /** Çıkış: bellek temizlenir, diğer sekmelere bildirilir. API çağrısı depo katmanındadır. */
  clear(): void {
    this.#end('anonymous')
    this.#deps.coordination.publish({ type: 'logout' })
  }

  /** Oturum sona erdi (refresh reddi): bellek temizlenir, "oturum sonlandı" durumu. */
  expire(): void {
    this.#end('ended')
  }

  /**
   * Tek uçuş refresh. `failedToken`, 401 alan isteğin taşıdığı belirteçtir (açılıştaki
   * sessiz refresh için null). Aynı sekmede eşzamanlı çağrılar tek promise paylaşır.
   */
  refresh(failedToken: string | null): Promise<RefreshOutcome> {
    if (this.#inflight) return this.#inflight
    const run = this.#deps.coordination
      .withLock(REFRESH_LOCK_NAME, () => this.#refreshLocked(failedToken))
      .finally(() => {
        this.#inflight = null
      })
    this.#inflight = run
    return run
  }

  async #refreshLocked(failedToken: string | null): Promise<RefreshOutcome> {
    // Kilidi beklerken başka sekme yenilediyse onun belirteci zaten bize ulaşmıştır.
    if (this.#hasNewerToken(failedToken)) return 'ok'

    let response: Response
    try {
      response = await this.#deps.fetch(
        new Request(new URL(REFRESH_PATH, this.#deps.baseUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: '{}',
          credentials: 'same-origin',
        }),
      )
    } catch {
      return 'failed'
    }

    if (response.ok) {
      let body: RefreshResponse
      try {
        body = (await response.json()) as RefreshResponse
      } catch {
        return 'failed'
      }
      this.establish(body)
      return this.#token ? 'ok' : 'ended'
    }

    if (response.status === 401) {
      // Kilitsiz ortamda (Web Locks yok) kardeş sekme aynı anda döndürmüş olabilir: backend
      // eski çerezi 10 sn pay içinde 401 ile reddeder, toplu iptal yapmaz. Kazanan sekmenin
      // yayını kısa süre beklenir; gelirse oturum sürer. Kilit varken refresh'ler sıralıdır,
      // her biri güncel çerezle gider; beklemeye gerek yoktur.
      const waitMs = this.#deps.coordination.crossTabLock ? 0 : this.#deps.peerWaitMs
      if (await this.#waitForNewerToken(failedToken, waitMs)) return 'ok'
      if (this.#snapshot.status === 'unknown' || this.#snapshot.status === 'anonymous') {
        this.#end('anonymous')
      } else {
        this.#end('ended')
      }
      return 'ended'
    }
    // 429/5xx vb.: oturum hakkında hüküm yok; çağırana geçici hata.
    return 'failed'
  }

  #hasNewerToken(failedToken: string | null): boolean {
    return this.#token !== null && this.#token !== failedToken
  }

  #waitForNewerToken(failedToken: string | null, ms: number): Promise<boolean> {
    if (this.#hasNewerToken(failedToken)) return Promise.resolve(true)
    if (ms <= 0) return Promise.resolve(false)
    return new Promise((resolve) => {
      const done = () => {
        if (!this.#hasNewerToken(failedToken)) return
        clearTimeout(timer)
        this.#tokenWaiters.delete(done)
        resolve(true)
      }
      const timer = setTimeout(() => {
        this.#tokenWaiters.delete(done)
        resolve(this.#hasNewerToken(failedToken))
      }, ms)
      this.#tokenWaiters.add(done)
    })
  }

  #onMessage(message: SessionMessage): void {
    if (message.type === 'logout') {
      this.#end('anonymous')
      return
    }
    if (message.issuedAt <= this.#issuedAt) return
    this.#apply(
      message.token,
      message.accountId,
      message.expiresAt,
      message.forcePasswordChange,
      message.issuedAt,
    )
  }

  #apply(
    token: string,
    accountId: string,
    expiresAt: number,
    forcePasswordChange: boolean,
    issuedAt: number,
  ): void {
    this.#token = token
    this.#issuedAt = issuedAt
    this.#setSnapshot({ status: 'authenticated', accountId, expiresAt, forcePasswordChange })
    for (const waiter of [...this.#tokenWaiters]) waiter()
  }

  #end(status: 'anonymous' | 'ended'): void {
    this.#token = null
    this.#setSnapshot({ status, accountId: null, expiresAt: null, forcePasswordChange: false })
  }

  #setSnapshot(next: SessionSnapshot): void {
    this.#snapshot = next
    for (const listener of this.#listeners) listener(next)
  }
}
