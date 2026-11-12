// 12 Silinen kayıtlar (W128): yaşam döngüsü yazmalarının geçersizleme ilişkileri (KESİN 29).
// `docs/ekranlar/12-silinen-kayitlar/backend.md` §5 tablosu: görev/toplantı/departman/hesap
// geri yükleme ve kalıcı silme kendi silinen listesini, bağlı kaynakları ve panoyu (`report`;
// `deleted_records`) yeniden okutur; hesap geneli liste kapsam değişince düşmez.
import { QueryClient, QueryObserver } from '@tanstack/vue-query'
import { describe, expect, it, vi } from 'vitest'

import {
  invalidationFilters,
  isScopedQueryKey,
  resourcesInvalidatedBy,
  queryKeys,
  type OperationId,
} from './query-keys'
import type { QueryResource } from './query-keys'

const S = { programId: 'p1', departmentId: null }

const RELATIONS: ReadonlyArray<[OperationId[], QueryResource[]]> = [
  [
    ['restoreWorkItem', 'permanentDeleteWorkItem'],
    [
      'deletedWorkItems',
      'workItems.list',
      'workItems.item',
      'workItems.counts',
      'gantt',
      'workItems.files',
      'archive',
      'report',
    ],
  ],
  [
    ['restoreMeeting', 'permanentDeleteMeeting'],
    ['meetings', 'report'],
  ],
  [
    ['restoreDepartment', 'permanentDeleteDepartment'],
    ['deletedDepartments', 'departments', 'catalog.departments', 'me', 'report'],
  ],
  [
    ['restoreAccount', 'permanentDeleteAccount'],
    ['deletedAccounts', 'users', 'departments.members', 'departments.assignable', 'report'],
  ],
]

describe('12 Silinen kayıtlar — geçersizleme ilişkileri', () => {
  for (const [operations, expected] of RELATIONS) {
    for (const operation of operations) {
      it(`${operation}: ${expected.join(', ')}`, () => {
        const got = resourcesInvalidatedBy(operation)
        for (const resource of expected) expect(got, resource).toContain(resource)
      })
    }
  }

  it('silinen görevler kapsamlı, silinen hesaplar hesap geneli (kapsam değişince düşmez)', () => {
    expect(isScopedQueryKey(queryKeys.deletedWorkItems.list(S, { limit: 50 }))).toBe(true)
    expect(isScopedQueryKey(queryKeys.deletedWorkItems.all(S))).toBe(true)
    expect(isScopedQueryKey(queryKeys.deletedAccounts.list({ limit: 50 }))).toBe(false)
    expect(queryKeys.deletedAccounts.all()).toEqual(['deleted-accounts'])
  })

  it('toplantı geri yükleme silinen toplantı anahtarını (09 ile ortak) vurur', () => {
    expect(queryKeys.meetings.deleted(S).slice(-2)).toEqual(['meetings', 'deleted'])
    expect(resourcesInvalidatedBy('restoreMeeting')).toContain('meetings')
  })

  for (const operation of ['restoreWorkItem', 'permanentDeleteWorkItem'] as const) {
    it(`${operation}: taze ortak dosya girdisi bayatlar, etkin okuyucu yeniden okur, başka program etkilenmez`, async () => {
      const client = new QueryClient()
      const active = queryKeys.workItems.files(S, 'w1')
      const passive = queryKeys.workItems.files(S, 'w2')
      const other = queryKeys.workItems.files({ programId: 'p2', departmentId: null }, 'w1')
      let reads = 0
      client.setQueryData(passive, ['taze'])
      client.setQueryData(other, ['taze'])
      const observer = new QueryObserver(client, {
        queryKey: active,
        queryFn: () => ['okuma', ++reads],
        staleTime: 30_000,
      })
      const stop = observer.subscribe(() => {})
      await vi.waitFor(() => expect(reads).toBe(1))
      expect(client.getQueryState(active)?.isInvalidated).toBe(false) // 30 sn taze
      await Promise.all(
        invalidationFilters(operation, S, {}).map((filter) => client.invalidateQueries(filter)),
      )
      stop()
      expect(reads).toBe(2) // etkin okuyucu yeniden okudu
      expect(client.getQueryState(passive)?.isInvalidated).toBe(true) // pasif girdi bayat
      expect(client.getQueryState(other)?.isInvalidated).toBe(false) // başka program
    })
  }
})
