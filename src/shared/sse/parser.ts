/**
 * SSE satır ayrıştırıcısı (WHATWG `text/event-stream`; `EventSource` YASAK, KESİN 34).
 * Parçalar (chunk) satır sınırına denk gelmeyebilir; `\n`, `\r\n` ve `\r` satır sonudur.
 * `:` ile başlayan satırlar yorumdur (`: ok`, `: ping`); çok satırlı `data:` `\n` ile birleşir.
 */
export interface SseFrame {
  event: string
  data: string
  id: string | null
}

export interface SseParserHandlers {
  onFrame: (frame: SseFrame) => void
  /** Yorum satırı (`: ping`); canlılık sinyali. */
  onComment?: (text: string) => void
}

export interface SseParser {
  feed: (chunk: string) => void
  /** Akış bitti: tamamlanmamış çerçeve atılır (boş satırla kapanmamıştır). */
  reset: () => void
  readonly lastEventId: string | null
}

export function createSseParser(handlers: SseParserHandlers): SseParser {
  let buffer = ''
  let pendingCr = false
  let event = ''
  let data: string[] = []
  let id: string | null = null
  let lastEventId: string | null = null

  function dispatch(): void {
    if (data.length > 0) {
      handlers.onFrame({ event: event || 'message', data: data.join('\n'), id })
    }
    lastEventId = id ?? lastEventId
    event = ''
    data = []
    id = null
  }

  function line(text: string): void {
    if (text === '') return dispatch()
    if (text.startsWith(':')) return handlers.onComment?.(text.slice(1).trim())
    const at = text.indexOf(':')
    const field = at === -1 ? text : text.slice(0, at)
    let value = at === -1 ? '' : text.slice(at + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
    else if (field === 'id') id = value.includes('\0') ? id : value
  }

  return {
    feed(chunk) {
      let text = chunk
      // Önceki parça `\r` ile bittiyse `\n` satırı ikinci kez bölmez.
      text = pendingCr && text.startsWith('\n') ? text.slice(1) : text
      pendingCr = false
      buffer += text
      let start = 0
      for (let i = 0; i < buffer.length; i += 1) {
        const ch = buffer[i]
        if (ch !== '\n' && ch !== '\r') continue
        line(buffer.slice(start, i))
        if (ch === '\r') {
          if (buffer[i + 1] === '\n') i += 1
          else if (i + 1 === buffer.length) pendingCr = true
        }
        start = i + 1
      }
      buffer = buffer.slice(start)
    },
    reset() {
      buffer = ''
      pendingCr = false
      event = ''
      data = []
      id = null
    },
    get lastEventId() {
      return lastEventId
    },
  }
}
