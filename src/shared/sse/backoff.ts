/** Yeniden bağlanma zamanlaması (istemci-akislari §10.5). */
export const BACKOFF_BASE_MS = 1_000
export const BACKOFF_MAX_MS = 60_000
export const JITTER_MAX_MS = 5_000

/**
 * `attempt` 0 = akış koptuktan sonraki ilk yeniden deneme: 1, 2, 4, 8 … sn (en çok 60 sn) +
 * her adıma 0–5 sn jitter. `random` 0..1 (testte sabit).
 */
export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
  const exp = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.min(attempt, 16))
  return exp + Math.floor(random() * JITTER_MAX_MS)
}
