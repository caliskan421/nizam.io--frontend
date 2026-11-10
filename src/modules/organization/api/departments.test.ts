import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useProgramDepartments } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { useProgramDepartmentGap } from '@/shared/scope/standing'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import {
  existingDepartment,
  useCatalogDepartments,
  useCreateCoordinatorship,
  useDeletedDepartments,
  useProgramDepartmentIndex,
  useRenameDepartmentLink,
  useUpdateDepartment,
} from './departments'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const DEPARTMENT = { department_id: 'nd', name: 'Yeni', kind: 'koordinatorluk', code: 'YN' }
const LINK = { department_id: 'nd', display_name: 'Yeni', program_id: 'p1', copied_member_count: 0 }
const INPUT = {
  programId: 'p1',
  department: { name: 'Yeni', kind: 'koordinatorluk' as const, code: 'yn' },
}

describe('departman okumaları', () => {
  it('listProgramDepartments: S2, kabukla aynı anahtar ve ham şekil; byId; kesme bayrağı', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        json({ departments: [{ department_id: 'd1', display_name: 'A' }] }, 200, {
          'X-Result-Truncated': 'true',
        }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useProgramDepartmentIndex())
    await vi.waitFor(() => expect(r.departments.value).toHaveLength(1))
    expect(r.byId.value.get('d1')?.display_name).toBe('A')
    expect(r.truncated.value).toBe(true)
    const [req] = sent('GET', '/v1/program/departments')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    // Ortak biçim: sözleşme şekli + kesildiyse `truncated: true` (shared/http/truncation.ts).
    expect(h.queryClient.getQueryData(queryKeys.departments.all(h.store.snapshot))).toEqual({
      departments: [{ department_id: 'd1', display_name: 'A' }],
      truncated: true,
    })
  })

  it('katalog (S1, başlıksız) ve silinenler (S2, imleçli)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/departments`, () => json({ departments: [DEPARTMENT] })),
      http.get(`${ORIGIN}/v1/admin/deleted/departments`, () =>
        json({ departments: [{ ...DEPARTMENT, deleted_at: '2026-11-01T00:00:00Z' }] }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const catalog = h.run(() => useCatalogDepartments())
    const deleted = h.run(() => useDeletedDepartments())
    await vi.waitFor(() => expect(catalog.departments.value).toHaveLength(1))
    await vi.waitFor(() => expect(deleted.complete.value).toBe(true))
    expect(sent('GET', '/v1/departments')[0]!.headers.get('X-Nizamio-Program')).toBeNull()
    const [del] = sent('GET', '/v1/admin/deleted/departments')
    expect(del!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(del!.query.get('limit')).toBe('200')
  })
})

describe('X-Result-Truncated: paylaşılan anahtar, okuyucudan bağımsız (shared/http/truncation)', () => {
  function truncatedDepartments() {
    server.use(
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        json({ departments: [{ department_id: 'd1', display_name: 'A' }] }, 200, {
          'X-Result-Truncated': 'true',
        }),
      ),
    )
  }

  it('önce work okuyucusu doldurur → organizasyon truncated görür (tek istek)', async () => {
    truncatedDepartments()
    const h = harness(ADMIN_SCOPE)
    const work = h.run(() => useProgramDepartments())
    await vi.waitFor(() => expect(work.byId.value.size).toBe(1))
    const org = h.run(() => useProgramDepartmentIndex())
    await h.flush()
    expect(org.truncated.value).toBe(true)
    expect(org.departments.value).toHaveLength(1)
    expect(sent('GET', '/v1/program/departments')).toHaveLength(1)
  })

  it('önce kabuk K7 okuyucusu (standing) doldurur → organizasyon truncated görür', async () => {
    truncatedDepartments()
    const h = harness(ADMIN_SCOPE)
    const gap = h.run(() => useProgramDepartmentGap(() => true))
    await vi.waitFor(() => expect(gap.value).toBe('none'))
    const org = h.run(() => useProgramDepartmentIndex())
    await h.flush()
    expect(org.truncated.value).toBe(true)
    expect(sent('GET', '/v1/program/departments')).toHaveLength(1)
  })

  it('tersi: organizasyon doldurur → work sözlüğü ve kabuk tespiti aynı veriyi okur', async () => {
    truncatedDepartments()
    const h = harness(ADMIN_SCOPE)
    const org = h.run(() => useProgramDepartmentIndex())
    await vi.waitFor(() => expect(org.truncated.value).toBe(true))
    const work = h.run(() => useProgramDepartments())
    const gap = h.run(() => useProgramDepartmentGap(() => true))
    await h.flush()
    expect(work.byId.value.get('d1')?.display_name).toBe('A')
    expect(gap.value).toBe('none')
    expect(sent('GET', '/v1/program/departments')).toHaveLength(1)
  })
})

describe('yeni koordinatörlük: oluştur → bağla (bileşik, ilk eylemin bağlamı)', () => {
  it('complete: bağ oluşturulan kimlikle ve eylemin programıyla; kod büyük harf; her adım kendi anahtarıyla (BE-050)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/departments`, () => json(DEPARTMENT, 201)),
      http.post(`${ORIGIN}/v1/program/departments`, () => json(LINK, 201)),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h.run(() => useCreateCoordinatorship()).submit(INPUT)
    expect(out.kind).toBe('complete')

    const [create] = sent('POST', '/v1/departments')
    const [link] = sent('POST', '/v1/program/departments')
    await vi.waitFor(() => expect(link!.body).toBeDefined())
    expect(create!.body).toEqual({ name: 'Yeni', kind: 'koordinatorluk', code: 'YN' })
    expect(create!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(link!.body).toEqual({ department_id: 'nd' })
    expect(link!.headers.get('X-Nizamio-Program')).toBe('p1')
    const keys = [create!, link!].map((req) => req.headers.get('Idempotency-Key'))
    for (const key of keys) expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(keys[0]).not.toBe(keys[1])
  })

  it('409 department_exists → existingDepartment: fields[department_id] + fields[deleted] (BE-050)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/departments`, () =>
        errorEnvelope('organization.department_exists', 409, [
          { field: 'department_id', code: 'organization.existing_department', message: 'd-old' },
          { field: 'deleted', code: 'organization.existing_department', message: 'true' },
        ]),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h.run(() => useCreateCoordinatorship()).submit(INPUT)
    expect(out.kind).toBe('primary_failed')
    const error =
      out.kind === 'primary_failed' && out.primary.kind === 'failed' && out.primary.error
    expect(error && existingDepartment(error)).toEqual({ departmentId: 'd-old', deleted: true })
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })

  it('oluşturma: sonuç bilinmiyor → retry aynı anahtar + gövde; çözülünce resume bağ adımını koşar', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/departments`, () =>
        ++calls === 1 ? HttpResponse.error() : json(DEPARTMENT, 200),
      ),
      http.post(`${ORIGIN}/v1/program/departments`, () => json(LINK, 201)),
    )
    const h = harness(ADMIN_SCOPE)
    const m = h.run(() => useCreateCoordinatorship())
    const first = await m.submit(INPUT)
    expect(first.kind).toBe('primary_failed')
    const unknown = first.kind === 'primary_failed' ? first.primary : null
    expect(unknown?.kind).toBe('unknown_outcome')
    if (unknown?.kind !== 'unknown_outcome' || !unknown.retry) throw new Error('retry yok')
    const again = await unknown.retry()
    expect(again.kind).toBe('success')
    const done = await m.resume(INPUT, again)
    expect(done.kind).toBe('complete')
    const creates = sent('POST', '/v1/departments')
    expect(creates).toHaveLength(2)
    expect(creates[1]!.headers.get('Idempotency-Key')).toBe(
      creates[0]!.headers.get('Idempotency-Key'),
    )
    expect(creates[1]!.body).toEqual(creates[0]!.body)
    expect(sent('POST', '/v1/program/departments')).toHaveLength(1)
  })

  it('partial: bağ başarısız → katalog kaydı korunur, adım adı link', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/departments`, () => json(DEPARTMENT, 201)),
      http.post(`${ORIGIN}/v1/program/departments`, () =>
        errorEnvelope('program.department_link_name_exists', 409),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h.run(() => useCreateCoordinatorship()).submit(INPUT)
    expect(out.kind).toBe('partial')
    expect(out.kind === 'partial' && out.failed).toEqual(['link'])
    expect(out.kind === 'partial' && out.primary.data.department_id).toBe('nd')
  })

  it('primary_failed: 409 department_exists → bağ denenmez', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/departments`, () =>
        errorEnvelope('organization.department_exists', 409),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h.run(() => useCreateCoordinatorship()).submit(INPUT)
    expect(out.kind).toBe('primary_failed')
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })

  it('oluşturma beklerken program değişti → bağ gönderilmez, partial (scope_changed)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/departments`, async () => {
        await gate
        return json(DEPARTMENT, 201)
      }),
      http.post(`${ORIGIN}/v1/program/departments`, () => json(LINK, 201)),
    )
    const h = harness(ADMIN_SCOPE)
    const pending = h.run(() => useCreateCoordinatorship()).submit(INPUT)
    await vi.waitFor(() => expect(sent('POST', '/v1/departments')).toHaveLength(1))
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    release()
    const out = await pending
    expect(out.kind).toBe('partial')
    expect(out.kind === 'partial' && out.steps[0]!.outcome.kind).toBe('scope_changed')
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })

  it('bağ adımında sonuç bilinmiyor → partial; retry aynı anahtarla tek tekrar (BE-050)', async () => {
    let links = 0
    server.use(
      http.post(`${ORIGIN}/v1/departments`, () => json(DEPARTMENT, 201)),
      http.post(`${ORIGIN}/v1/program/departments`, () =>
        ++links === 1 ? HttpResponse.error() : json(LINK, 200),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h.run(() => useCreateCoordinatorship()).submit(INPUT)
    expect(out.kind).toBe('partial')
    const link = out.kind === 'partial' ? out.steps[0]!.outcome : null
    if (link?.kind !== 'unknown_outcome' || !link.retry) throw new Error('retry yok')
    expect((await link.retry()).kind).toBe('success')
    const posts = sent('POST', '/v1/program/departments')
    expect(posts).toHaveLength(2)
    expect(posts[1]!.headers.get('Idempotency-Key')).toBe(posts[0]!.headers.get('Idempotency-Key'))
  })
})

describe('düzenleme: iki ayrı uç (G17)', () => {
  it('renameDepartmentLink S2 yol parametresi; updateDepartment S1, kod büyük harf', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/program/departments/:departmentId`, () => json(LINK)),
      http.patch(`${ORIGIN}/v1/departments/:id`, () => json(DEPARTMENT)),
    )
    const h = harness(ADMIN_SCOPE)
    const rename = h.run(() => useRenameDepartmentLink())
    const update = h.run(() => useUpdateDepartment())
    await rename.submit({ programId: 'p1', departmentId: 'd1', displayName: 'Yeni ad' })
    await update.submit({ departmentId: 'd1', changes: { code: 'ab', description: 'Açıklama' } })

    const [r] = sent('PATCH', '/v1/program/departments/d1')
    const [u] = sent('PATCH', '/v1/departments/d1')
    await vi.waitFor(() => expect(u!.body).toBeDefined())
    expect(r!.body).toEqual({ display_name: 'Yeni ad' })
    expect(r!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(u!.body).toEqual({ code: 'AB', description: 'Açıklama' })
    expect(u!.headers.get('X-Nizamio-Program')).toBeNull()
  })
})
