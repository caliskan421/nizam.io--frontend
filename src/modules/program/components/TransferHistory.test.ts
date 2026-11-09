import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  $,
  ADMIN_SCOPE,
  click,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  server,
} from '../__tests__/harness'
import TransferHistory from './TransferHistory.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const PROGRAMS = [
  { programId: 'p1', name: 'Teknofest 2026', year: 2026 },
  { programId: 'p2', name: 'Teknofest 2027', year: 2027 },
]

function record(id: string, over: Record<string, unknown> = {}) {
  return {
    transfer_id: id,
    source_program_id: 'p1',
    target_program_id: 'p2',
    department_id: 'd1',
    work_item_ids: ['w1'],
    moved_item_count: 3,
    moved_file_count: 1,
    cut_dependency_count: 0,
    restored_dependency_count: 0,
    granted_memberships: [],
    created_at: '2026-11-01T09:30:00Z',
    ...over,
  }
}

describe('aktarım geçmişi', () => {
  it('program adı listeden, departman adı katalogdan; ters aktarım rozeti; daha fazla yükle', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program-transfers`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ transfers: [record('t2', { source_program_id: 'px' })] })
          : json({
              transfers: [record('t1', { reverses_transfer_id: 't0' })],
              next_cursor: 'c1',
            }),
      ),
      http.get(`${ORIGIN}/v1/departments`, () =>
        json({ departments: [{ department_id: 'd1', name: 'Roket', kind: 'koordinatorluk' }] }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    h.queryClient.removeQueries({ queryKey: queryKeys.catalog.departments() })
    h.mount(TransferHistory, { programs: PROGRAMS })
    await vi.waitFor(() => expect($('[data-transfer="t1"]')).not.toBeNull())
    const row = $('[data-transfer="t1"]')!.textContent ?? ''
    expect(row).toContain('Teknofest 2026 → Teknofest 2027')
    await vi.waitFor(() => expect($('[data-transfer="t1"]')!.textContent).toContain('Roket'))
    expect(row).toContain('3 görev · 1 dosya')
    expect(row).toContain('Ters aktarım')
    click('[data-testid="pg-history"] .pg-actions button')
    await vi.waitFor(() => expect($('[data-transfer="t2"]')).not.toBeNull())
    expect($('[data-transfer="t2"]')!.textContent).toContain('Silinmiş ya da bilinmeyen program')
  })

  it('boş geçmiş notu', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program-transfers`, () => json({ transfers: [] })),
      http.get(`${ORIGIN}/v1/departments`, () => json({ departments: [] })),
    )
    const h = harness(ADMIN_SCOPE)
    h.mount(TransferHistory, { programs: PROGRAMS })
    await vi.waitFor(() => expect(document.body.textContent).toContain('Henüz aktarım yapılmadı.'))
  })
})
