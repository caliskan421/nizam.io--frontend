import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  confirmationRequired,
  http,
  json,
  MEMBERSHIP_CHANGE,
  ORIGIN,
  resetHarness,
  rosterMember,
  sent,
  server,
} from '../../__tests__/harness'
import {
  ACCOUNT,
  mountWith,
  ROSTER,
  serverHandlers,
  settle,
  unmountAll,
} from './__tests__/detail-harness'
import CoordinatorshipDetail from './CoordinatorshipDetail.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const PATCH = '/v1/departments/d1/memberships/a1'
const DELETE = '/v1/departments/d1/memberships/a1'

async function mountMembers(roster: unknown[] = ROSTER) {
  server.use(...serverHandlers({ roster }))
  return mountWith(CoordinatorshipDetail, { departmentId: 'd1', tab: 'uyeler' })
}

async function openMenu(wrapper: Awaited<ReturnType<typeof mountMembers>>['wrapper'], id: string) {
  await wrapper.get(`[data-member="${id}"] [data-action="row-menu"]`).trigger('click')
}

describe('E-08-59 Üyeler sekmesi (P3 minimum)', () => {
  it('bütün satırlar: koordinatör önce, ad sırası; rol rozeti; silinmiş soluk + etiket', async () => {
    const { wrapper } = await mountMembers()
    const rows = wrapper.findAll('[data-member]')
    expect(rows.map((r) => r.attributes('data-member'))).toEqual(['a2', 'a3', 'a4', 'a1'])
    expect(rows[0]!.get('[data-role]').text()).toBe('Koordinatör')
    expect(rows[1]!.get('[data-role]').text()).toBe('Üye')
    const deleted = wrapper.get('[data-member="a4"]')
    expect(deleted.classes()).toContain('cd-member--deleted')
    expect(deleted.get('[data-deleted]').text()).toBe('silinmiş')
    expect(deleted.find('[data-action="row-menu"]').exists()).toBe(false)
    expect(wrapper.get('[data-member="a1"] a').attributes('href')).toBe('/kullanicilar/a1')
  })

  it('kendi satırında işlem menüsü yok (K20)', async () => {
    const { wrapper } = await mountMembers([...ROSTER, rosterMember(ACCOUNT, 'Deneme Kişi', 'uye')])
    expect(
      wrapper.get(`[data-member="${ACCOUNT}"]`).find('[data-action="row-menu"]').exists(),
    ).toBe(false)
    expect(wrapper.get('[data-member="a1"]').find('[data-action="row-menu"]').exists()).toBe(true)
  })

  it('"Üye ekle" W74 formunu açar', async () => {
    const { wrapper } = await mountMembers()
    await wrapper.get('[data-action="members-add"]').trigger('click')
    expect(wrapper.get('[data-form="member"]').attributes('data-open')).toBe('true')
  })
})

describe('rol değiştir — updateMembershipRole (onay GÖVDEDE)', () => {
  it('confirmation_required → görev başlıklı onay → kabulde gövdede confirm: true', async () => {
    let calls = 0
    const { wrapper, h } = await mountMembers()
    server.use(
      http.patch(`${ORIGIN}${PATCH}`, () => {
        calls += 1
        return calls === 1 ? confirmationRequired(['Rapor', 'Sunum']) : json(MEMBERSHIP_CHANGE)
      }),
    )
    await openMenu(wrapper, 'a1')
    expect(wrapper.get('[data-action="role"]').text()).toBe('Koordinatör yap')
    await wrapper.get('[data-action="role"]').trigger('click')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    expect(h.confirmQueue.current.value!.items).toEqual(['Rapor', 'Sunum'])
    expect(h.confirmQueue.current.value!.options.title).toBe('Rolü değiştir')
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await settle()
    const patches = sent('PATCH', PATCH)
    expect(patches).toHaveLength(2)
    expect(patches[0]!.body).toEqual({ role: 'koordinator' })
    expect(patches[1]!.body).toEqual({ role: 'koordinator', confirm: true })
    expect(patches[1]!.query.get('confirm')).toBeNull()
    expect(patches[1]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(patches[1]!.headers.get('Idempotency-Key')).toBeNull()
  })

  it('vazgeç → ikinci istek yok', async () => {
    const { wrapper, h } = await mountMembers()
    server.use(http.patch(`${ORIGIN}${PATCH}`, () => confirmationRequired(['Rapor'])))
    await openMenu(wrapper, 'a1')
    await wrapper.get('[data-action="role"]').trigger('click')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    h.confirmQueue.cancel(h.confirmQueue.current.value!.id)
    await settle()
    expect(sent('PATCH', PATCH)).toHaveLength(1)
  })
})

describe('K-6 (F2 görsel doğrulaması): X-Result-Truncated → "liste eksik olabilir"', () => {
  it('listMembers kesildi → Üyeler sekmesinde uyarı DOM’da; kesilmediyse yok', async () => {
    const plain = await mountMembers()
    expect(plain.wrapper.find('[data-members-truncated]').exists()).toBe(false)
    unmountAll()
    resetHarness()

    // İlk eşleşen işleyici yanıtlar: kesik `listMembers` önce.
    server.use(
      http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
        json({ members: ROSTER }, 200, { 'X-Result-Truncated': 'true' }),
      ),
      ...serverHandlers({ roster: ROSTER }),
    )
    const { wrapper } = await mountWith(CoordinatorshipDetail, {
      departmentId: 'd1',
      tab: 'uyeler',
    })
    await settle()
    const notice = wrapper.get('[data-members-truncated]')
    expect(notice.text()).toBe('Üye listesi eksik olabilir')
    expect(wrapper.findAll('[data-member]')).toHaveLength(ROSTER.length)
  })
})

describe('ekipten çıkar — removeMember (onay SORGUDA)', () => {
  it('confirmation_required → kabulde ?confirm=true; başarıda ekip yeniden okunur', async () => {
    let calls = 0
    const { wrapper, h } = await mountMembers()
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () => {
        calls += 1
        return calls === 1 ? confirmationRequired(['Rapor']) : json(MEMBERSHIP_CHANGE)
      }),
    )
    const before = sent('GET', '/v1/departments/d1/members').length
    await openMenu(wrapper, 'a1')
    await wrapper.get('[data-action="remove"]').trigger('click')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    expect(h.confirmQueue.current.value!.options.tone).toBe('danger')
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await settle()
    const deletes = sent('DELETE', DELETE)
    expect(deletes.map((r) => r.query.get('confirm'))).toEqual([null, 'true'])
    expect(sent('GET', '/v1/departments/d1/members').length).toBeGreaterThan(before)
  })

  it('sonuç bilinmiyor (5xx) → kör tekrar yok, liste yeniden okunur', async () => {
    const { wrapper } = await mountMembers()
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () =>
        json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 503),
      ),
    )
    const before = sent('GET', '/v1/departments/d1/members').length
    await openMenu(wrapper, 'a1')
    await wrapper.get('[data-action="remove"]').trigger('click')
    await settle()
    expect(sent('DELETE', DELETE)).toHaveLength(1)
    expect(sent('GET', '/v1/departments/d1/members').length).toBeGreaterThan(before)
  })
})

describe('yaşam döngüsü (KESİN 20)', () => {
  it('istek sürerken sayfa söküldü → geç 409 onay açmaz, ikinci istek ve bildirim yok', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    const { wrapper, h } = await mountMembers()
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, async () => {
        await gate
        return confirmationRequired(['Rapor'])
      }),
    )
    await openMenu(wrapper, 'a1')
    await wrapper.get('[data-action="remove"]').trigger('click')
    await settle()
    wrapper.unmount()
    release()
    await settle()
    expect(h.confirmQueue.current.value).toBeNull()
    expect(sent('DELETE', DELETE)).toHaveLength(1)
    expect(document.querySelector('.rp-toast')).toBeNull()
  })
})
