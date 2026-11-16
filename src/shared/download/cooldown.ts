/**
 * Tüketim hatasında `Retry-After` bekleme sayacı (CX-F8-Ö-01; rapor `applyCooldown`/`reportGate`
 * kalıbının indirme eşdeğeri). Yalnız `Retry-After` taşıyan 429/503 yanıtları sayaç başlatır
 * (`reporting.capacity_full`, `organization.capacity_full`, `*.export_in_progress`,
 * `platform.rate_limited`, `records.busy`); başlık yoksa sayaç yoktur (süresiz metin). Sayaç
 * bitince indirme kendiliğinden BAŞLAMAZ (otomatik tekrar yok); düğme yalnız yeniden açılır.
 */
import { onScopeDispose, readonly, ref, getCurrentScope } from 'vue'

import type { DownloadResult } from './types'

const COOLDOWN_CODES: ReadonlySet<string> = new Set([
  'platform.rate_limited',
  'records.busy',
  'reporting.export_in_progress',
  'reporting.capacity_full',
  'organization.export_in_progress',
  'organization.capacity_full',
])

/** Tüketim hatasının bekleme süresi (saniye); sayaç gerektirmiyorsa `null`. */
export function cooldownSeconds(result: DownloadResult<unknown>): number | null {
  if (result.kind !== 'failed') return null
  const wait = result.retryAfter
  return COOLDOWN_CODES.has(result.error.code) && wait !== null && wait > 0 ? Math.ceil(wait) : null
}

export function useDownloadCooldown(onEnd?: () => void) {
  const seconds = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function stop(): void {
    if (timer !== null) clearInterval(timer)
    timer = null
  }
  function clear(): void {
    stop()
    seconds.value = 0
  }
  function start(wait: number): void {
    stop()
    seconds.value = wait
    timer = setInterval(() => {
      seconds.value = Math.max(0, seconds.value - 1)
      if (seconds.value > 0) return
      stop()
      onEnd?.()
    }, 1000)
  }
  if (getCurrentScope()) onScopeDispose(stop)
  return { seconds: readonly(seconds), start, clear }
}
