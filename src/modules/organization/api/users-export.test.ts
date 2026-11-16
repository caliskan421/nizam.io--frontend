import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'

import {
  ADMIN,
  browserSave,
  errorEnvelope,
  harness,
  http,
  ORIGIN,
  resetHarness,
  sent,
  server,
  ticketOk,
} from '@/shared/download/__tests__/harness'
import { HttpResponse } from 'msw'

import { userRoleFilterOf } from '../model/capabilities'
import { useUsersExport, usersExportTarget } from './users-export'

let saved: ReturnType<typeof browserSave>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
})
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const csv = (headers: HeadersInit = {}) =>
  http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
    HttpResponse.text('a;b\r\n', { headers: { 'Content-Type': 'text/csv', ...headers } }),
  )

it('builds the same query string as listUsers filters and omits empty ones', () => {
  expect(
    usersExportTarget({
      search: '  ada ',
      sortOrder: 'desc',
      role: userRoleFilterOf('koordinator'),
      programId: 'p1',
      departmentId: 'd1',
    }),
  ).toEqual({
    method: 'GET',
    path: `/v1/admin/users/export?role=${userRoleFilterOf('koordinator')}&search=ada&program_id=p1&department_id=d1&sort_by=name&sort_order=desc`,
    headers: {},
    fallbackName: 'kullanicilar.csv',
  })
  expect(usersExportTarget({ search: null, sortOrder: 'asc' }).path).toBe(
    '/v1/admin/users/export?sort_by=name&sort_order=asc',
  )
})

it('issues a ticket for the on-screen filters and saves the CSV', async () => {
  server.use(
    ticketOk(),
    csv({ 'Content-Disposition': 'attachment; filename="kullanicilar-2026-11-16.csv"' }),
  )
  const { result } = harness(ADMIN).run(() => useUsersExport())
  const out = await result.run({ search: 'ada', sortOrder: 'asc', role: 'company_admin' })
  expect(out).toEqual({ kind: 'saved', fileName: 'kullanicilar-2026-11-16.csv' })
  const [issue] = sent('POST', '/v1/download-tickets')
  expect(issue!.body).toEqual({
    method: 'GET',
    path: '/v1/admin/users/export?role=company_admin&search=ada&sort_by=name&sort_order=asc',
  })
  expect(issue!.headers.get('Idempotency-Key')).toBeNull()
  expect(saved.clicked).toEqual(['kullanicilar-2026-11-16.csv'])
})

it.each([
  ['organization.export_in_progress', 429],
  ['organization.export_too_large', 422],
  ['organization.capacity_full', 503],
])('classifies %s (%s) without retry', async (code, status) => {
  let redeems = 0
  server.use(
    ticketOk(),
    http.get(`${ORIGIN}/v1/downloads/tk_1`, () => {
      redeems += 1
      return errorEnvelope(code, status)
    }),
  )
  const { result } = harness(ADMIN).run(() => useUsersExport())
  const out = await result.run({ search: null, sortOrder: 'asc' })
  expect(out).toMatchObject({ kind: 'failed', error: { code } })
  expect(redeems).toBe(1)
  expect(saved.clicked).toEqual([])
})

it('cancels the held export when the scope changes and issues no download', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    http.post(`${ORIGIN}/v1/download-tickets`, async () => {
      await gate
      return HttpResponse.json(
        { ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-12T12:01:00Z' },
        { status: 201 },
      )
    }),
    csv(),
  )
  const h = harness(ADMIN)
  const { result } = h.run(() => useUsersExport())
  const pending = result.run({ search: null, sortOrder: 'asc' })
  h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
  release()
  expect((await pending).kind).not.toBe('saved')
  expect(saved.clicked).toEqual([])
})
