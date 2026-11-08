import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import {
  ADMIN_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import type { WorkTarget } from '../../model/types'
import { useAssigneeCandidates } from './use-assignee-candidates'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const member = (id: string, name: string, status = 'active') => ({
  account_id: id,
  full_name: name,
  membership_id: `m-${id}`,
  role: 'uye',
  status,
})

describe('useAssigneeCandidates (listMembers)', () => {
  it('seçilen departmanın ekibi: S2 program başlığı, silinmiş hesap yok, tr sıralı', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
        json({
          members: [member('a', 'Zeynep'), member('b', 'Çağla'), member('c', 'Ali', 'deleted')],
        }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const target = ref<WorkTarget | null>({ programId: 'p1', departmentId: 'd2' })
    const r = h.run(() => useAssigneeCandidates(target))
    expect(r.status.value).toBe('loading')
    await h.flush()

    expect(r.status.value).toBe('ready')
    expect(r.candidates.value.map((c) => c.fullName)).toEqual(['Çağla', 'Zeynep'])
    const [req] = sent('GET', '/v1/departments/d2/members')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
  })

  it('hedef yokken istek yok; hedef düşünce liste boşalır', async () => {
    server.use(http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members: null })))
    const h = harness(ADMIN_SCOPE)
    const target = ref<WorkTarget | null>(null)
    const r = h.run(() => useAssigneeCandidates(target))
    await h.flush()
    expect(r.status.value).toBe('idle')
    expect(sent('GET', '/v1/departments/d2/members')).toHaveLength(0)

    target.value = { programId: 'p1', departmentId: 'd2' }
    await nextTick()
    await h.flush()
    expect(r.status.value).toBe('ready')
    expect(r.candidates.value).toEqual([])
    target.value = null
    await nextTick()
    expect(r.status.value).toBe('idle')
  })

  it('hedef değişince geç gelen önceki yanıt yok sayılır', async () => {
    let releaseFirst: () => void = () => {}
    const first = new Promise<void>((resolve) => (releaseFirst = resolve))
    server.use(
      http.get(`${ORIGIN}/v1/departments/:id/members`, async ({ params }) => {
        if (params.id === 'd1') await first
        return json({ members: [member(String(params.id), `Kişi ${String(params.id)}`)] })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const target = ref<WorkTarget | null>({ programId: 'p1', departmentId: 'd1' })
    const r = h.run(() => useAssigneeCandidates(target))
    target.value = { programId: 'p1', departmentId: 'd2' }
    await nextTick()
    await h.flush()
    releaseFirst()
    await h.flush()
    expect(r.candidates.value.map((c) => c.accountId)).toEqual(['d2'])
  })

  it('okuma hatası → error durumu', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
        json(
          { code: 'organization.not_authorized', message: 'x', request_id: 'r', fields: [] },
          403,
        ),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useAssigneeCandidates({ programId: 'p1', departmentId: 'd2' }))
    await vi.waitFor(() => expect(r.status.value).toBe('error'))
    expect(r.candidates.value).toEqual([])
  })
})
