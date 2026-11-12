import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import {
  ADMIN,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import { spySaves, TARGET, ticketOk, zipBody } from './__tests__/zip-harness'
import { useZipDownload } from './use-zip-download'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const request = { target: TARGET, kind: 'folder', id: 'd7', fallbackName: 'k.zip' } as const

describe('useZipDownload', () => {
  it('idle → busy → saved; sürerken ikinci çağrı yok sayılır', async () => {
    spySaves()
    server.use(ticketOk(), zipBody())
    const { result } = harness(ADMIN).run(() => useZipDownload('folder', () => 'd7'))
    expect(result.phase.value).toBe('idle')
    const first = result.start(request)
    expect(result.phase.value).toBe('busy')
    await result.start(request)
    await first
    expect(result.phase.value).toBe('saved')
    expect(result.error.value).toBeNull()
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
  })

  it('hata: failed + metin; sonraki çağrı yeni bilet (otomatik tekrar yok)', async () => {
    spySaves()
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('records.too_large', 422)),
    )
    const { result } = harness(ADMIN).run(() => useZipDownload('period', () => 'x'))
    await result.start(request)
    expect(result.phase.value).toBe('failed')
    expect(result.error.value).toMatch(/Dönem arşivi/)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    await result.start(request)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(2)
  })

  it('kimlik değişince durum sıfırlanır ve uçuştaki bayat sonuç yazılmaz', async () => {
    spySaves()
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await gate
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('records.too_large', 422)),
    )
    const id = ref('a')
    const { result } = harness(ADMIN).run(() => useZipDownload('folder', () => id.value))
    const pending = result.start(request)
    id.value = 'b'
    await nextTick()
    expect(result.phase.value).toBe('idle')
    release()
    await pending
    expect(result.phase.value).toBe('idle')
    expect(result.error.value).toBeNull()
  })

  it('sahip bilet beklerken sökülürse bilet tüketilmez, durum değişmez', async () => {
    spySaves()
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await gate
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      zipBody(),
    )
    const { result, app } = harness(ADMIN).run(() => useZipDownload('folder', () => 'd7'))
    const pending = result.start(request)
    app.unmount()
    release()
    await pending
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(result.phase.value).toBe('busy')
  })
})
