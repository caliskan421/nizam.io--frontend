import { randomBytes, randomUUID } from 'node:crypto'
import { expect, request, type APIRequestContext, type APIResponse } from '@playwright/test'
import { ADMIN, readChatFixture } from './fixture'

const csrf = { 'X-Requested-With': 'XMLHttpRequest' }
type Json = Record<string, unknown>

/** Yalnız kesin 429 yanıtı aynı işlem anahtarı/gövdesiyle sınırlı tekrar edilir. */
async function retry(run: () => Promise<APIResponse>): Promise<APIResponse> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const response = await run()
    if (response.status() !== 429) return response
    const seconds = Number(response.headers()['retry-after'])
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60)
      throw new Error('429 Retry-After geçersiz veya 60 saniyeyi aşıyor')
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }
  throw new Error('429 tekrar sınırı aşıldı')
}

async function login(api: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await retry(() =>
    api.post('/v1/auth/login', { headers: csrf, data: { email, password } }),
  )
  expect(response.status(), 'login').toBe(200)
  const body = (await response.json()) as { token?: string }
  if (!body.token) throw new Error('login token yok')
  return body.token
}

export async function sparseFixture(baseURL: string) {
  const fixture = readChatFixture()
  const api = await request.newContext({ baseURL })
  const created: string[] = []
  const admin = await login(api, ADMIN.email, ADMIN.password)
  let writer = ''
  let writerId: string | null = null
  const headers = (token: string) => ({
    ...csrf,
    Authorization: `Bearer ${token}`,
    'X-Nizamio-Program': fixture.programId,
  })
  const csrfAuth = (token: string) => ({ ...csrf, Authorization: `Bearer ${token}` })
  const run = randomUUID().slice(0, 8)
  let peer = ''
  async function makeGroup(name: string) {
    const key = randomUUID()
    const group = await retry(() =>
      api.post('/v1/chats/groups', {
        headers: { ...headers(writer), 'Idempotency-Key': key },
        data: { name, member_account_ids: [fixture.chat.peerAccountId] },
      }),
    )
    expect(group.status(), 'grup oluşturma').toBe(201)
    const { chat_id: id } = (await group.json()) as { chat_id: string }
    created.push(id)
    const clientId = randomUUID()
    const message = await retry(() =>
      api.post(`/v1/chats/${id}/messages`, {
        headers: headers(writer),
        data: { body: `W189 ${name}`, client_message_id: clientId },
      }),
    )
    expect(message.status(), 'mesaj oluşturma').toBe(201)
    const { seq } = (await message.json()) as { seq: number }
    return { id, seq }
  }
  async function history(id: string) {
    const response = await retry(() =>
      api.get(`/v1/chats/${id}/messages?limit=50`, { headers: headers(peer) }),
    )
    expect(response.status(), 'geçmiş').toBe(200)
    return (await response.json()) as { first_unread_seq: number | null }
  }
  async function cleanup() {
    const failed: string[] = []
    for (const id of created) {
      try {
        const response = await retry(() =>
          api.delete(`/v1/chats/${id}`, { headers: headers(writer) }),
        )
        if (response.status() !== 204) failed.push(`${id}: ${response.status()}`)
      } catch {
        failed.push(`${id}: retry hatası`)
      }
    }
    if (writerId) {
      try {
        const response = await retry(() =>
          api.delete(`/v1/admin/accounts/${writerId}`, { headers: csrfAuth(admin) }),
        )
        if (response.status() !== 200) failed.push(`hesap: ${response.status()}`)
      } catch {
        failed.push('hesap: retry hatası')
      }
    }
    await api.dispose()
    if (failed.length) throw new Error(`Sohbet temizliği başarısız: ${failed.join(', ')}`)
  }
  try {
    const email = `sparse-${run}@e2e.nizamio.test`
    const password = `W189-${randomBytes(18).toString('hex')}aA1!`
    const account = await retry(() =>
      api.post('/v1/admin/accounts', {
        headers: csrfAuth(admin),
        data: { email, password, full_name: 'E2E Sparse Kurucu', force_password_change: false },
      }),
    )
    expect(account.status(), 'izole hesap oluşturma').toBe(201)
    writerId = ((await account.json()) as { account_id: string }).account_id
    const membership = await retry(() =>
      api.post('/v1/admin/users', {
        headers: csrfAuth(admin),
        data: {
          email,
          full_name: 'E2E Sparse Kurucu',
          program_id: fixture.programId,
          department_id: fixture.departmentId,
          role: 'uye',
          transfer_account_id: writerId,
        },
      }),
    )
    expect(membership.status(), 'izole hesap üyeliği').toBe(201)
    writer = await login(api, email, password)
    peer = await login(api, fixture.chat.peerEmail, fixture.chat.peerPassword)
    const target = await makeGroup(`W189 hedef ${run}`)
    let other = ''
    for (let i = 0; i < 50; i++) other = (await makeGroup(`W189 ${run} ${i}`)).id
    const list = await retry(() => api.get('/v1/chats?limit=50', { headers: headers(peer) }))
    expect(list.status(), 'ilk liste').toBe(200)
    const body = (await list.json()) as { items: { chat_id: string }[] } & Json
    expect(body.items).toHaveLength(50)
    expect(body.items.some((chat) => chat.chat_id === target.id)).toBe(false)
    expect((await history(target.id)).first_unread_seq).toBe(target.seq)
    return { fixture, target, other, history, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
}
