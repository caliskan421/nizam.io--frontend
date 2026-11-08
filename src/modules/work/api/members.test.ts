import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { useDepartmentMembers } from './members'

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

describe('useDepartmentMembers (listMembers)', () => {
  it('S2 program başlığı; canlı hesaplar tr sıralı; anahtar departments.members', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
        json({
          members: [member('a', 'Zeynep'), member('b', 'Çağla'), member('c', 'Ali', 'deleted')],
        }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useDepartmentMembers('d2'))
    await vi.waitFor(() => expect(r.status.value).toBe('ready'))

    expect(r.members.value).toEqual([
      { accountId: 'b', fullName: 'Çağla' },
      { accountId: 'a', fullName: 'Zeynep' },
    ])
    const [req] = sent('GET', '/v1/departments/d2/members')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    const key = queryKeys.departments.members(h.store.snapshot, 'd2')
    expect(h.queryClient.getQueryData(key)).toBeDefined()
  })

  it('departman yokken istek yok (idle); seçilince okunur', async () => {
    server.use(http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members: null })))
    const h = harness(ADMIN_SCOPE)
    const id = ref<string | null>(null)
    const r = h.run(() => useDepartmentMembers(id))
    await h.flush()
    expect(r.status.value).toBe('idle')
    expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(0)

    id.value = 'd1'
    await nextTick()
    await vi.waitFor(() => expect(r.status.value).toBe('ready'))
    expect(r.members.value).toEqual([])
  })

  it('403 (koordinatör/yönetici dışı) → boş liste, error; tekrar yok', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/departments/:id/members`, () =>
        errorEnvelope('organization.not_authorized', 403),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useDepartmentMembers('d2'))
    await vi.waitFor(() => expect(r.status.value).toBe('error'))
    expect(r.members.value).toEqual([])
    expect(sent('GET', '/v1/departments/d2/members')).toHaveLength(1)
  })
})
