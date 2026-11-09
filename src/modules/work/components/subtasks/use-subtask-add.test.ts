import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  subtask,
  workItem,
} from '../../model/__tests__/harness'
import { targetOf } from '../../model/target'
import { useSubtaskAdd } from './use-subtask-add'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useToast().clear()
  resetHarness()
})
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'
const item = workItem()

function setup() {
  const h = harness(ADMIN_SCOPE)
  return h.run(() =>
    useSubtaskAdd(
      () => item,
      () => targetOf(item),
    ),
  )
}

const keys = () => sent('POST', PATH).map((r) => r.headers.get('Idempotency-Key'))

describe('alt görev ekle (E-03-37)', () => {
  it('boş / yalnız boşluk başlık reddedilir: istek yok', async () => {
    const add = setup()
    add.draft.value = '   '
    expect(await add.submit()).toBe(false)
    expect(sent('POST', PATH)).toHaveLength(0)
  })

  it('başarı: kırpılmış başlık, görev kapsamı, taslak temizlenir; her Enter yeni anahtar', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json(subtask(), 201)))
    const add = setup()
    add.draft.value = '  Çizim  '
    expect(await add.submit()).toBe(true)
    expect(add.draft.value).toBe('')
    add.draft.value = 'İkinci'
    await add.submit()
    const [first, second] = sent('POST', PATH)
    expect(first!.body).toEqual({ title: 'Çizim' })
    expect(first!.headers.get('X-Nizamio-Department')).toBe('d2')
    const [k1, k2] = keys()
    expect(isValidIdempotencyKey(k1 ?? '')).toBe(true)
    expect(k1).not.toBe(k2)
    expect(second!.body).toEqual({ title: 'İkinci' })
  })

  it('sonuç bilinmiyor: taslak + anahtar korunur; aynı taslakla Enter AYNI anahtar, değişince yeni', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${PATH}`, () =>
        ++calls <= 2 ? errorEnvelope('platform.internal', 503) : json(subtask(), 201),
      ),
    )
    const add = setup()
    add.draft.value = 'Çizim'
    expect(await add.submit()).toBe(false)
    expect(add.draft.value).toBe('Çizim')
    expect(add.notice.value?.kind).toBe('unknown_outcome')
    await add.submit()
    add.draft.value = 'Çizim 2'
    expect(await add.submit()).toBe(true)
    const [k1, k2, k3] = keys()
    expect(k2).toBe(k1)
    expect(k3).not.toBe(k1)
    expect(add.notice.value).toBeNull()
  })

  it('409 subtask_limit_reached: bildirim, taslak korunur', async () => {
    server.use(
      http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.subtask_limit_reached', 409)),
    )
    const add = setup()
    add.draft.value = 'Fazla'
    expect(await add.submit()).toBe(false)
    expect(add.draft.value).toBe('Fazla')
    expect(useToast().current.value?.message).toBe('Alt görev sınırına ulaşıldı.')
    expect(add.notice.value).toBeNull()
  })
})
