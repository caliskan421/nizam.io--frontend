import { describe, expect, it } from 'vitest'

import { createSseParser, type SseFrame } from './parser'

function run(chunks: string[]) {
  const frames: SseFrame[] = []
  const comments: string[] = []
  const parser = createSseParser({
    onFrame: (f) => frames.push(f),
    onComment: (c) => comments.push(c),
  })
  for (const chunk of chunks) parser.feed(chunk)
  return { frames, comments, parser }
}

describe('createSseParser', () => {
  it('olay adı, veri ve kimliği okur; yorum satırları çerçeve değildir', () => {
    const { frames, comments } = run([
      ': ok\n\n',
      'event: message.created\nid: 7\ndata: {"chat_id":"c1"}\n\n',
      ': ping\n\n',
    ])
    expect(comments).toEqual(['ok', 'ping'])
    expect(frames).toEqual([{ event: 'message.created', data: '{"chat_id":"c1"}', id: '7' }])
  })

  it('çok satırlı data satırları \\n ile birleşir', () => {
    const { frames } = run(['event: x\ndata: a\ndata: b\ndata:\ndata: c\n\n'])
    expect(frames[0]?.data).toBe('a\nb\n\nc')
  })

  it('parça satır ortasında bölünse de aynı sonucu verir', () => {
    const whole = 'event: read.updated\ndata: {"chat_id":"c"}\n\n'
    const split = [...whole].map((ch) => ch)
    const { frames } = run(split)
    expect(frames).toEqual([{ event: 'read.updated', data: '{"chat_id":"c"}', id: null }])
  })

  it('CRLF ve tek CR satır sonu; CR/LF parçalara bölünebilir', () => {
    expect(run(['event: a\r\ndata: 1\r\n\r\n']).frames).toHaveLength(1)
    expect(run(['event: a\rdata: 1\r\r']).frames).toHaveLength(1)
    expect(run(['event: a\r', '\ndata: 1\r', '\n\r', '\n']).frames[0]).toMatchObject({
      event: 'a',
      data: '1',
    })
  })

  it('olay adı yoksa message; verisiz çerçeve atılır; son kimlik korunur', () => {
    const { frames, parser } = run(['data: x\n\n', 'event: boş\n\n', 'id: 9\ndata: y\n\n'])
    expect(frames.map((f) => f.event)).toEqual(['message', 'message'])
    expect(parser.lastEventId).toBe('9')
  })

  it('reset kapanmamış çerçeveyi atar', () => {
    const { frames, parser } = run(['event: a\ndata: yarım'])
    parser.reset()
    parser.feed('\n\n')
    expect(frames).toEqual([])
  })
})
