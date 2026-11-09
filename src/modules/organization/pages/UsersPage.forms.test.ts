// W74 formlarıyla GERÇEK entegrasyon (taslak yok): kullanıcı oluştur → kişi seçilir → geçici
// parola adımı açılır → parola gönderilir ve hiçbir önbellekte / DOM'da kalmaz; panelden
// "Geçici parola belirle" aynı diyalogla.
import type { QueryClient } from '@tanstack/vue-query'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'

import { http, json, ORIGIN, resetHarness, sent, server } from '../__tests__/harness'
import {
  baseHandlers,
  mountWith,
  seedUsers,
  settle,
  unmountAll,
  usersHandler,
} from '../components/users/__tests__/users-harness'
import UserPanel from '../components/users/UserPanel.vue'
import UsersPage from './UsersPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  useToast().clear()
})
afterAll(() => server.close())

const SECRET = 'Gizli-Parola-42'
const $ = (selector: string) => document.querySelector(selector)

function type(selector: string, value: string, event = 'input'): void {
  const el = $(selector) as HTMLInputElement | HTMLSelectElement
  el.value = value
  el.dispatchEvent(new Event(event))
}

function click(selector: string): void {
  ;($(selector) as HTMLElement).click()
}

/** Parola: istek gövdesi dışında hiçbir yerde (sorgu/mutasyon önbelleği, DOM, toast) yok. */
async function expectNoSecret(qc: QueryClient): Promise<void> {
  const queries = qc
    .getQueryCache()
    .getAll()
    .map((q) => q.state)
  expect(JSON.stringify(queries)).not.toContain(SECRET)
  // Mutasyon `gcTime: 0` ile önbellekten düşer (W71 `useSetTemporaryPassword`).
  await vi.waitFor(() =>
    expect(
      JSON.stringify(
        qc
          .getMutationCache()
          .getAll()
          .map((m) => m.state),
      ),
    ).not.toContain(SECRET),
  )
  expect(document.body.innerHTML).not.toContain(SECRET)
  const inputs = [...document.querySelectorAll('input')].map((i) => i.value)
  expect(inputs).not.toContain(SECRET)
  expect(JSON.stringify(useToast().queue.value)).not.toContain(SECRET)
}

const passwordHandler = (id: string) =>
  http.patch(`${ORIGIN}/v1/admin/accounts/${id}`, () =>
    json({ account_id: id, revoked_sessions: 0 }),
  )

async function setPassword(accountId: string): Promise<void> {
  await vi.waitFor(() => expect($('[name="password"]')).not.toBeNull())
  type('[name="password"]', SECRET)
  await settle()
  click('[form="of-temp-password"]')
  await vi.waitFor(() =>
    expect(sent('PATCH', `/v1/admin/accounts/${accountId}`)[0]?.body).toBeDefined(),
  )
  await settle()
}

describe('W74 formlarıyla gerçek akış', () => {
  it('Kullanıcı oluştur → kişi seçilir → geçici parola adımı → parola hiçbir yerde kalmaz', async () => {
    server.use(
      ...baseHandlers(),
      usersHandler(),
      http.post(`${ORIGIN}/v1/admin/users`, () =>
        json({ account_id: 'u2', membership_id: 'm9', created: true }, 201),
      ),
      passwordHandler('u2'),
    )
    const { wrapper, router, queryClient } = await mountWith(UsersPage, {})

    await wrapper.get('[data-testid="users-create"]').trigger('click')
    await settle()
    type('[name="email"]', 'yeni@example.test')
    type('[name="fullName"]', 'Yeni Kişi')
    type('select[name="departmentId"]', 'd2', 'change')
    await settle()
    click('[form="of-create-user"]')
    await vi.waitFor(() => expect(sent('POST', '/v1/admin/users')[0]?.body).toBeDefined())
    await settle()

    const [create] = sent('POST', '/v1/admin/users')
    expect(create!.body).toMatchObject({
      email: 'yeni@example.test',
      program_id: 'p1',
      department_id: 'd2',
      full_name: 'Yeni Kişi',
    })
    expect(router.currentRoute.value.query.secili).toBe('u2')

    await setPassword('u2')
    const [patch] = sent('PATCH', '/v1/admin/accounts/u2')
    expect(patch!.body).toEqual({ password: SECRET, force_password_change: true })
    await vi.waitFor(() => expect($('[name="password"]')).toBeNull())
    await expectNoSecret(queryClient)
  })

  it('Panel → "Geçici parola belirle" → gerçek diyalog; parola hiçbir yerde kalmaz', async () => {
    server.use(...baseHandlers(), passwordHandler('u1'))
    const { wrapper, queryClient } = await mountWith(
      UserPanel,
      { accountId: 'u1' },
      { seed: seedUsers() },
    )
    await wrapper.get('[data-testid="account-password"]').trigger('click')
    await setPassword('u1')

    expect(sent('PATCH', '/v1/admin/accounts/u1')[0]!.body).toEqual({
      password: SECRET,
      force_password_change: true,
    })
    await vi.waitFor(() => expect($('[name="password"]')).toBeNull())
    await expectNoSecret(queryClient)
  })
})
