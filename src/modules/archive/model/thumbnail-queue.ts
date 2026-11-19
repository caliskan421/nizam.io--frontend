import { toApiError } from '@/shared/errors/api-error'

const CONCURRENCY = 2
const DEFAULT_COOLDOWN_SECONDS = 30

/** Izgara başına tek kuyruk. 429 gelince sunucunun belirttiği süre boyunca yeni okuma yapılmaz. */
export function createThumbnailQueue() {
  const pending: Array<() => void> = []
  let running = 0
  let pausedUntil = 0

  function drain(): void {
    while (running < CONCURRENCY && pending.length > 0) pending.shift()?.()
  }

  return function load(signal: AbortSignal, fetchImage: () => Promise<Blob>): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      pending.push(() => {
        if (signal.aborted || Date.now() < pausedUntil) return resolve(null)
        running += 1
        void Promise.resolve()
          .then(() => (signal.aborted ? null : fetchImage()))
          .then(resolve, (error: unknown) => {
            const failure = toApiError(error)
            const { status, retryAfter } = failure
            if (status === 429) {
              const until = Date.now() + (retryAfter ?? DEFAULT_COOLDOWN_SECONDS) * 1000
              pausedUntil = Math.max(pausedUntil, until)
            }
            reject(failure)
          })
          .finally(() => {
            running -= 1
            drain()
          })
      })
      drain()
    })
  }
}

export type ThumbnailQueue = ReturnType<typeof createThumbnailQueue>
