import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { adminCandidates, coordinatorCandidates } from './candidates'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

it('loads all admin pages including empty pages and keeps disabled accounts with a program team', async () => {
  let count = 0
  server.use(
    http.get('http://localhost/v1/admin/users', ({ request }) => {
      expect(new URL(request.url).searchParams.get('program_id')).toBe('p')
      count += 1
      return HttpResponse.json({
        users:
          count === 1
            ? []
            : [
                {
                  account_id: 'a',
                  full_name: 'A',
                  account_status: 'disabled',
                  teams: [{ program_id: 'p' }],
                },
                {
                  account_id: 'b',
                  full_name: 'B',
                  account_status: 'active',
                  teams: [{ program_id: 'other' }],
                },
              ],
        next_cursor: count === 1 ? 'next' : '',
        total: 1,
        role_counts: {},
      })
    }),
  )
  const result = await adminCandidates('p', new AbortController().signal)
  expect(result.people).toEqual([{ accountId: 'a', fullName: 'A' }])
  expect(count).toBe(2)
})

it('reads only supplied coordOf rosters, deduplicates active rows and records truncation', async () => {
  const seen: string[] = []
  server.use(
    http.get('http://localhost/v1/departments/:id/members', ({ params }) => {
      seen.push(String(params.id))
      return HttpResponse.json(
        {
          members: [
            { account_id: 'a', full_name: 'A', status: 'active' },
            { account_id: 'b', full_name: 'B', status: 'deleted' },
          ],
        },
        { headers: { 'X-Result-Truncated': 'true' } },
      )
    }),
  )
  const result = await coordinatorCandidates('p', ['d1', 'd1', 'd2'], new AbortController().signal)
  expect(seen).toEqual(['d1', 'd2'])
  expect(result).toEqual({
    people: [{ accountId: 'a', fullName: 'A' }],
    truncated: true,
    partial: true,
  })
})

it.each(['session', 'abort'] as const)('stops a held roster load on %s change', async (change) => {
  const { authSession } = await import('@/shared/http')
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const requested = new Promise<void>((resolve) => {
    started = resolve
  })
  let calls = 0
  server.use(
    http.get('http://localhost/v1/departments/:id/members', async () => {
      calls += 1
      started()
      await gate
      return HttpResponse.json({ members: [] })
    }),
  )
  const controller = new AbortController()
  const loading = coordinatorCandidates('p', ['d1', 'd2'], controller.signal)
  await requested
  if (change === 'abort') controller.abort()
  else authSession.clear()
  release()
  await expect(loading).rejects.toBeDefined()
  expect(calls).toBe(1)
})

it('does not read the next admin page after the account changes', async () => {
  const { authSession } = await import('@/shared/http')
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const requested = new Promise<void>((resolve) => {
    started = resolve
  })
  let calls = 0
  server.use(
    http.get('http://localhost/v1/admin/users', async () => {
      calls += 1
      started()
      await gate
      return HttpResponse.json({ users: [], next_cursor: 'next', total: 0, role_counts: {} })
    }),
  )
  const loading = adminCandidates('p', new AbortController().signal)
  await requested
  authSession.clear()
  release()
  await expect(loading).rejects.toBeDefined()
  expect(calls).toBe(1)
})
