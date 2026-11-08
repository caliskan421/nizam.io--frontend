import { isCancelledError } from '@tanstack/vue-query'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createFakeBackend } from '../../../tests/support/fake-backend'
import {
  createTarget,
  freshModules,
  newQueryClient,
  row,
  standingHandlers,
  withSetup,
  type StandingFixture,
} from './__tests__/harness'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
})
afterAll(() => backend.server.close())

async function boot(
  fixture: StandingFixture,
  remembered: {
    programId?: string
    lens?: 'admin' | 'coordinator' | 'member'
    departmentId?: string
  } = {},
) {
  backend.server.use(...standingHandlers(backend, fixture))
  const m = await freshModules()
  const prefs = m.preferences.preferences
  if (remembered.programId) prefs.write('scope.programId', remembered.programId)
  if (remembered.lens) prefs.write('scope.lens', remembered.lens)
  if (remembered.departmentId) prefs.write('scope.departmentId', remembered.departmentId)
  const queryClient = newQueryClient()
  const target = createTarget()
  const { result } = withSetup(() => m.lifecycle.useScopeLifecycle(target), m.pinia, queryClient)
  const store = m.store.useScopeStore()
  return { m, scope: result, store, queryClient, target, fixture }
}

async function settle(scope: { status: { value: string } }, expected: string) {
  await vi.waitFor(() => expect(scope.status.value).toBe(expected))
}

describe('kapsam yaşam döngüsü', () => {
  it('çoklu rol: yönetici + koordinatör → mercek seçici; sessiz seçim yok', async () => {
    const { scope, store } = await boot({
      companyAdmin: true,
      rows: [row('p1', 'd1', 'koordinator'), row('p1', 'd2', 'uye')],
      programs: [{ program_id: 'p1', name: 'Program 1' }],
    })
    await settle(scope, 'selecting')
    expect(scope.pending.value).toBe('lens')
    expect(store.snapshot).toEqual({ programId: 'p1', lens: null, departmentId: null })
    expect(scope.lenses.value.map((l) => l.lens)).toEqual(['admin', 'coordinator', 'member'])
    expect(scope.lensFixed.value).toBe(false)

    scope.selectLens('coordinator')
    await settle(scope, 'ready')
    expect(store.snapshot).toEqual({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
  })

  it('mercek değişiminde company_admin korunur (P1); olgular mercekten bağımsız', async () => {
    const { scope, store } = await boot(
      {
        companyAdmin: true,
        rows: [row('p1', 'd1', 'koordinator')],
        programs: [{ program_id: 'p1', name: 'Program 1' }],
      },
      { lens: 'admin' },
    )
    await settle(scope, 'ready')
    expect(store.lens).toBe('admin')
    expect(scope.facts.value).toEqual({ companyAdmin: true, coordinator: false, member: false })

    scope.selectLens('coordinator')
    await vi.waitFor(() => expect(store.departmentId).toBe('d1'))
    expect(scope.facts.value).toEqual({ companyAdmin: true, coordinator: true, member: false })
    expect(scope.standing.value?.companyAdmin).toBe(true)
  })

  it('satırsız yönetici: tek program → admin merceği, departmansız kapsam; tek mercek salt gösterim', async () => {
    const { scope, store } = await boot({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Program 1', year: 2026 }],
    })
    await settle(scope, 'ready')
    expect(store.snapshot).toEqual({ programId: 'p1', lens: 'admin', departmentId: null })
    expect(scope.departments.value).toEqual([])
    expect(scope.lensFixed.value).toBe(true)
    // Standing uçları S1: kapsam başlığı taşımaz.
    for (const r of backend.state.requests.filter((x) => x.path.startsWith('/v1/me'))) {
      expect(r.headers.get('X-Nizamio-Program')).toBeNull()
    }
  })

  it('satırsız üye: listPrograms 403 membership_required → K7, kart yok, hatırlanan düşer', async () => {
    const { scope, store, m } = await boot(
      { companyAdmin: false, rows: [], programs: 'membership_required' },
      { programId: 'p1', lens: 'member', departmentId: 'd1' },
    )
    await settle(scope, 'empty')
    expect(scope.emptyReason.value).toBe('membership_required')
    expect(scope.programs.value).toEqual([])
    expect(store.snapshot).toEqual({ programId: null, lens: null, departmentId: null })
    expect(m.preferences.preferences.read('scope.programId')).toBeNull()
  })

  it('çok program + hatırlanan yok → program seçici açık (ilk program sessizce seçilmez)', async () => {
    const { scope, store } = await boot({
      companyAdmin: true,
      rows: [],
      programs: [
        { program_id: 'p2', name: 'Zafer' },
        { program_id: 'p1', name: 'Çelik' },
      ],
      programsTruncated: true,
    })
    await settle(scope, 'selecting')
    expect(scope.pending.value).toBe('program')
    expect(store.programId).toBeNull()
    expect(scope.programs.value.map((p) => p.name)).toEqual(['Çelik', 'Zafer'])
    expect(scope.programsTruncated.value).toBe(true)

    scope.selectProgram('p2')
    await settle(scope, 'ready')
    expect(store.snapshot).toEqual({ programId: 'p2', lens: 'admin', departmentId: null })
  })

  it('program değişiminde birim yeni programda yoksa seçici açılır; eski kapsam sorguları düşer', async () => {
    const { scope, store, queryClient, m } = await boot(
      {
        companyAdmin: false,
        rows: [
          row('p1', 'd1', 'koordinator'),
          row('p2', 'd2', 'koordinator'),
          row('p2', 'd3', 'koordinator'),
        ],
        programs: [
          { program_id: 'p1', name: 'Bir' },
          { program_id: 'p2', name: 'İki' },
        ],
      },
      { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    )
    await settle(scope, 'ready')
    const oldKey = m.scope.scopedKey(store.snapshot, 'work-items')
    queryClient.setQueryData(oldKey, ['eski veri'])
    queryClient.setQueryData(['notifications', 'unread-count'], { count: 3 })
    // Uçuştaki kapsamlı sorgu da iptal edilir.
    const inflight = queryClient
      .fetchQuery({
        queryKey: m.scope.scopedKey(store.snapshot, 'gantt'),
        queryFn: () => new Promise<never>(() => undefined),
      })
      .then(
        () => 'tamamlandı',
        (error: unknown) => error,
      )

    scope.selectProgram('p2')
    await settle(scope, 'selecting')
    expect(scope.pending.value).toBe('department')
    expect(store.snapshot).toEqual({ programId: 'p2', lens: 'coordinator', departmentId: null })
    expect(scope.departments.value.map((d) => d.departmentId)).toEqual(['d2', 'd3'])
    expect(queryClient.getQueryData(oldKey)).toBeUndefined()
    expect(
      queryClient
        .getQueryCache()
        .findAll({ predicate: (q) => m.scope.isScopedQueryKey(q.queryKey) }),
    ).toEqual([])
    expect(queryClient.getQueryData(['notifications', 'unread-count'])).toEqual({ count: 3 })
    expect(isCancelledError(await inflight)).toBe(true)

    scope.selectDepartment('d3')
    await settle(scope, 'ready')
    expect(m.preferences.preferences.read('scope.departmentId')).toBe('d3')
  })

  it('mercek değişimi de kapsam değişimidir: sorgular düşer', async () => {
    const { scope, store, queryClient, m } = await boot(
      {
        companyAdmin: true,
        rows: [row('p1', 'd1', 'koordinator')],
        programs: [{ program_id: 'p1', name: 'Bir' }],
      },
      { lens: 'admin' },
    )
    await settle(scope, 'ready')
    const key = m.scope.scopedKey(store.snapshot, 'report', 'dashboard')
    queryClient.setQueryData(key, { overdue_tasks: 1 })
    scope.selectLens('coordinator')
    await vi.waitFor(() => expect(store.departmentId).toBe('d1'))
    expect(queryClient.getQueryData(key)).toBeUndefined()
  })

  it('yetki kaybı (sorgu 404 work.program_scope_invalid): standing tazelenir, kapsam yeniden doğrulanır', async () => {
    const fixture: StandingFixture = {
      companyAdmin: false,
      rows: [row('p1', 'd1', 'uye'), row('p1', 'd2', 'uye')],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    }
    const { scope, store, queryClient, m } = await boot(fixture, { departmentId: 'd1' })
    await settle(scope, 'ready')
    expect(store.departmentId).toBe('d1')
    const before = backend.count('/v1/me/departments')

    fixture.rows = [row('p1', 'd2', 'uye')]
    await queryClient
      .fetchQuery({
        queryKey: m.scope.scopedKey(store.snapshot, 'work-items'),
        queryFn: () => {
          throw new m.errors.ApiError({ code: 'work.program_scope_invalid', status: 404 })
        },
      })
      .catch(() => undefined)

    await vi.waitFor(() => expect(store.departmentId).toBe('d2'))
    expect(backend.count('/v1/me/departments')).toBeGreaterThan(before)
    expect(backend.count('/v1/me')).toBeGreaterThan(1)
  })

  it('yetki kaybı (mutasyon 403 organization.membership_required) → K7', async () => {
    const fixture: StandingFixture = {
      companyAdmin: false,
      rows: [row('p1', 'd1', 'uye')],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    }
    const { scope, queryClient, m } = await boot(fixture)
    await settle(scope, 'ready')

    fixture.rows = []
    fixture.programs = 'membership_required'
    await queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationFn: () =>
          Promise.reject(
            new m.errors.ApiError({ code: 'organization.membership_required', status: 403 }),
          ),
      })
      .execute(undefined)
      .catch(() => undefined)

    await settle(scope, 'empty')
    expect(scope.emptyReason.value).toBe('membership_required')
  })

  it('yetki kaybı olmayan hata standing tazelemez', async () => {
    const { scope, store, queryClient, m } = await boot({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    })
    await settle(scope, 'ready')
    const before = backend.count('/v1/me')
    await queryClient
      .fetchQuery({
        queryKey: m.scope.scopedKey(store.snapshot, 'work-items', 'x'),
        queryFn: () => {
          throw new m.errors.ApiError({ code: 'work.item_not_found', status: 404 })
        },
      })
      .catch(() => undefined)
    await new Promise((r) => setTimeout(r, 20))
    expect(backend.count('/v1/me')).toBe(before)
  })

  it('pencere görünür olunca / odağa dönünce standing tazelenir', async () => {
    const { scope, target } = await boot({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    })
    await settle(scope, 'ready')
    const before = backend.count('/v1/me')

    target.document.visibilityState = 'hidden'
    target.document.dispatchEvent(new Event('visibilitychange'))
    await new Promise((r) => setTimeout(r, 20))
    expect(backend.count('/v1/me')).toBe(before)

    target.document.visibilityState = 'visible'
    target.document.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(backend.count('/v1/me')).toBe(before + 1))

    target.window.dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect(backend.count('/v1/me')).toBe(before + 2))
  })
})
