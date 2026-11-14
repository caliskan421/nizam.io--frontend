/**
 * Olay birleştirici: aynı (olay adı, sohbet) çifti için pencere içindeki olaylar TEK toplu
 * olaya iner (≥ 1 sn; sohbet başına tek toplu okuma, istemci-akislari §10.5). Pencere ilk
 * olayla açılır ve uzamaz (sürekli gelen olay okumayı sonsuza ertelemesin).
 */
export interface StreamEvent {
  name: string
  chatId: string
  messageId: string | null
  actorAccountId: string
  affectedAccountIds: string[]
}

export interface CoalescedEvent {
  name: string
  chatId: string
  /** Pencerede görülen mesaj kimlikleri (sırayla, tekil). */
  messageIds: string[]
  actorAccountIds: string[]
  affectedAccountIds: string[]
  /** Birleşen ham olay sayısı. */
  count: number
}

export interface Coalescer {
  push: (event: StreamEvent) => void
  /** Bekleyenleri atar (iptal/kapanış; geç teslimat yok). */
  clear: () => void
  readonly pending: number
}

export const COALESCE_MS = 1_000

export function createCoalescer(
  emit: (event: CoalescedEvent) => void,
  windowMs: number = COALESCE_MS,
): Coalescer {
  const groups = new Map<string, CoalescedEvent>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function add(into: string[], value: string | null): void {
    if (value !== null && !into.includes(value)) into.push(value)
  }

  return {
    push(event) {
      const key = `${event.name}\u0000${event.chatId}`
      let group = groups.get(key)
      if (!group) {
        group = {
          name: event.name,
          chatId: event.chatId,
          messageIds: [],
          actorAccountIds: [],
          affectedAccountIds: [],
          count: 0,
        }
        groups.set(key, group)
        timers.set(
          key,
          setTimeout(() => {
            const done = groups.get(key)
            groups.delete(key)
            timers.delete(key)
            if (done) emit(done)
          }, windowMs),
        )
      }
      group.count += 1
      add(group.messageIds, event.messageId)
      add(group.actorAccountIds, event.actorAccountId)
      for (const id of event.affectedAccountIds) add(group.affectedAccountIds, id)
    },
    clear() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      groups.clear()
    },
    get pending() {
      return groups.size
    },
  }
}
