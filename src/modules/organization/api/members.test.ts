import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import type { ConfirmOptions } from '@/shared/ui/confirm'

import {
  ADMIN_SCOPE,
  bodyHas,
  confirmationRequired,
  COORD_LENS_SCOPE,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  MEMBERSHIP_CHANGE,
  ORIGIN,
  type Recorded,
  resetHarness,
  rosterMember,
  sent,
  server,
} from '../__tests__/harness'
import {
  useAssignableAccounts,
  useAssignCoordinator,
  useAssignMembership,
  useDepartmentRoster,
  useRemoveCoordinator,
  useRemoveMember,
  useUpdateMembershipRole,
} from './members'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const DEPT = `${ORIGIN}/v1/departments/:id`
const ASK: ConfirmOptions = { title: 'Emin misiniz?', confirmLabel: 'Onayla' }

function s2Only(req: Recorded, programId = 'p1') {
  expect(req.headers.get('X-Nizamio-Program')).toBe(programId)
  expect(req.headers.get('X-Nizamio-Department')).toBeNull()
}

describe('ekip okumaları (S2; departman yol parametresi)', () => {
  it('listMembers: program başlığı, departman başlığı YOK; ad sırası; active süzmesi; anahtar', async () => {
    server.use(
      http.get(`${DEPT}/members`, () =>
        json({
          members: [
            rosterMember('a', 'Zeynep', 'uye'),
            rosterMember('b', 'Çağla', 'koordinator'),
            rosterMember('c', 'Ali', 'uye', 'deleted'),
          ],
        }),
      ),
    )
    // Koordinatör merceğinde de (depoda departman seçili) başlık yalnız program.
    const h = harness(COORD_LENS_SCOPE)
    const r = h.run(() => useDepartmentRoster('d2'))
    await vi.waitFor(() => expect(r.members.value).toHaveLength(3))

    expect(r.members.value.map((m) => m.full_name)).toEqual(['Ali', 'Çağla', 'Zeynep'])
    expect(r.active.value.map((m) => m.account_id)).toEqual(['b', 'a'])
    expect(r.truncated.value).toBe(false)
    s2Only(sent('GET', '/v1/departments/d2/members')[0]!)
    expect(
      h.queryClient.getQueryData(queryKeys.departments.members(h.store.snapshot, 'd2')),
    ).toBeTruthy()
  })

  it('X-Result-Truncated → "liste eksik olabilir"; departman yokken istek yok', async () => {
    server.use(
      http.get(`${DEPT}/members`, () =>
        json({ members: [] }, 200, { 'X-Result-Truncated': 'true' }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const id = ref<string | null>(null)
    const r = h.run(() => useDepartmentRoster(id))
    await h.flush()
    expect(requestsTo('/members')).toBe(0)
    id.value = 'd3'
    await vi.waitFor(() => expect(r.query.isSuccess.value).toBe(true))
    expect(r.truncated.value).toBe(true)
  })

  it('listAssignable: S2, anahtar departments.assignable', async () => {
    server.use(
      http.get(`${DEPT}/assignable`, () =>
        json({ accounts: [{ account_id: 'x', full_name: 'Xa', roles: ['uye'] }] }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useAssignableAccounts('d2'))
    await vi.waitFor(() => expect(r.accounts.value).toHaveLength(1))
    s2Only(sent('GET', '/v1/departments/d2/assignable')[0]!)
  })
})

function requestsTo(suffix: string): number {
  return sent('GET', `/v1/departments/d3${suffix}`).length
}

describe('üyelik yazmaları (anahtarsız, S2)', () => {
  it('assignMembership: gövde rol eşlemesi, eylemin program başlığı, IK yok', async () => {
    server.use(
      http.post(`${DEPT}/memberships`, () =>
        json(
          {
            account_id: 'u1',
            department_id: 'd2',
            membership_id: 'm',
            program_id: 'p1',
            role: 'uye',
          },
          201,
        ),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h
      .run(() => useAssignMembership())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1', role: 'member' })
    expect(out.kind).toBe('success')
    const [req] = sent('POST', '/v1/departments/d2/memberships')
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ account_id: 'u1', role: 'uye' })
    s2Only(req!)
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
  })

  it('assignCoordinator: gövde account_id; 409 membership_exists → ekip yeniden okunur', async () => {
    let rosters = 0
    server.use(
      http.get(`${DEPT}/members`, () => {
        rosters += 1
        return json({ members: [] })
      }),
      http.post(`${DEPT}/coordinator`, () => errorEnvelope('organization.membership_exists', 409)),
    )
    const h = harness(ADMIN_SCOPE)
    const roster = h.run(() => useDepartmentRoster('d2'))
    await vi.waitFor(() => expect(roster.query.isSuccess.value).toBe(true))
    const out = await h
      .run(() => useAssignCoordinator())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' })
    expect(out.kind).toBe('failed')
    await vi.waitFor(() => expect(rosters).toBe(2))
    expect(sent('POST', '/v1/departments/d2/coordinator')).toHaveLength(1)
  })
})

describe('confirmation_required — iki biçim (sorgu / gövde), ortak onay', () => {
  it('removeMember: 409 → onay (görev başlıkları) → kabul → aynı istek ?confirm=true', async () => {
    server.use(
      http.delete(`${DEPT}/memberships/:accountId`, ({ request }) =>
        new URL(request.url).searchParams.get('confirm') === 'true'
          ? json({ ...MEMBERSHIP_CHANGE, unassigned_tasks: 2 })
          : confirmationRequired(['Rapor', 'Sunum']),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const m = h.run(() => useRemoveMember())
    const pending = m.submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' }, ASK)

    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    expect(h.confirmQueue.current.value!.items).toEqual(['Rapor', 'Sunum'])
    expect(h.confirmQueue.current.value!.options.title).toBe('Emin misiniz?')
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)

    const out = await pending
    expect(out?.kind).toBe('success')
    const reqs = sent('DELETE', '/v1/departments/d2/memberships/u1')
    expect(reqs.map((r) => r.query.get('confirm'))).toEqual([null, 'true'])
    for (const req of reqs) s2Only(req)
  })

  it('removeCoordinator: aynı sorgu biçimi', async () => {
    server.use(
      http.delete(`${DEPT}/coordinator/:accountId`, ({ request }) =>
        new URL(request.url).searchParams.get('confirm') === 'true'
          ? json(MEMBERSHIP_CHANGE)
          : confirmationRequired(['Rapor']),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const pending = h
      .run(() => useRemoveCoordinator())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' }, ASK)
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    expect((await pending)?.kind).toBe('success')
    const reqs = sent('DELETE', '/v1/departments/d2/coordinator/u1')
    expect(reqs.map((r) => r.query.get('confirm'))).toEqual([null, 'true'])
  })

  it('updateMembershipRole: onay GÖVDEDE (confirm: true), sorguda değil', async () => {
    server.use(
      http.patch(`${DEPT}/memberships/:accountId`, async ({ request }) => {
        return bodyHas(await request.json(), 'confirm')
          ? json(MEMBERSHIP_CHANGE)
          : confirmationRequired(['Rapor'])
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const pending = h
      .run(() => useUpdateMembershipRole())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1', role: 'member' }, ASK)
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    expect((await pending)?.kind).toBe('success')

    const reqs = sent('PATCH', '/v1/departments/d2/memberships/u1')
    await vi.waitFor(() => expect(reqs[1]?.body).toBeDefined())
    expect(reqs.map((r) => r.body)).toEqual([{ role: 'uye' }, { role: 'uye', confirm: true }])
    expect(reqs.every((r) => !r.query.has('confirm'))).toBe(true)
  })

  it('vazgeç → null, ikinci istek yok', async () => {
    server.use(http.delete(`${DEPT}/memberships/:accountId`, () => confirmationRequired(['Rapor'])))
    const h = harness(ADMIN_SCOPE)
    const pending = h
      .run(() => useRemoveMember())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' }, ASK)
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    h.confirmQueue.cancel(h.confirmQueue.current.value!.id)
    expect(await pending).toBeNull()
    expect(sent('DELETE', '/v1/departments/d2/memberships/u1')).toHaveLength(1)
  })

  it('sahip (bileşen) sökülünce açık onay vazgeçle kapanır; istek yok', async () => {
    server.use(http.delete(`${DEPT}/memberships/:accountId`, () => confirmationRequired(['Rapor'])))
    const h = harness(ADMIN_SCOPE)
    const { result: m, app } = h.mount(() => useRemoveMember())
    const pending = m.submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' }, ASK)
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    app.unmount()
    expect(await pending).toBeNull()
    expect(h.confirmQueue.current.value).toBeNull()
    expect(sent('DELETE', '/v1/departments/d2/memberships/u1')).toHaveLength(1)
  })

  it('onaylı devamda sonuç bilinmiyor → kör tekrar yok, ekip yeniden okunur', async () => {
    let rosters = 0
    server.use(
      http.get(`${DEPT}/members`, () => {
        rosters += 1
        return json({ members: [] })
      }),
      http.delete(`${DEPT}/memberships/:accountId`, ({ request }) =>
        new URL(request.url).searchParams.get('confirm') === 'true'
          ? HttpResponse.error()
          : confirmationRequired(['Rapor']),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const roster = h.run(() => useDepartmentRoster('d2'))
    await vi.waitFor(() => expect(roster.query.isSuccess.value).toBe(true))
    const pending = h
      .run(() => useRemoveMember())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' }, ASK)
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    const out = await pending
    expect(out?.kind).toBe('unknown_outcome')
    expect(out?.kind === 'unknown_outcome' && out.retry).toBeNull()
    expect(sent('DELETE', '/v1/departments/d2/memberships/u1')).toHaveLength(2)
    await vi.waitFor(() => expect(rosters).toBe(2))
  })

  it('onay yokken (başarı) diyalog açılmaz', async () => {
    server.use(http.delete(`${DEPT}/memberships/:accountId`, () => json(MEMBERSHIP_CHANGE)))
    const h = harness(ADMIN_SCOPE)
    const out = await h
      .run(() => useRemoveMember())
      .submit({ programId: 'p1', departmentId: 'd2', accountId: 'u1' }, ASK)
    expect(out?.kind).toBe('success')
    expect(h.confirmQueue.current.value).toBeNull()
  })
})
