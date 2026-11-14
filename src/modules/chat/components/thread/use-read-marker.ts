/**
 * Okundu işaretleme (N-10-01, E-10-17/37): sohbet görünür + pencere odakta + akışın sonu görüş
 * alanında → son GÖRÜNEN, başkasına ait mesajın `message_id`'siyle `markChatRead`, 1 sn gecikmeli
 * TEK istek (art arda tetikler birleşir). Kendi gönderimimden sonra ayrı çağrı yoktur (okunmamış
 * sayımı başkasının mesajıdır). 404 `messaging.message_not_found` → son görünen BAŞKA mesajla
 * bir kez daha. Sunucu geri gitmeyi reddeder; istemci de `seq` geriye gitmez. Sahip sökülünce
 * bekleyen gönderim iptal edilir (KESİN 26a). Odak/görünürlük dönüşü aynı birleşik tetikleyiciye
 * bağlanır (odaksızken vazgeçilen okundu dönüşte tek istekle gider; dinleyiciler sökülmede kalkar).
 */
import { onScopeDispose, type Ref } from 'vue'

import { useMarkChatRead } from '../../api/writes'
import type { ChatMessage } from '../../model/types'
import { atBottom } from './scroll'

export const READ_DEBOUNCE_MS = 1000
const NOT_FOUND = 'messaging.message_not_found'

export interface ReadMarkerInput {
  list: Ref<HTMLElement | null>
  items: () => readonly ChatMessage[]
  chatId: () => string
  programId: () => string
  meId: () => string | null
  hasNewer: () => boolean
  /** Okunmamış sayı (liste özetinden); özet yoksa `null` (bir kez işaretlenir). */
  unread: () => number | null
}

/** Görünüm alanına giren, başkasına ait mesajlar (`seq` artan). */
export function visibleOthers(
  list: HTMLElement,
  items: readonly ChatMessage[],
  meId: string | null,
): ChatMessage[] {
  const box = list.getBoundingClientRect()
  const seen = new Set<string>()
  for (const el of list.querySelectorAll<HTMLElement>('[data-message-id]')) {
    const rect = el.getBoundingClientRect()
    if (rect.bottom >= box.top && rect.top <= box.bottom) seen.add(el.dataset.messageId ?? '')
  }
  return items.filter((m) => seen.has(m.message_id) && m.sender_account_id !== meId)
}

function focused(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus()
}

export function useReadMarker(input: ReadMarkerInput) {
  const mark = useMarkChatRead()
  let timer: ReturnType<typeof setTimeout> | null = null
  let sentSeq = 0
  let chat = input.chatId()
  let disposed = false

  function target(skip: ReadonlySet<string>): ChatMessage | null {
    const list = input.list.value
    if (!list || input.hasNewer() || !atBottom(snapshot(list))) return null
    const unread = input.unread()
    if (unread !== null && unread <= 0) return null
    const others = visibleOthers(list, input.items(), input.meId()).filter(
      (m) => !skip.has(m.message_id),
    )
    const last = others.at(-1)
    return last && last.seq > sentSeq ? last : null
  }

  async function send(skip: Set<string>): Promise<void> {
    if (disposed || !focused()) return
    const message = target(skip)
    if (!message) return
    const outcome = await mark.submit({
      programId: input.programId(),
      chatId: input.chatId(),
      messageId: message.message_id,
    })
    if (disposed) return
    if (outcome.kind === 'success') sentSeq = Math.max(sentSeq, message.seq)
    else if (outcome.kind === 'failed' && outcome.error.code === NOT_FOUND && skip.size === 0) {
      await send(skip.add(message.message_id))
    }
  }

  /** Tetik: kaydırma, pencere değişimi, odak/görünürlük. Bekleyen gönderim varsa birleşir. */
  function touch(): void {
    if (chat !== input.chatId()) {
      chat = input.chatId()
      sentSeq = 0
    }
    if (timer !== null) return
    timer = setTimeout(() => {
      timer = null
      void send(new Set())
    }, READ_DEBOUNCE_MS)
  }

  // Odak/görünürlük dönüşü: odaksızken vazgeçen gönderim dönüşte yeniden (birleşik) tetiklenir.
  function onReturn(): void {
    if (!disposed && focused()) touch()
  }
  globalThis.addEventListener?.('focus', onReturn)
  globalThis.document?.addEventListener('visibilitychange', onReturn)

  onScopeDispose(() => {
    globalThis.removeEventListener?.('focus', onReturn)
    globalThis.document?.removeEventListener('visibilitychange', onReturn)
    disposed = true
    if (timer !== null) clearTimeout(timer)
    timer = null
  })
  return { touch }
}

function snapshot(el: HTMLElement) {
  return { top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight }
}
