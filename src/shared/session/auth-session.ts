import type { components } from '@/shared/api/schema'

import type { RefreshCoordination } from './coordination'
import { MESSAGE_LIMITS, parseSessionMessage, SESSION_MESSAGE_VERSION } from './messages'

type LoginResponse = components['schemas']['LoginResponse']
type RefreshResponse = components['schemas']['RefreshResponse']

/**
 * Oturum durumu (UI'ın gözlediği yüz). Belirteç bu nesnede YOKTUR.
 * `unavailable`: açılıştaki sessiz refresh ağ/5xx nedeniyle sonuçlanmadı — oturum hakkında
 * hüküm yok, yeniden denenebilir (401 değil).
 */
export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated' | 'ended' | 'unavailable'

export interface SessionSnapshot {
  status: SessionStatus
  accountId: string | null
  /** Erişim belirtecinin bitişi (Unix saniyesi). */
  expiresAt: number | null
  forcePasswordChange: boolean
}

export interface AuthSessionDeps {
  /** Ham fetch (ara katmansız). Refresh çağrısı API istemcisinin dışından yapılır: döngü olmaz. */
  fetch: (input: Request) => Promise<Response>
  baseUrl: string
  coordination: RefreshCoordination
  /** Refresh 401'inde kardeş sekmenin yeni belirtecini bekleme süresi (ms; kilitsiz yol). */
  peerWaitMs?: number
  /** Kilit alındığında kardeş sekmelerden güncel belirteç isteme (sync-request) süresi (ms). */
  syncWaitMs?: number
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
 *    ATMAZ, yayınlanan belirteci kullanır; değilse önce kardeşlerden güncel belirteci ister
 *    (sync-request). Kanal iletileri sıkı doğrulanır (messages.ts).
 *    Gerekçe ve güvenlik varsayımı: docs/refresh-coordination.md.
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
    this.#deps = { peerWaitMs: 1000, syncWaitMs: 150, now: () => Date.now(), ...deps }
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
    this.#publishToken()
  }

  #publishToken(): void {
    const { accountId, expiresAt, forcePasswordChange } = this.#snapshot
    if (!this.#token || !accountId || expiresAt === null) return
    this.#deps.coordination.publish({
      v: SESSION_MESSAGE_VERSION,
      type: 'token',
      token: this.#token,
      accountId,
      expiresAt,
      forcePasswordChange,
      issuedAt: this.#issuedAt,
    })
  }

  /** `/v1/me` 403 `identity.force_password_change_required` → bayrak. */
  markForcePasswordChange(): void {
    if (this.#snapshot.forcePasswordChange) return
    this.#setSnapshot({ ...this.#snapshot, forcePasswordChange: true })
  }

  /** Çıkış: bellek temizlenir, diğer sekmelere bildirilir. API çağrısı depo katmanındadır. */
  clear(): void {
    const accountId = this.#snapshot.accountId
    this.#end('anonymous')
    if (accountId) {
      this.#deps.coordination.publish({ v: SESSION_MESSAGE_VERSION, type: 'logout', accountId })
    }
  }

  /** Açılıştaki sessiz refresh geçici hatayla sonuçlandı (ağ/5xx): yeniden denenebilir. */
  markUnavailable(): void {
    this.#token = null
    this.#setSnapshot({
      status: 'unavailable',
      accountId: null,
      expiresAt: null,
      forcePasswordChange: false,
    })
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
    // Yayın kilit devrinden sonra ulaşabilir (tarayıcı sıra garantisi yok). Kardeşlerden güncel
    // belirteç istenir; yanıt aynı göndericinin önceki yayınından sonra gelir (kanal FIFO).
    this.#deps.coordination.publish({ v: SESSION_MESSAGE_VERSION, type: 'sync-request' })
    if (await this.#waitForNewerToken(failedToken, this.#deps.syncWaitMs)) return 'ok'

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
      const st = this.#snapshot.status
      if (st === 'unknown' || st === 'anonymous' || st === 'unavailable') {
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

  #onMessage(raw: unknown): void {
    const now = this.#deps.now()
    const message = parseSessionMessage(raw, now)
    if (!message) return // bozuk/bilinmeyen/eski sürüm/fazla alan: sessizce yok sayılır
    const current = this.#snapshot.accountId

    switch (message.type) {
      case 'logout':
        // Yalnız aynı hesabın çıkışı uygulanır.
        if (current !== null && message.accountId === current) this.#end('anonymous')
        return
      case 'sync-request': {
        // Belirteç yalnız taze ise paylaşılır (alıcı eski issuedAt'i zaten reddeder).
        if (this.#snapshot.status !== 'authenticated') return
        if (Math.abs(now - this.#issuedAt) > MESSAGE_LIMITS.issuedSkewMs) return
        this.#publishToken()
        return
      }
      case 'token':
        // Hesap tutarlılığı: oturumdaki hesap doluysa başka hesabın belirteci reddedilir.
        if (current !== null && message.accountId !== current) return
        if (message.issuedAt <= this.#issuedAt) return
        this.#apply(
          message.token,
          message.accountId,
          message.expiresAt,
          message.forcePasswordChange,
          message.issuedAt,
        )
    }
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
