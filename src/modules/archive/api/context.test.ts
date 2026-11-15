import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  MEMBER,
  errorEnvelope,
  folder,
  folderBody,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  s2Requests,
  s3Requests,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import { useArchiveContext } from './context'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const cards = (ids: string[]) => ids.map((id) => folder({ folder_id: id, name: `K ${id}` }))
/** S3 `archiveFolders` (koordinatör/üye). */
const folders = (...ids: string[]) =>
  http.get(`${ORIGIN}/v1/records/archive/folders`, () => json(folderBody(...cards(ids))))
/** S2 `programArchiveFolders` (yönetici). */
const programFolders = (...ids: string[]) =>
  http.get(`${ORIGIN}/v1/program/archive/folders`, () => json(folderBody(...cards(ids))))

describe('yönetici bağlamı (S2, BE-072)', () => {
  it('/arsiv (klasörsüz): programArchiveFolders program başlığıyla; S3 isteği yok, S3 hedefi yok', async () => {
    server.use(...standing({ admin: true }), programFolders('d1'))
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveContext(null))
    await settleQueries(h.queryClient)
    expect(result.access.value.mode).toBe('admin-overview')
    expect(result.target.value).toBeNull()
    expect(result.source.value).toEqual({ programId: 'p1', departmentId: null, program: true })
    expect(result.entry.value).toEqual({ kind: 'grid' })
    expect(s3Requests()).toHaveLength(0)
    const [call] = s2Requests()
    expect(call!.path).toBe('/v1/program/archive/folders')
    expect(call!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call!.headers.get('X-Nizamio-Department')).toBeNull()
  })

  it('/arsiv/:klasorId: klasör özeti süzgeçsiz S2 ile doğrulanır; okumalar department_id süzgeciyle açılır', async () => {
    server.use(...standing({ admin: true }), programFolders('d1', 'd7'))
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveContext('d7'))
    await settleQueries(h.queryClient)
    expect(s2Requests().map((r) => r.query.get('department_id'))).toEqual([null])
    expect(result.folderOk.value).toBe(true)
    expect(result.folderMissing.value).toBe(false)
    expect(result.readsOpen.value).toBe(true)
    expect(result.source.value).toEqual({ programId: 'p1', departmentId: 'd7', program: true })
    // Klasör-başlıklı eylemler (klasör ZIP'i) için S3 hedefi klasördür; kapsam deposuna yazılmaz.
    expect(result.target.value).toEqual({ programId: 'p1', departmentId: 'd7' })
    expect(h.store.snapshot.departmentId).toBeNull()
    expect(s3Requests()).toHaveLength(0)
  })

  it('yanıtta olmayan klasör: bulunamadı; okumalar kapalı kalır', async () => {
    server.use(...standing({ admin: true }), programFolders('d1'))
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveContext('d7'))
    await settleQueries(h.queryClient)
    expect(result.folderOk.value).toBe(false)
    expect(result.folderMissing.value).toBe(true)
    expect(result.readsOpen.value).toBe(false)
  })

  it('programArchiveFolders 403/404 → klasör bulunamadı', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
        errorEnvelope('records.not_authorized', 403),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveContext('d7'))
    await settleQueries(h.queryClient)
    expect(result.folderMissing.value).toBe(true)
    expect(result.readsOpen.value).toBe(false)
  })

  it('geçersiz/sanal klasör kimliği başlığa/süzgece yazılmaz: istek yok, bulunamadı', async () => {
    server.use(...standing({ admin: true }), programFolders('d1'))
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveContext('my-tasks'))
    await settleQueries(h.queryClient)
    expect(result.access.value.mode).toBe('invalid')
    expect(result.folderMissing.value).toBe(true)
    expect(s3Requests()).toHaveLength(0)
    expect(s2Requests()).toHaveLength(0)
  })

  it('yetki olgusu (standing) gelmeden hiçbir arşiv isteği çıkmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.get(`${ORIGIN}/v1/me`, async () => {
        await gate
        return json({ account_id: 'me-1', company_admin: true, email: 'a@b.c', full_name: 'Ben' })
      }),
      http.get(`${ORIGIN}/v1/me/departments`, () => json({ departments: [] })),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
      programFolders('d1', 'd7'),
    )
    const h = harness({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const { result } = h.run(() => useArchiveContext('d7'))
    await Promise.resolve()
    expect(result.access.value.mode).toBe('waiting')
    expect(s3Requests()).toHaveLength(0)
    expect(s2Requests()).toHaveLength(0)
    release()
    await settleQueries(h.queryClient)
    // Yönetici olgusu mercekten bağımsız: koordinatör merceğinde de S2 (departman başlığı yok).
    expect(result.access.value.mode).toBe('admin-folder')
    expect(s3Requests()).toHaveLength(0)
    expect(s2Requests()[0]!.headers.get('X-Nizamio-Department')).toBeNull()
  })
})

describe('koordinatör / üye bağlamı', () => {
  it('koordinatör: başlık seçili kapsamdan; /arsiv kendi klasörüne yönlendirir (P40)', async () => {
    server.use(...standing({ rows: [['p1', 'd1', 'koordinator']] }), folders('d1'))
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveContext(null))
    await settleQueries(h.queryClient)
    expect(result.access.value.mode).toBe('scoped')
    expect(sent('GET', '/v1/records/archive/folders')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd1',
    )
    expect(result.entry.value).toEqual({ kind: 'redirect', folderId: 'd1' })
    expect(s2Requests()).toHaveLength(0)
  })

  it('üye: sanal my-tasks klasörüne yönlendirilir; klasör yanıtla doğrulanır', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'uye']] }),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () =>
        json(
          folderBody(
            folder({ folder_id: 'my-tasks', name: 'Görevlerim', file_count: 2, is_virtual: true }),
          ),
        ),
      ),
    )
    const h = harness(MEMBER)
    const route = ref<string | null>(null)
    const { result } = h.run(() => useArchiveContext(route))
    await settleQueries(h.queryClient)
    expect(result.entry.value).toEqual({ kind: 'redirect', folderId: 'my-tasks' })
    route.value = 'my-tasks'
    await settleQueries(h.queryClient)
    expect(result.folderOk.value).toBe(true)
    expect(result.readsOpen.value).toBe(true)
    route.value = 'baska-klasor'
    expect(result.folderMissing.value).toBe(true)
  })
})
