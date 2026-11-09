/**
 * CX-F1-E-05 devamı — koordinatör kararı (W67): sahip sökülmesi, 401 → refresh → TAŞIYICI
 * TEKRARINI BİLİNÇLİ OLARAK ENGELLEMEZ. Gerekçe: tekrar yeni bir yazma kararı değil, sunucunun
 * kimlik nedeniyle İŞLEMEDİĞİ aynı isteğin tamamlanmasıdır; engellemek, belirteç tam o anda
 * dolduysa kullanıcının kaydet komutunu bildirim alacak kimse kalmadan SESSİZCE düşürürdü.
 * Sınır: tekrar özdeştir (gövde, IK, CSRF, kapsam aynı; yalnız `Authorization` yeni), en fazla
 * bir kez gider ve yalnız aynı kimlik/oturum neslinde (`shared/http/client.retry.test.ts`).
 * Sökülmüş sahip YENİ yazma başlatamaz (W66 kapısı: `owner_disposed`, HTTP 0).
 * Gerçek hook + gerçek API istemcisi/oturum nesnesi + MSW; istek sayısıyla.
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { authSession } from '@/shared/http'

import {
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  note,
  ORIGIN,
  resetHarness,
  sent,
  server,
  subtask,
  type Recorded,
} from '../model/__tests__/harness'
import { useAddNote } from './notes'
import { useUpdateSubtask } from './subtasks'

const OLD_TOKEN = 'tok-eski-0000000001'
const NEW_TOKEN = 'tok-yeni-0000000002'
const expiresAt = () => Math.floor(Date.now() / 1000) + 900

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  authSession.clear()
})
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd2' }
const ref = { target, workItemId: 'w1' }
const SUBTASK_PATH = '/v1/work-items/w1/subtasks/s1'
const NOTES_PATH = '/v1/work-items/w1/notes'
const COPIED = [
  'Idempotency-Key',
  'X-Requested-With',
  'X-Nizamio-Program',
  'X-Nizamio-Department',
  'Content-Type',
]

/** Oturum: eski belirteçle açık; refresh yeni belirteci aynı hesaba verir. */
function signedIn() {
  authSession.establish({
    token: OLD_TOKEN,
    account_id: 'acc-1',
    expires_at: expiresAt(),
    force_password_change: false,
  })
  server.use(
    http.post(`${ORIGIN}/v1/auth/refresh`, () =>
      json({ token: NEW_TOKEN, account_id: 'acc-1', expires_at: expiresAt() }),
    ),
  )
}

/** İlk yazma `release` edilene dek bekletilir ve 401 döner; sonraki `ok` ile yanıtlanır. */
function heldUntil401(ok: () => Response) {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  let count = 0
  const resolver = async () => {
    count += 1
    if (count > 1) return ok()
    arrived()
    await held
    return errorEnvelope('platform.unauthenticated', 401)
  }
  return { resolver, reached, release }
}

function mountOwner<T>(setup: () => T) {
  const h = harness(COORD_SCOPE)
  let hook!: T
  const Owner = defineComponent({
    setup() {
      hook = setup()
      return () => null
    },
  })
  const wrapper = mount(Owner, {
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { hook, unmount: () => wrapper.unmount(), flush: h.flush }
}

function expectIdenticalRetry(calls: Recorded[]) {
  expect(calls).toHaveLength(2)
  const first = calls[0]!
  const retry = calls[1]!
  expect(retry.body).toEqual(first.body)
  expect(retry.query.toString()).toBe(first.query.toString())
  for (const name of COPIED) expect(retry.headers.get(name), name).toBe(first.headers.get(name))
  expect(retry.headers.get('X-Nizamio-Department')).toBe('d2')
  expect(calls.map((c) => c.headers.get('Authorization'))).toEqual([
    `Bearer ${OLD_TOKEN}`,
    `Bearer ${NEW_TOKEN}`,
  ])
}

describe('sahip sökülmesi taşıyıcı tekrarını engellemez — aynı isteğin tamamlanması, yeni karar değil; sessiz kayıp önlenir', () => {
  it('alt görev PATCH: gönderim → sökülme → 401 → refresh → aynı PATCH bir kez daha (2 istek, 2xx); sonuç başarı; sonraki submit owner_disposed, HTTP 0', async () => {
    signedIn()
    const gate = heldUntil401(() => json(subtask({ title: 'Yeni' })))
    server.use(http.patch(`${ORIGIN}${SUBTASK_PATH}`, gate.resolver))
    const { hook: update, unmount, flush } = mountOwner(() => useUpdateSubtask())
    const input = { ...ref, base: subtask(), changes: { title: 'Yeni' } }

    const pending = update.submit(input)
    await gate.reached
    unmount()
    gate.release()
    const outcome = await pending
    await flush()

    expect(outcome.kind).toBe('success')
    const calls = sent('PATCH', SUBTASK_PATH)
    expectIdenticalRetry(calls)
    expect(calls[1]!.body).toEqual({ title: 'Yeni', expected_revision: 5 })
    expect(sent('POST', '/v1/auth/refresh')).toHaveLength(1)

    const again = await update.submit(input)
    expect(again.kind).toBe('owner_disposed')
    expect(sent('PATCH', SUBTASK_PATH)).toHaveLength(2)
  })

  it('not ekleme (IK zorunlu): sökülmeden sonra tekrar aynı Idempotency-Key ile tek kez gider; sonraki submit owner_disposed', async () => {
    signedIn()
    const gate = heldUntil401(() => json(note({ content: 'Kaydet' }), 201))
    server.use(http.post(`${ORIGIN}${NOTES_PATH}`, gate.resolver))
    const { hook: add, unmount, flush } = mountOwner(() => useAddNote())

    const pending = add.submit({ ...ref, content: 'Kaydet' })
    await gate.reached
    unmount()
    gate.release()
    const outcome = await pending
    await flush()

    expect(outcome.kind).toBe('success')
    const calls = sent('POST', NOTES_PATH)
    expectIdenticalRetry(calls)
    expect(calls[1]!.headers.get('Idempotency-Key')).toBeTruthy()

    expect((await add.submit({ ...ref, content: 'İkinci' })).kind).toBe('owner_disposed')
    expect(sent('POST', NOTES_PATH)).toHaveLength(2)
  })
})
