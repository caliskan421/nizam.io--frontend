// CX-F8-E-01: `isCurrent` bağlam doğrulayıcısı bilet yanıtından sonra tüketimden önce ve gövde
// döndükten sonra kayıttan önce sorulur; `false` ise `disposed` (istek/kayıt/bildirim yok).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDownloadFlow } from './flow'
import type { DownloadTarget } from './types'
import {
  ADMIN,
  browserSave,
  harness,
  pdf,
  resetHarness,
  sent,
  server,
  ticketOk,
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

const target: DownloadTarget = {
  method: 'GET',
  path: '/v1/reports/season/pdf',
  headers: { 'X-Nizamio-Program': 'p1' },
  fallbackName: 'donem-raporu.pdf',
}
const run = () => harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t)).result

describe('useDownloadFlow — isCurrent', () => {
  it('bilet sonrası geçersiz: tüketim isteği atılmaz, kayıt yok', async () => {
    server.use(ticketOk(), pdf())
    expect(await run().start(target, { isCurrent: () => false })).toEqual({ kind: 'disposed' })
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(saved.clicked).toEqual([])
  })

  it('tüketim gövdesi döndükten sonra geçersiz: kayıt yok', async () => {
    server.use(ticketOk(), pdf())
    let calls = 0
    // İlk iki soru tüketimden önce (geçerli), üçüncüsü gövde döndükten sonra (geçersiz).
    const result = await run().start(target, { isCurrent: () => (calls += 1) <= 2 })
    expect(result).toEqual({ kind: 'disposed' })
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(1)
    expect(saved.clicked).toEqual([])
  })

  it('geçerli bağlam: kaydeder', async () => {
    server.use(ticketOk(), pdf())
    const result = await run().start(target, { isCurrent: () => true })
    expect(result.kind).toBe('saved')
    expect(saved.clicked).toHaveLength(1)
  })
})
