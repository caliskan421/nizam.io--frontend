// CX-F2-Ö-01: organizasyon okuyucuları oturuma bağlı (`sessionBound`). `listUsers` üzerinde iki
// senaryo — çıkış → başka hesapla giriş sırasında (a) geciktirilmiş GET'in geç yanıtı önbelleğe
// yazılmaz, (b) geçici hata tekrarı yeni hesabın kimliğiyle sürdürülmez. Burada kabuğun merkezi
// `bindSessionQueries` katmanı KURULMAZ: yalnız okuyucu kapısı sınanır.
import { focusManager } from '@tanstack/vue-query'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { SessionChangedError } from '@/shared/session/query-session'

import type { UserListFilters } from '../model/types'
import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  knownUser,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import { useUserList } from './users'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  focusManager.setFocused(undefined)
  authSession.clear()
})
afterAll(() => server.close())

const USERS = `${ORIGIN}/v1/admin/users`
const ASC: UserListFilters = { search: null, sortOrder: 'asc' }
const KEY = queryKeys.users.list({ search: null, sortOrder: 'asc' })

const login = (accountId: string) => ({
  token: `tok-${accountId}`,
  account_id: accountId,
  expires_at: Math.floor(Date.now() / 1000) + 900,
  force_password_change: false,
})

/** Çıkış → başka hesapla (acc-2) giriş. */
function switchAccount(): void {
  authSession.clear()
  authSession.establish(login('acc-2'))
}

const bearers = () => sent('GET', '/v1/admin/users').map((r) => r.headers.get('Authorization'))

describe('listUsers okuyucu kapısı (CX-F2-Ö-01)', () => {
  it('geciktirilmiş GET: eski oturumun geç yanıtı yeni oturumun önbelleğine yazılmaz', async () => {
    authSession.establish(login('acc-1'))
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(USERS, async () => {
        await gate
        return json({ users: [knownUser('eski', 'Eski oturum')] })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(sent('GET', '/v1/admin/users')).toHaveLength(1))
    switchAccount()
    release()
    await vi.waitFor(() => expect(list.query.isFetching.value).toBe(false))

    expect(h.queryClient.getQueryData(KEY)).toBeUndefined()
    expect(h.queryClient.getQueryState(KEY)?.error).toBeInstanceOf(SessionChangedError)
    expect(list.users.value).toEqual([])
    expect(bearers()).toEqual(['Bearer tok-acc-1'])
  })

  it('geçici hata tekrarı: eski sorgu yeni hesabın kimliğiyle sürdürülmez', async () => {
    authSession.establish(login('acc-1'))
    server.use(
      http.get(USERS, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer tok-acc-1'
          ? errorEnvelope('platform.internal', 503)
          : json({ users: [knownUser('yeni', 'Yeni oturum')] }),
      ),
    )
    // Tekrar, odak dönene dek bekler (TanStack `pause`): hesap değişimi tam bu aralıkta olur.
    focusManager.setFocused(false)
    const h = harness(ADMIN_SCOPE)
    h.queryClient.setQueryDefaults(KEY, { retryDelay: 0 })
    const list = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(h.queryClient.getQueryState(KEY)?.fetchStatus).toBe('paused'))
    expect(h.queryClient.getQueryState(KEY)?.fetchFailureCount).toBe(1)
    switchAccount()
    focusManager.setFocused(true)
    await vi.waitFor(() => expect(h.queryClient.getQueryState(KEY)?.status).toBe('error'))
    expect(list.query.isFetching.value).toBe(false)

    expect(h.queryClient.getQueryData(KEY)).toBeUndefined()
    expect(h.queryClient.getQueryState(KEY)?.error).toBeInstanceOf(SessionChangedError)
    // acc-1 tek istek (başarısız ilk deneme); tekrar acc-2 belirteciyle GÖNDERİLMEDİ.
    expect(bearers()).toEqual(['Bearer tok-acc-1'])
  })
})
