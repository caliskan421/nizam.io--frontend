/**
 * `reportGate` — bu sekmedeki bütün rapor üretimleri için TEK kilit (13 `mekanizma.md` §3.1).
 *
 * Sunucu kuralı: hesap başına tek eşzamanlı üretim (429 `reporting.export_in_progress`); JSON
 * dönem/iş yükü okumaları da aynı korumadadır (REPORTING-K10). İstemci buna ek olarak bu sekmedeki
 * rapor düğmelerini ve ağır önizleme okumalarını tek kilit altında tutar: biri `issuing/redeeming`
 * iken diğerleri kilitlidir ("Bu sırada diğer rapor düğmeleri kilitli"). Başka sekme/cihaz
 * sunucudan 429 alır.
 *
 *  - Düğme (`acquire`): bloklamaz; kilit doluysa `null` (düğme zaten kilitli çizilir).
 *  - Okuyucu (`acquireWhenFree`): sıraya girer, kilit boşalınca alır (iptalde sıradan düşer).
 *  - Kiralama (`lease`): `signal` iptal sinyali taşır; `cancel()` isteği kesmek için iptal eder ve
 *    kilidi bırakır. Sahip sökülmesi, kapsam ve oturum değişimi kullanan tarafta `cancel`'a bağlanır.
 *  - Bekleme sayacı (`cooldown`): `Retry-After` taşıyan 429'larda ortak geri sayım (tek hesap
 *    sınırı → bütün düğmeler "Bekleyin (N s)"); bitince indirme kendiliğinden BAŞLAMAZ.
 */
import { readonly, ref, type Ref } from 'vue'

export interface ReportLease {
  /** Kiralama iptal edilince iptal olur (isteğe `signal` olarak verilir). */
  readonly signal: AbortSignal
  /** Kilidi bırakır (tekrarı zararsız); iptalden sonra da çağrılabilir. */
  release: () => void
  /** İsteği iptal eder ve kilidi bırakır. */
  cancel: () => void
}

export interface ReportGate {
  readonly busy: Readonly<Ref<boolean>>
  /** `Retry-After` geri sayımının kalan saniyesi; 0 = yok. */
  readonly cooldown: Readonly<Ref<number>>
  acquire: () => ReportLease | null
  acquireWhenFree: (signal?: AbortSignal) => Promise<ReportLease>
  /** Geri sayımı başlatır (saniye); ≤ 0 yok sayılır. */
  startCooldown: (seconds: number) => void
  /** Oturum değişimi: tutulan kiralamayı iptal eder, sırayı ve sayacı temizler. */
  reset: () => void
}

interface Waiter {
  resolve: (lease: ReportLease) => void
  reject: (reason: Error) => void
  signal?: AbortSignal
  onAbort?: () => void
}

/** Sıradaki okuyucunun iptali (TanStack sorgusu bunu iptal olarak tanır: `name === 'AbortError'`). */
class GateAbortError extends Error {
  constructor() {
    super('Aborted')
    this.name = 'AbortError'
  }
}

function abortError(signal?: AbortSignal): Error {
  const reason: unknown = signal?.reason
  return reason instanceof Error ? reason : new GateAbortError()
}

class Gate implements ReportGate {
  readonly #busy = ref(false)
  readonly #cooldown = ref(0)
  #current: AbortController | null = null
  #timer: ReturnType<typeof setInterval> | null = null
  readonly #queue: Waiter[] = []
  readonly busy = readonly(this.#busy)
  readonly cooldown = readonly(this.#cooldown)

  acquire = (): ReportLease | null => (this.#current === null ? this.#grant() : null)

  acquireWhenFree = (signal?: AbortSignal): Promise<ReportLease> => {
    if (signal?.aborted) return Promise.reject(abortError(signal))
    if (this.#current === null) return Promise.resolve(this.#grant())
    return new Promise<ReportLease>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject, signal }
      if (signal) {
        waiter.onAbort = () => {
          const at = this.#queue.indexOf(waiter)
          if (at >= 0) this.#queue.splice(at, 1)
          reject(abortError(signal))
        }
        signal.addEventListener('abort', waiter.onAbort, { once: true })
      }
      this.#queue.push(waiter)
    })
  }

  startCooldown = (seconds: number): void => {
    if (!(seconds > 0)) return
    this.#stopTimer()
    this.#cooldown.value = Math.ceil(seconds)
    this.#timer = setInterval(() => {
      this.#cooldown.value = Math.max(0, this.#cooldown.value - 1)
      if (this.#cooldown.value === 0) this.#stopTimer()
    }, 1000)
  }

  reset = (): void => {
    this.#current?.abort()
    this.#current = null
    this.#busy.value = false
    for (const waiter of this.#queue.splice(0)) {
      this.#detach(waiter)
      waiter.reject(abortError())
    }
    this.#stopTimer()
    this.#cooldown.value = 0
  }

  #grant(): ReportLease {
    const controller = new AbortController()
    this.#current = controller
    this.#busy.value = true
    const release = () => {
      if (this.#current !== controller) return
      this.#current = null
      this.#busy.value = false
      this.#next()
    }
    return {
      signal: controller.signal,
      release,
      cancel: () => {
        if (this.#current !== controller) return
        controller.abort()
        release()
      },
    }
  }

  #next(): void {
    const waiter = this.#queue.shift()
    if (!waiter) return
    this.#detach(waiter)
    waiter.resolve(this.#grant())
  }

  #detach(waiter: Waiter): void {
    if (waiter.signal && waiter.onAbort) waiter.signal.removeEventListener('abort', waiter.onAbort)
  }

  #stopTimer(): void {
    if (this.#timer !== null) clearInterval(this.#timer)
    this.#timer = null
  }
}

export function createReportGate(): ReportGate {
  return new Gate()
}

/** Sekme geneli tek örnek. */
export const reportGate: ReportGate = createReportGate()
