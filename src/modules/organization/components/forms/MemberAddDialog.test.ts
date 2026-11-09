import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_LENS_SCOPE,
  errorEnvelope,
  http,
  json,
  knownUser,
  ORIGIN,
  rosterMember,
  sent,
  server,
} from '../../__tests__/harness'
import {
  $,
  click,
  formsHarness,
  pickPerson,
  resetForms,
  setValue,
  toasts,
  type WhoSeed,
} from './__tests__/harness'
import MemberAddDialog from './MemberAddDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const MEMBERSHIPS = `${ORIGIN}/v1/departments/:id/memberships`
const PATH = '/v1/departments/d1/memberships'
const MEMBERSHIP = { membership_id: 'm9', account_id: 'u1', department_id: 'd1', role: 'uye' }

async function openDialog(scope = ADMIN_SCOPE, who: WhoSeed = { companyAdmin: true }) {
  server.use(
    http.get(`${ORIGIN}/v1/admin/users`, () =>
      json({
        users: [knownUser('u1', 'Ayşe Yılmaz'), knownUser('u2', 'Bora Kaya')],
        next_cursor: '',
      }),
    ),
    http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
      json({ members: [rosterMember('u2', 'Bora Kaya', 'uye')] }),
    ),
  )
  const h = formsHarness(scope, who)
  const wrapper = h.mount(MemberAddDialog, { open: true, departmentId: 'd1' })
  await h.flush()
  return { h, wrapper }
}

describe('MemberAddDialog (E-08-79, E-05-33)', () => {
  it('ŞY: rol seçici; ekipteki kişi seçenekte yok; seç → assignMembership {account_id, role}', async () => {
    server.use(http.post(MEMBERSHIPS, () => json(MEMBERSHIP, 201)))
    const { wrapper } = await openDialog()
    expect($('[name="role"]')).not.toBeNull()
    ;($('[name="person-search"]') as HTMLInputElement).dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect($('[data-account="u1"]')).not.toBeNull())
    expect($('[data-account="u2"]')).toBeNull()
    await pickPerson('u1')
    setValue('[name="role"]', 'coordinator')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('added')).toEqual([['u1']]))
    const [req] = sent('POST', PATH)
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ account_id: 'u1', role: 'koordinator' })
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(toasts()).toContain('Üye eklendi.')
  })

  it('bu birimin koordinatörü: rol seçici yok, rol uye gönderilir', async () => {
    server.use(http.post(MEMBERSHIPS, () => json(MEMBERSHIP, 201)))
    const { wrapper } = await openDialog(COORD_LENS_SCOPE, {
      rows: [{ departmentId: 'd1', role: 'koordinator' }],
    })
    expect($('[name="role"]')).toBeNull()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('added')).toBeTruthy())
    const [req] = sent('POST', PATH)
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ account_id: 'u1', role: 'uye' })
  })

  it('409 membership_exists → "zaten ekipte" alanda; ekip listesi yeniden okunur', async () => {
    server.use(http.post(MEMBERSHIPS, () => errorEnvelope('organization.membership_exists', 409)))
    const { wrapper } = await openDialog()
    await vi.waitFor(() => expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(1))
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Kullanıcı bu departmanda zaten üye.'),
    )
    await vi.waitFor(() => expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(2))
    expect(sent('POST', PATH)).toHaveLength(1)
    expect(wrapper.emitted('added')).toBeUndefined()
  })

  it('422 department_not_linked → K7 metni', async () => {
    server.use(
      http.post(MEMBERSHIPS, () => errorEnvelope('organization.department_not_linked', 422)),
    )
    await openDialog()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(toasts()).toContain('Departman bu programa bağlı değil.'))
  })
})
