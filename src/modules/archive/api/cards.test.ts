import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
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
import { useFolderCards } from './cards'
import { useArchiveContext } from './context'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

describe('06 klasör kartları', () => {
  it('yönetici: programArchiveFolders (S2) sayılarıyla; S3 isteği YOK, departman başlığı YOK (BE-072)', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
        json(
          folderBody(
            folder({ folder_id: 'd2', name: 'Zemin', file_count: 0 }),
            folder({ folder_id: 'd1', name: 'Ağ', file_count: 6 }),
          ),
        ),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useFolderCards(useArchiveContext(null)))
    await settleQueries(h.queryClient)
    expect(result.cards.value).toEqual([
      { folderId: 'd1', name: 'Ağ', fileCount: 6, virtual: false },
      { folderId: 'd2', name: 'Zemin', fileCount: 0, virtual: false },
    ])
    expect(s3Requests()).toHaveLength(0)
    expect(s2Requests().map((r) => r.path)).toEqual(['/v1/program/archive/folders'])
    expect(s2Requests()[0]!.headers.get('X-Nizamio-Department')).toBeNull()
    // Eski yol yok: departman adları için `listProgramDepartments` okunmaz (P33 geçici yolu kalktı).
    expect(sent('GET', '/v1/program/departments')).toHaveLength(0)
  })

  it('yönetici: yükleniyor/hata durumları klasör özeti sorgusundandır', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/archive/folders`, () => json({ code: 'x' }, 500)),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useFolderCards(useArchiveContext(null)))
    await settleQueries(h.queryClient)
    expect(result.error.value).toBe(true)
  })

  it('koordinatör: archiveFolders sayılarıyla (kendi klasörü); S2 isteği YOK', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () =>
        json(folderBody(folder({ file_count: 3 }))),
      ),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useFolderCards(useArchiveContext(null)))
    await settleQueries(h.queryClient)
    expect(result.cards.value).toEqual([
      { folderId: 'd1', name: 'Koordinatörlük 1', fileCount: 3, virtual: false },
    ])
    expect(result.loading.value).toBe(false)
    expect(result.error.value).toBe(false)
    expect(s2Requests()).toHaveLength(0)
  })
})
