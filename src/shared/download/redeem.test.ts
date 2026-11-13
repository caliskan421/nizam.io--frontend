import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { linkSignals, ticketBody } from './flow'
import { redeemAndSave } from './redeem'
import {
  browserSave,
  errorEnvelope,
  http,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
} from './__tests__/harness'

let saved: ReturnType<typeof browserSave>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
})
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

describe('redeemAndSave', () => {
  it('sözleşme dışı bilet yolu tüketilmez', async () => {
    expect(await redeemAndSave('https://kotu.example/x', 'a.pdf')).toMatchObject({
      kind: 'failed',
      error: { code: 'client.invalid_response' },
    })
    expect(sent('GET', '/x')).toHaveLength(0)
  })

  it('Content-Disposition adı kaydedilir; yol ayracı temizlenir', async () => {
    server.use(pdf({ 'Content-Disposition': 'attachment; filename="../a.pdf"' }))
    expect(await redeemAndSave('/v1/downloads/tk_1', 'yedek.pdf')).toEqual({
      kind: 'saved',
      fileName: '.._a.pdf',
    })
    expect(saved.clicked).toEqual(['.._a.pdf'])
  })

  it('ağ kopması: failed (kaydedilmez)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('platform.internal', 500)),
    )
    expect((await redeemAndSave('/v1/downloads/tk_1', 'a.pdf')).kind).toBe('failed')
    expect(saved.clicked).toEqual([])
  })
})

describe('yardımcılar', () => {
  it('ticketBody: gövde yalnız POST hedefinde', () => {
    const base = { path: '/p', headers: {}, fallbackName: 'a' }
    expect(ticketBody({ ...base, method: 'GET', body: { x: 1 } })).toEqual({
      method: 'GET',
      path: '/p',
    })
    expect(ticketBody({ ...base, method: 'POST', body: { x: 1 } })).toEqual({
      method: 'POST',
      path: '/p',
      body: { x: 1 },
    })
    expect(ticketBody({ ...base, method: 'POST' })).toEqual({ method: 'POST', path: '/p' })
  })

  it('linkSignals: ikisinden biri iptal olunca bağlı sinyal iptal olur', () => {
    const a = new AbortController()
    const b = new AbortController()
    const linked = linkSignals(a.signal, b.signal)
    expect(linked.aborted).toBe(false)
    b.abort()
    expect(linked.aborted).toBe(true)
    expect(linkSignals(a.signal)).toBe(a.signal)
    const pre = new AbortController()
    pre.abort()
    expect(linkSignals(a.signal, pre.signal).aborted).toBe(true)
  })
})
