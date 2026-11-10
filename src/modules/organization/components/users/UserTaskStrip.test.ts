import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  byAssigneeQuery,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../__tests__/harness'
import { baseHandlers, mountWith, task, unmountAll } from './__tests__/users-harness'
import UserTaskStrip from './UserTaskStrip.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

describe('UserTaskStrip (E-05-29)', () => {
  it('tek uç sonuna dek sayfalanır (aynı uç, imleçle); kişiye sunucuda süzülür (assignee_account_id)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program/work-items`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ items: byAssigneeQuery([task('w2', 'u1', 'onaya_sunuldu')], request) })
          : json({
              items: byAssigneeQuery(
                [task('w1', 'u1', 'baslanmadi', true), task('w3', 'u2', 'baslanmadi')],
                request,
              ),
              next_cursor: 'c1',
            }),
      ),
      ...baseHandlers(),
    )
    const { wrapper } = await mountWith(UserTaskStrip, { accountId: 'u1' })
    await vi.waitFor(() => expect(wrapper.get('[data-testid="strip-open"]').text()).toBe('2'))
    expect(wrapper.get('[data-testid="strip-overdue"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="strip-approval"]').text()).toBe('1')
    expect(wrapper.find('[data-testid="strip-partial"]').exists()).toBe(false)
    const reqs = sent('GET', '/v1/program/work-items')
    expect(reqs.map((r) => r.query.get('cursor'))).toEqual([null, 'c1'])
    expect(reqs.every((r) => r.query.get('department_id') === null)).toBe(true)
    expect(reqs.every((r) => r.query.getAll('assignee_account_id').join() === 'u1')).toBe(true)
  })
})
