import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { useToast } from '@/shared/ui'

import {
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { useRemindWorkItem } from './remind'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useToast().clear()
  resetHarness()
})
afterAll(() => server.close())

const item = { work_item_id: 'w1', program_id: 'p1', department_id: 'd2' }
const PATH = '/v1/work-items/w1/remind'

describe('useRemindWorkItem (BE-008)', () => {
  it('202: görevin kendi S3 kapsamı, Idempotency-Key yok, "n kişiye gönderildi"', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json({ recipient_count: 3 }, 202)))
    const r = harness(COORD_SCOPE).run(() => useRemindWorkItem())
    await r.remind(item)
    const [req] = sent('POST', PATH)
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(useToast().current.value?.message).toBe('3 kişiye hatırlatma gönderildi.')
  })

  it('alıcı yoksa nötr ileti; 403 üye için kod → i18n, tekrar yok', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json({ recipient_count: 0 }, 202)))
    const r = harness(COORD_SCOPE).run(() => useRemindWorkItem())
    await r.remind(item)
    expect(useToast().current.value?.message).toBe('Hatırlatılacak atanan yok.')
    useToast().clear()
    server.use(http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.not_authorized', 403)))
    await r.remind(item)
    expect(sent('POST', PATH)).toHaveLength(2)
    expect(useToast().current.value?.message).not.toContain('sunucu')
  })

  it('çift tık kilidi: istek sürerken ikinci çağrı gönderilmez', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post(`${ORIGIN}${PATH}`, async () => {
        await gate
        return json({ recipient_count: 1 }, 202)
      }),
    )
    const r = harness(COORD_SCOPE).run(() => useRemindWorkItem())
    const first = r.remind(item)
    await Promise.resolve()
    const second = r.remind(item)
    release()
    await Promise.all([first, second])
    expect(sent('POST', PATH)).toHaveLength(1)
  })
})
