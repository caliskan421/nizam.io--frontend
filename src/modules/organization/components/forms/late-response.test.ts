// W82c (CX-F1-Ö-07): sökülmüş pencerenin geç sonucu bildirim üretmez. Her pencere: açık → istek
// gider → pencere sökülür → yanıt gelir → bildirim 0. Tek istisna: oluştur → bağla'nın KISMİ
// sonucu (katalog kaydı var, bağ yok) uygulama düzeyinde bir kez bildirilir (`pushAppNotice`).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { JsonBodyType } from 'msw'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  http,
  json,
  knownUser,
  ORIGIN,
  rosterMember,
  sent,
  server,
} from '../../__tests__/harness'
import UserAccountActions from '../users/UserAccountActions.vue'
import { click, formsHarness, pickPerson, resetForms, setValue, toasts } from './__tests__/harness'
import CoordinatorAssignDialog from './CoordinatorAssignDialog.vue'
import DepartmentForm from './DepartmentForm.vue'
import MemberAddDialog from './MemberAddDialog.vue'
import TemporaryPasswordDialog from './TemporaryPasswordDialog.vue'
import UserCreateDialog from './UserCreateDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

type Method = 'post' | 'patch'

/** Yanıtı elle salınan uç: `release(yanıt)` çağrılana dek bekler. */
function held(method: Method, path: string) {
  let release!: (response: () => Response) => void
  const reply = new Promise<() => Response>((resolve) => (release = resolve))
  server.use(http[method](`${ORIGIN}${path}`, async () => (await reply)()))
  return release
}

const ok =
  (body: JsonBodyType, status = 200) =>
  () =>
    json(body, status)

function people() {
  server.use(
    http.get(`${ORIGIN}/v1/admin/users`, () =>
      json({ users: [knownUser('u1', 'Ayşe Yılmaz')], next_cursor: '' }),
    ),
    http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
      json({ members: [rosterMember('u9', 'Başka', 'uye')] }),
    ),
    http.get(`${ORIGIN}/v1/departments/:id/assignable`, () =>
      json({ accounts: [{ account_id: 'u1', full_name: 'Ayşe Yılmaz', roles: [] }] }),
    ),
  )
}

/** Gönderim sunucuya ulaşana dek bekler, bileşeni söker, yanıtı salar, yerleşmeyi bekler. */
async function lateAfterUnmount(
  h: ReturnType<typeof formsHarness>,
  wrapper: { unmount: () => void },
  method: string,
  path: string,
  release: () => void,
) {
  await vi.waitFor(() => expect(sent(method, path)).toHaveLength(1))
  wrapper.unmount()
  release()
  await h.flush()
  await vi.waitFor(() => expect(h.queryClient.isMutating()).toBe(0))
  await h.flush()
}

describe('W82c geç yanıt: sökülmüş pencere bildirim üretmez', () => {
  it('MemberAddDialog', async () => {
    people()
    const release = held('post', '/v1/departments/d1/memberships')
    const h = formsHarness(ADMIN_SCOPE)
    const w = h.mount(MemberAddDialog, { open: true, departmentId: 'd1' })
    await h.flush()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await lateAfterUnmount(h, w, 'POST', '/v1/departments/d1/memberships', () =>
      release(ok({ membership_id: 'm', account_id: 'u1', department_id: 'd1', role: 'uye' }, 201)),
    )
    expect(toasts()).toEqual([])
  })

  it('CoordinatorAssignDialog', async () => {
    people()
    const release = held('post', '/v1/departments/d1/coordinator')
    const h = formsHarness(ADMIN_SCOPE)
    const w = h.mount(CoordinatorAssignDialog, { open: true, departmentId: 'd1' })
    await h.flush()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await lateAfterUnmount(h, w, 'POST', '/v1/departments/d1/coordinator', () =>
      release(
        ok({
          account_id: 'u1',
          department_id: 'd1',
          membership_id: 'm',
          role: 'koordinator',
          changed: true,
        }),
      ),
    )
    expect(toasts()).toEqual([])
  })

  it('UserCreateDialog', async () => {
    const release = held('post', '/v1/admin/users')
    const h = formsHarness(ADMIN_SCOPE)
    h.departments([{ id: 'd1', name: 'Mekanik' }])
    const w = h.mount(UserCreateDialog, { open: true, departmentId: null })
    await h.flush()
    setValue('[name="email"]', 'yeni@ornek.test')
    setValue('select[name="departmentId"]', 'd1')
    await h.flush()
    click('[data-testid="of-submit"]')
    await lateAfterUnmount(h, w, 'POST', '/v1/admin/users', () =>
      release(ok({ account_id: 'u5', membership_id: 'm5', created: true }, 201)),
    )
    expect(w.emitted('created')).toBeUndefined()
    expect(toasts()).toEqual([])
  })

  it('TemporaryPasswordDialog', async () => {
    const release = held('patch', '/v1/admin/accounts/u1')
    const h = formsHarness(ADMIN_SCOPE)
    const w = h.mount(TemporaryPasswordDialog, { open: true, accountId: 'u1' })
    await h.flush()
    setValue('[name="password"]', 'Gecici-Parola-9')
    await h.flush()
    click('[data-testid="of-submit"]')
    await lateAfterUnmount(h, w, 'PATCH', '/v1/admin/accounts/u1', () =>
      release(ok({ account_id: 'u1', revoked_sessions: 2 })),
    )
    expect(toasts()).toEqual([])
  })

  it('UserAccountActions (kilit aç; 409 account_not_locked)', async () => {
    const release = held('post', '/v1/admin/accounts/u1/unlock')
    const h = formsHarness(ADMIN_SCOPE)
    const w = h.mount(UserAccountActions, { accountId: 'u1', name: 'Ayşe' })
    await h.flush()
    click('[data-testid="account-unlock"]')
    await lateAfterUnmount(h, w, 'POST', '/v1/admin/accounts/u1/unlock', () =>
      release(() => errorEnvelope('identity.account_not_locked', 409)),
    )
    expect(toasts()).toEqual([])
  })
})

describe('W82c DepartmentForm geç yanıt', () => {
  const DEPARTMENT = { department_id: 'nd', name: 'Yeni', kind: 'koordinatorluk', code: 'YN' }
  const LINK = {
    department_id: 'nd',
    display_name: 'Yeni',
    program_id: 'p1',
    copied_member_count: 0,
  }

  async function create(h: ReturnType<typeof formsHarness>) {
    const w = h.mount(DepartmentForm, { open: true })
    await h.flush()
    setValue('[name="name"]', 'Yeni')
    setValue('[name="code"]', 'yn')
    await h.flush()
    click('[data-testid="of-submit"]')
    return w
  }

  it('oluştur → bağla tam başarı, pencere söküldü → bildirim 0', async () => {
    server.use(http.post(`${ORIGIN}/v1/departments`, () => json(DEPARTMENT, 201)))
    const release = held('post', '/v1/program/departments')
    const h = formsHarness(ADMIN_SCOPE)
    const w = await create(h)
    await lateAfterUnmount(h, w, 'POST', '/v1/program/departments', () => release(ok(LINK, 201)))
    expect(toasts()).toEqual([])
  })

  it('kısmi sonuç (bağ kurulamadı), pencere söküldü → uygulama düzeyi bildirim 1', async () => {
    server.use(http.post(`${ORIGIN}/v1/departments`, () => json(DEPARTMENT, 201)))
    const release = held('post', '/v1/program/departments')
    const h = formsHarness(ADMIN_SCOPE)
    const w = await create(h)
    await lateAfterUnmount(h, w, 'POST', '/v1/program/departments', () =>
      release(() => errorEnvelope('program.department_link_name_exists', 409)),
    )
    expect(toasts()).toEqual([
      'Departman kataloğa eklendi ancak programa bağlanamadı. Programa eklemeyi yeniden deneyin.',
    ])
  })

  it('düzenleme (programdaki ad), pencere söküldü → bildirim 0', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/departments`, () => json({ departments: [DEPARTMENT] })),
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        json({ departments: [{ department_id: 'nd', display_name: 'Yeni', code: 'YN' }] }),
      ),
    )
    const release = held('patch', '/v1/program/departments/nd')
    const h = formsHarness(ADMIN_SCOPE)
    const w = h.mount(DepartmentForm, { open: true, departmentId: 'nd' })
    await vi.waitFor(() =>
      expect((document.querySelector('[name="displayName"]') as HTMLInputElement).value).toBe(
        'Yeni',
      ),
    )
    setValue('[name="displayName"]', 'Yeni ad')
    await h.flush()
    click('[data-testid="of-submit"]')
    await lateAfterUnmount(h, w, 'PATCH', '/v1/program/departments/nd', () =>
      release(ok({ ...LINK, display_name: 'Yeni ad' })),
    )
    expect(toasts()).toEqual([])
  })
})
