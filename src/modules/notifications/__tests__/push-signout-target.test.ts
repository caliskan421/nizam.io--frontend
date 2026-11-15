// E-14-79: `target_id` yalnız bellekte; çıkışta `unregisterPushTarget` (gövdesiz DELETE, 404 sessiz)
// + yerel unsubscribe. Açık çıkış (belirteç geçerliyken) ve nesil değişimi (kardeş sekme) ayrı yollar.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { authSession } from '@/shared/http'
import { signOut } from '@/shared/scope/sign-out'

import { errorEnvelope, http, noContent, ORIGIN, resetAll, sent, server, signIn } from './harness'
import { installPushSignOutHook, ensurePushSignOutHook } from '../model/push-signout'
import { peekPushTarget, rememberPushTarget, takePushTarget } from '../model/push-target'

// Uygulamadaki gibi: kutu modülü içe aktarılınca bir kez kurulur (nesil kancası + çıkış öncesi kanca).
ensurePushSignOutHook()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  takePushTarget()
})
afterAll(() => server.close())
beforeEach(() => {
  setActivePinia(createPinia())
  signIn()
})

const deletePath = (id: string) => `/v1/notifications/targets/${id}`

describe('bellekteki hedef kimliği', () => {
  it('alınınca unutulur (iki kez silinmez)', () => {
    rememberPushTarget('t-1')
    expect(peekPushTarget()).toBe('t-1')
    expect(takePushTarget()).toBe('t-1')
    expect(takePushTarget()).toBeNull()
  })
})

describe('açık çıkış (signOut)', () => {
  it('kayıt → çıkış: DELETE gövdesiz, belirteç geçerliyken, logout ÖNCE değil SONRA; yerel unsubscribe', async () => {
    const order: string[] = []
    let deleteHeaders: Headers | null = null
    let deleteBody = ''
    server.use(
      http.delete(`${ORIGIN}/v1/notifications/targets/:id`, async ({ request }) => {
        order.push('delete')
        deleteHeaders = new Headers(request.headers)
        deleteBody = await request.text()
        return noContent()
      }),
      http.post(`${ORIGIN}/v1/auth/logout`, () => {
        order.push('logout')
        return noContent()
      }),
    )
    const unsubscribe = vi.fn(() => Promise.resolve())
    const off = installPushSignOutHook(authSession, unsubscribe)
    rememberPushTarget('t-1')

    const outcome = await signOut(null)

    expect(outcome).toBe('verified')
    expect(order).toEqual(['delete', 'logout'])
    expect(sent('DELETE', deletePath('t-1'))).toHaveLength(1)
    expect(deleteBody).toBe('')
    expect(deleteHeaders!.get('Authorization')).toBe('Bearer tok-1')
    expect(deleteHeaders!.get('X-Requested-With')).toBeTruthy()
    await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(1))
    // Kimlik çıkıştan önce alındı: nesil kancası ikinci DELETE göndermez.
    expect(sent('DELETE', deletePath('t-1'))).toHaveLength(1)
    expect(peekPushTarget()).toBeNull()
    off()
  })

  it('404 sessiz: çıkış doğrulanır, hata yüzeye çıkmaz', async () => {
    server.use(
      http.delete(`${ORIGIN}/v1/notifications/targets/:id`, () =>
        errorEnvelope('notifications.subscription_not_found', 404),
      ),
      http.post(`${ORIGIN}/v1/auth/logout`, () => noContent()),
    )
    rememberPushTarget('t-gone')
    await expect(signOut(null)).resolves.toBe('verified')
    expect(sent('DELETE', deletePath('t-gone'))).toHaveLength(1)
    expect(authSession.snapshot.status).toBe('anonymous')
  })

  it('hedef kaydı yoksa DELETE gitmez', async () => {
    server.use(http.post(`${ORIGIN}/v1/auth/logout`, () => noContent()))
    await signOut(null)
    expect(sent('DELETE', deletePath('t-1'))).toHaveLength(0)
  })
})

describe('nesil değişimi (kardeş sekme çıkışı)', () => {
  it('belirteç yoksa yalnız yerel unsubscribe; DELETE gitmez, kimlik unutulur', async () => {
    const unsubscribe = vi.fn(() => Promise.resolve())
    const off = installPushSignOutHook(authSession, unsubscribe)
    rememberPushTarget('t-2')
    authSession.clear()
    await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(1))
    expect(sent('DELETE', deletePath('t-2'))).toHaveLength(0)
    expect(peekPushTarget()).toBeNull()
    off()
  })

  it('başka hesaba geçişte (belirteç var) eski hedef için DELETE; 404 sessiz', async () => {
    server.use(
      http.delete(`${ORIGIN}/v1/notifications/targets/:id`, () =>
        errorEnvelope('notifications.subscription_not_found', 404),
      ),
    )
    const unsubscribe = vi.fn(() => Promise.resolve())
    const off = installPushSignOutHook(authSession, unsubscribe)
    rememberPushTarget('t-3')
    authSession.establish({
      token: 'tok-2',
      account_id: 'acc-2',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      force_password_change: false,
    })
    await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(sent('DELETE', deletePath('t-3'))).toHaveLength(1))
    off()
  })
})
