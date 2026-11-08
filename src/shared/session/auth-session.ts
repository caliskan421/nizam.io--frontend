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
  /**
   * Çıkış isteği başarısız / zaman aşımı (ortak-kurallar §8): sunucu oturumu kapattığı
   * doğrulanamadı, HttpOnly yenileme çerezi hâlâ geçerli olabilir. Bu bayrak açıkken sessiz
   * yenileme (401 sonrası ve açılıştaki refresh) YAPILMAZ ve kardeş sekmeden gelen belirteç
   * kabul edilmez; yalnız açık giriş (`establish`) bayrağı kapatır. Yalnız bellekte tutulur.
   */
  serverLogoutUnverified: boolean
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

type RefreshEntry = { generation: number; run: Promise<RefreshOutcome> }

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
 *
 * Oturum nesli (CX-F0-E-03): her çıkış (doğrulanmış ya da doğrulanamamış, kardeş sekmeden
 * gelen aynı hesabın çıkışı dahil) nesli artırır. Önceki nesilde başlamış refresh (kilitte
 * bekleyen ya da yanıtı gecikmiş) ve açık giriş yanıtları UYGULANMAZ; çıkış anı `issuedAt`
 * eşiği olur, ondan önce alınmış kardeş belirteci reddedilir.
 */
export class AuthSession {
  #token: string | null = null
  #issuedAt = 0
  #snapshot: SessionSnapshot = {
    status: 'unknown',
    accountId: null,
    expiresAt: null,
    forcePasswordChange: false,
    serverLogoutUnverified: false,
  }
  #generation = 0
  #inflight: RefreshEntry | null = null
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

  /** Geçerli oturum nesli: açık giriş isteğinden ÖNCE alınır, yanıtla `establish`'e verilir. */
  get generation(): number {
    return this.#generation
  }

  subscribe(listener: (s: SessionSnapshot) => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  /**
   * Açık giriş yanıtını uygular ve diğer sekmelere yayınlar; `serverLogoutUnverified`
   * bayrağını yalnız bu yol kapatır. `generation` isteğin başladığı nesildir: arada çıkış
   * olduysa yanıt uygulanmaz (`false`).
   */
  establish(
    response: LoginResponse | RefreshResponse,
    forcePasswordChange?: boolean,
    generation: number = this.#generation,
  ): boolean {
    if (generation !== this.#generation) return false
    return this.#accept(response, forcePasswordChange, this.#deps.now(), true)
  }

  #accept(
    response: LoginResponse | RefreshResponse,
    forcePasswordChange: boolean | undefined,
    issuedFrom: number,
    explicit: boolean,
  ): boolean {
    // Doğrulanamayan çıkıştan sonra belirteç yalnız açık girişle gelir.
    if (!explicit && this.#snapshot.serverLogoutUnverified) return false
    const token = response.token
    if (typeof token !== 'string' || token === '') {
      // Web yanıtında `token` zorunludur; yoksa sözleşme dışı yanıt — oturum kurulmaz.
      this.#end('anonymous')
      return false
    }
    const force =
      forcePasswordChange ??
      ('force_password_change' in response
        ? response.force_password_change
        : this.#snapshot.forcePasswordChange)
    const issuedAt = Math.max(issuedFrom, this.#issuedAt + 1)
    this.#apply(token, response.account_id, response.expires_at, force, issuedAt)
    this.#publishToken()
    return true
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

  /**
   * Çıkış: bellek temizlenir, diğer sekmelere bildirilir. API çağrısı `scope/sign-out.ts`'tedir.
   * `serverUnverified`: sunucu çıkışı doğrulanamadı → açık girişe kadar sessiz yenileme yok.
   */
  clear(options: { serverUnverified?: boolean } = {}): void {
    const accountId = this.#snapshot.accountId
    this.#nextGeneration()
    this.#end('anonymous', options.serverUnverified === true)
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
      serverLogoutUnverified: this.#snapshot.serverLogoutUnverified,
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
    // Sunucu çıkışı doğrulanamadı: çerezle sessiz yenileme denenmez (ortak-kurallar §8).
    if (this.#snapshot.serverLogoutUnverified) return Promise.resolve('ended')
    const generation = this.#generation
    // Önceki nesilden kalan uçuşa katılınmaz: o sonuç bu nesle uygulanmayacaktır.
    if (this.#inflight?.generation === generation) return this.#inflight.run
    const entry: RefreshEntry = { generation, run: Promise.resolve('ended') }
    entry.run = this.#deps.coordination
      .withLock(REFRESH_LOCK_NAME, () => this.#refreshLocked(failedToken, generation))
      .finally(() => {
        if (this.#inflight === entry) this.#inflight = null
      })
    this.#inflight = entry
    return entry.run
  }

  /** Refresh başladıktan sonra çıkış oldu mu (nesil değişti mi)? */
  #stale(generation: number): boolean {
    return generation !== this.#generation
  }

  async #refreshLocked(failedToken: string | null, generation: number): Promise<RefreshOutcome> {
    // Kilidi beklerken çıkış yapıldıysa refresh ATILMAZ (kilitte bekleyen refresh iptal).
    if (this.#stale(generation)) return 'ended'
    // Kilidi beklerken başka sekme yenilediyse onun belirteci zaten bize ulaşmıştır.
    if (this.#hasNewerToken(failedToken)) return 'ok'
    // Yayın kilit devrinden sonra ulaşabilir (tarayıcı sıra garantisi yok). Kardeşlerden güncel
    // belirteç istenir; yanıt aynı göndericinin önceki yayınından sonra gelir (kanal FIFO).
    this.#deps.coordination.publish({ v: SESSION_MESSAGE_VERSION, type: 'sync-request' })
    const synced = await this.#waitForNewerToken(failedToken, this.#deps.syncWaitMs)
    if (this.#stale(generation)) return 'ended'
    if (synced) return 'ok'

    // `issuedAt` isteğin başladığı andır: yanıt bir kardeşin çıkışından sonra gelse de o
    // sekmenin çıkış eşiğinin altında kalır ve orada uygulanmaz.
    const startedAt = this.#deps.now()
    const response = await this.#postRefresh()
    // Gecikmiş yanıt: arada çıkış olduysa uygulanmaz, durum ve uyarı bayrağı değişmez.
    if (this.#stale(generation)) return 'ended'
    if (response === null) return 'failed'
    if (response.ok) return this.#acceptRefresh(response, generation, startedAt)
    if (response.status === 401) return this.#refreshRejected(failedToken, generation)
    // 429/5xx vb.: oturum hakkında hüküm yok; çağırana geçici hata.
    return 'failed'
  }

  async #postRefresh(): Promise<Response | null> {
    try {
      return await this.#deps.fetch(
        new Request(new URL(REFRESH_PATH, this.#deps.baseUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: '{}',
          credentials: 'same-origin',
        }),
      )
    } catch {
      return null
    }
  }

  async #acceptRefresh(
    response: Response,
    generation: number,
    startedAt: number,
  ): Promise<RefreshOutcome> {
    let body: RefreshResponse
    try {
      body = (await response.json()) as RefreshResponse
    } catch {
      return this.#stale(generation) ? 'ended' : 'failed'
    }
    if (this.#stale(generation)) return 'ended'
    return this.#accept(body, undefined, startedAt, false) ? 'ok' : 'ended'
  }

  async #refreshRejected(failedToken: string | null, generation: number): Promise<RefreshOutcome> {
    // Kilitsiz ortamda (Web Locks yok) kardeş sekme aynı anda döndürmüş olabilir: backend
    // eski çerezi 10 sn pay içinde 401 ile reddeder, toplu iptal yapmaz. Kazanan sekmenin
    // yayını kısa süre beklenir; gelirse oturum sürer. Kilit varken refresh'ler sıralıdır,
    // her biri güncel çerezle gider; beklemeye gerek yoktur.
    const waitMs = this.#deps.coordination.crossTabLock ? 0 : this.#deps.peerWaitMs
    const peer = await this.#waitForNewerToken(failedToken, waitMs)
    if (this.#stale(generation)) return 'ended'
    if (peer) return 'ok'
    const st = this.#snapshot.status
    if (st === 'unknown' || st === 'anonymous' || st === 'unavailable') {
      this.#end('anonymous')
    } else {
      this.#end('ended')
    }
    return 'ended'
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
        this.#onLogout(message.accountId)
        return
      case 'sync-request': {
        // Belirteç yalnız taze ise paylaşılır (alıcı eski issuedAt'i zaten reddeder).
        if (this.#snapshot.status !== 'authenticated') return
        if (Math.abs(now - this.#issuedAt) > MESSAGE_LIMITS.issuedSkewMs) return
        this.#publishToken()
        return
      }
      case 'token':
        // Doğrulanamayan çıkıştan sonra belirteç yalnız açık girişle gelir.
        if (this.#snapshot.serverLogoutUnverified) return
        // Hesap tutarlılığı: oturumdaki hesap doluysa başka hesabın belirteci reddedilir.
        if (current !== null && message.accountId !== current) return
        // Daha eski ya da son çıkıştan (nesil eşiği) önce alınmış belirteç reddedilir.
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

  /**
   * Kardeş sekmenin çıkışı. Aynı hesabın çıkışı uygulanır; açılıştaki sessiz refresh henüz
   * sonuçlanmamışsa (`unknown`, hesap bilinmiyor) da uygulanır — yenileme çerezi sekmeler
   * arasında ortaktır, uçuştaki refresh'in yanıtı artık bu oturumu açmamalıdır.
   */
  #onLogout(accountId: string): void {
    const current = this.#snapshot.accountId
    const applies = current === null ? this.#snapshot.status === 'unknown' : accountId === current
    if (!applies) return
    this.#nextGeneration()
    this.#end('anonymous')
  }

  /** Yeni oturum nesli: önceki nesilde başlamış refresh/giriş yanıtları uygulanmaz. */
  #nextGeneration(): void {
    this.#generation += 1
    // Çıkış anı `issuedAt` eşiğidir: ondan önce alınmış kardeş belirteci kabul edilmez.
    this.#issuedAt = Math.max(this.#deps.now(), this.#issuedAt + 1)
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
    this.#setSnapshot({
      status: 'authenticated',
      accountId,
      expiresAt,
      forcePasswordChange,
      serverLogoutUnverified: false,
    })
    for (const waiter of [...this.#tokenWaiters]) waiter()
  }

  #end(
    status: 'anonymous' | 'ended',
    serverLogoutUnverified: boolean = this.#snapshot.serverLogoutUnverified,
  ): void {
    this.#token = null
    this.#setSnapshot({
      status,
      accountId: null,
      expiresAt: null,
      forcePasswordChange: false,
      serverLogoutUnverified,
    })
  }

  #setSnapshot(next: SessionSnapshot): void {
    this.#snapshot = next
    for (const listener of this.#listeners) listener(next)
  }
}
