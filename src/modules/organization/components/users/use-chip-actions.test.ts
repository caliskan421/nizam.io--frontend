import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { markDetached } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'

import {
  ADMIN_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../__tests__/harness'
import { reportOutcome, useChipActions } from './use-chip-actions'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  useToast().clear()
})
afterAll(() => server.close())

const MEMBERSHIP = {
  membership_id: 'm',
  account_id: 'u1',
  department_id: 'd3',
  program_id: 'p1',
  role: 'uye',
}

describe('useChipActions', () => {
  it('işlem sürerken ikinci işlem gönderilmez (anahtarsız uçta çift gönderim yok)', async () => {
    server.use(http.post(`${ORIGIN}/v1/departments/d3/memberships`, () => json(MEMBERSHIP, 201)))
    const h = harness(ADMIN_SCOPE)
    const actions = h.run(() => useChipActions(() => 'u1'))
    const first = actions.add('d3', 'member')
    const second = await actions.add('d3', 'member')
    expect(second).toBe(false)
    expect(await first).toBe(true)
    expect(sent('POST', '/v1/departments/d3/memberships')).toHaveLength(1)
    expect(actions.pending.value).toBeNull()
  })

  it('program yoksa istek yok', async () => {
    const h = harness({ programId: null, lens: 'admin', departmentId: null })
    const actions = h.run(() => useChipActions(() => 'u1'))
    expect(await actions.add('d3', 'member')).toBe(false)
    expect(sent('POST', '/v1/departments/d3/memberships')).toHaveLength(0)
  })

  it('reportOutcome: vazgeç, owner_disposed ve sökülmüş sahibin geç sonucu sessiz; başarı bildirimi', () => {
    type Outcome = Parameters<typeof reportOutcome>[1] & object
    const toast = useToast()
    expect(reportOutcome(toast, null, 'users.panel.chips.added')).toBe(false)
    expect(
      reportOutcome(toast, { kind: 'owner_disposed' } as Outcome, 'users.panel.chips.added'),
    ).toBe(false)
    const late = markDetached({ kind: 'success', data: {} } as Outcome)
    expect(reportOutcome(toast, late, 'users.panel.chips.added')).toBe(false)
    expect(useToast().queue.value).toHaveLength(0)
    expect(
      reportOutcome(toast, { kind: 'success', data: {} } as Outcome, 'users.panel.chips.added'),
    ).toBe(true)
    expect(useToast().queue.value.map((t) => t.message)).toEqual(['Koordinatörlüğe eklendi.'])
  })

  it('W82c geç yanıt: istek gider → panel (sahip) sökülür → yanıt gelir → bildirim 0', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/departments/d3/memberships`, async () => {
        await gate
        return json(MEMBERSHIP, 201)
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const { result: actions, app } = h.mount(() => useChipActions(() => 'u1'))
    const pending = actions.add('d3', 'member')
    await vi.waitFor(() => expect(sent('POST', '/v1/departments/d3/memberships')).toHaveLength(1))
    app.unmount()
    release()
    expect(await pending).toBe(false)
    await h.flush()
    expect(useToast().queue.value).toHaveLength(0)
  })
})
