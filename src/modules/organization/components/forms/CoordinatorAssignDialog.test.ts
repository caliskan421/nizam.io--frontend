import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  http,
  HttpResponse,
  json,
  knownUser,
  ORIGIN,
  sent,
  server,
} from '../../__tests__/harness'
import { $, click, formsHarness, pickPerson, resetForms, toasts } from './__tests__/harness'
import CoordinatorAssignDialog from './CoordinatorAssignDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const COORDINATOR = `${ORIGIN}/v1/departments/:id/coordinator`
const PATH = '/v1/departments/d1/coordinator'

async function openDialog() {
  server.use(
    http.get(`${ORIGIN}/v1/admin/users`, () =>
      json({ users: [knownUser('u1', 'Ayşe Yılmaz')], next_cursor: '' }),
    ),
  )
  const h = formsHarness(ADMIN_SCOPE)
  const wrapper = h.mount(CoordinatorAssignDialog, { open: true, departmentId: 'd1' })
  await h.flush()
  return { h, wrapper }
}

const RESULT = {
  account_id: 'u1',
  changed: true,
  department_id: 'd1',
  membership_id: 'm1',
  role: 'koordinator',
}

describe('CoordinatorAssignDialog (E-08-33)', () => {
  it('kişi seçilmeden gönder → alan hatası, istek yok', async () => {
    await openDialog()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Bir kişi seçin.'))
    expect(sent('POST', PATH)).toHaveLength(0)
  })

  it('seç → assignCoordinator (S2: yalnız program başlığı, departman yolda, anahtarsız) → assigned', async () => {
    server.use(http.post(COORDINATOR, () => json(RESULT)))
    const { wrapper } = await openDialog()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('assigned')).toEqual([['u1']]))
    const [req] = sent('POST', PATH)
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ account_id: 'u1' })
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(toasts()).toContain('Koordinatör atandı.')
  })

  it('409 membership_exists → "zaten ekipte" kişi alanında; pencere açık', async () => {
    server.use(http.post(COORDINATOR, () => errorEnvelope('organization.membership_exists', 409)))
    const { wrapper } = await openDialog()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Kullanıcı bu departmanda zaten üye.'),
    )
    expect(wrapper.emitted('assigned')).toBeUndefined()
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('422 department_not_linked → K7 metni bildirimde', async () => {
    server.use(
      http.post(COORDINATOR, () => errorEnvelope('organization.department_not_linked', 422)),
    )
    await openDialog()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(toasts()).toContain('Departman bu programa bağlı değil.'))
  })

  it('sonuç bilinmiyor → kör tekrar yok (tek istek, "Yeniden gönder" yok)', async () => {
    server.use(http.post(COORDINATOR, () => HttpResponse.error()))
    await openDialog()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    expect($('[data-testid="outcome-retry"]')).toBeNull()
    expect(sent('POST', PATH)).toHaveLength(1)
  })

  it('çift tık tek istek (anahtarsız uç)', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(COORDINATOR, async () => {
        await gate
        return json(RESULT)
      }),
    )
    const { wrapper } = await openDialog()
    await pickPerson('u1')
    click('[data-testid="of-submit"]')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(($('[data-testid="of-submit"]') as HTMLButtonElement).disabled).toBe(true),
    )
    release()
    await vi.waitFor(() => expect(wrapper.emitted('assigned')).toBeTruthy())
    expect(sent('POST', PATH)).toHaveLength(1)
  })
})
