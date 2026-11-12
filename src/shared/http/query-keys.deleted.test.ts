// 12 Silinen kayıtlar (W128): yaşam döngüsü yazmalarının geçersizleme ilişkileri (KESİN 29).
// `docs/ekranlar/12-silinen-kayitlar/backend.md` §5 tablosu: görev/toplantı/departman/hesap
// geri yükleme ve kalıcı silme kendi silinen listesini, bağlı kaynakları ve panoyu (`report`;
// `deleted_records`) yeniden okutur; hesap geneli liste kapsam değişince düşmez.
import { describe, expect, it } from 'vitest'

import { isScopedQueryKey, resourcesInvalidatedBy, queryKeys, type OperationId } from './query-keys'
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
})
