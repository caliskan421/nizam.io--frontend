import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  folder,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
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
  it('yönetici: listProgramDepartments adlarından, sayılar null, S3 isteği YOK (P33)', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        json({
          departments: [
            { department_id: 'd2', display_name: 'Zemin' },
            { department_id: 'd1', display_name: 'Ağ', code: 'AG' },
          ],
        }),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useFolderCards(useArchiveContext(null)))
    await settleQueries(h.queryClient)
    expect(result.cards.value).toEqual([
      { folderId: 'd1', name: 'Ağ', fileCount: null, virtual: false },
      { folderId: 'd2', name: 'Zemin', fileCount: null, virtual: false },
    ])
    expect(result.truncated.value).toBe(false)
    expect(s3Requests()).toHaveLength(0)
    expect(
      sent('GET', '/v1/program/departments')[0]!.headers.get('X-Nizamio-Department'),
    ).toBeNull()
  })

  it('yönetici: >200 bağda departman listesi kesilmiş olgusu (X-Result-Truncated)', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(
        `${ORIGIN}/v1/program/departments`,
        () =>
          new Response(
            JSON.stringify({ departments: [{ department_id: 'd1', display_name: 'Ağ' }] }),
            { headers: { 'Content-Type': 'application/json', 'X-Result-Truncated': 'true' } },
          ),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useFolderCards(useArchiveContext(null)))
    await settleQueries(h.queryClient)
    expect(result.truncated.value).toBe(true)
  })

  it('koordinatör: archiveFolders sayılarıyla (kendi klasörü)', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] })),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () => json({ folders: [folder()] })),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useFolderCards(useArchiveContext(null)))
    await settleQueries(h.queryClient)
    expect(result.cards.value).toEqual([
      { folderId: 'd1', name: 'Koordinatörlük 1', fileCount: 3, virtual: false },
    ])
    expect(result.loading.value).toBe(false)
    expect(result.error.value).toBe(false)
  })
})
