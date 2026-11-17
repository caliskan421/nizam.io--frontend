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
const f = { limit: 50 }

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
    ['batchRestoreWorkItems', 'batchPurgeWorkItems', 'purgeAllWorkItems'],
    [
      'deletedWorkItems',
      'deletedSummary',
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
    ['batchRestoreMeetings', 'batchPurgeMeetings', 'purgeAllMeetings'],
    ['meetings', 'deletedSummary', 'report'],
  ],
  [
    ['batchRestoreDepartments', 'batchPurgeDepartments', 'purgeAllDepartments'],
    ['deletedDepartments', 'deletedSummary', 'departments', 'catalog.departments', 'me', 'report'],
  ],
  [
    ['batchRestoreAccounts', 'batchPurgeAccounts', 'purgeAllAccounts'],
    [
      'deletedAccounts',
      'deletedSummary',
      'users',
      'departments.members',
      'departments.assignable',
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
  // v0.26 çocuk çöpleri (W192): tür başına beş yönetim ucu + canlı yüzden yumuşak silme.
  [
    ['restoreFile', 'permanentDeleteFile', 'batchRestoreFiles', 'batchPurgeFiles', 'purgeAllFiles'],
    [
      'deletedFiles',
      'deletedRecords',
      'deletedSummary',
      'deletedWorkItems',
      'archive',
      'workItems.files',
      'workItems.item',
      'workItems.list',
      'report.task',
      'chats.refSummary',
      'report',
    ],
  ],
  [
    ['deleteFile'],
    [
      'deletedFiles',
      'deletedRecords',
      'deletedSummary',
      'deletedWorkItems',
      'archive',
      'workItems.files',
      'workItems.item',
      'chats.refSummary',
      'report',
    ],
  ],
  [
    [
      'restoreSubtask',
      'permanentDeleteSubtask',
      'batchRestoreSubtasks',
      'batchPurgeSubtasks',
      'purgeAllSubtasks',
    ],
    [
      'deletedSubtasks',
      'deletedRecords',
      'deletedSummary',
      'deletedWorkItems',
      'workItems.subtasks',
      'workItems.list',
      'workItems.item',
      'workItems.counts',
      'workItems.files',
      'gantt',
      'report.task',
      'report',
    ],
  ],
  [
    ['deleteWorkItemSubtask'],
    ['deletedSubtasks', 'deletedRecords', 'deletedSummary', 'deletedWorkItems', 'report'],
  ],
  [
    [
      'restoreTaskNote',
      'permanentDeleteTaskNote',
      'batchRestoreTaskNotes',
      'batchPurgeTaskNotes',
      'purgeAllTaskNotes',
    ],
    [
      'deletedTaskNotes',
      'deletedRecords',
      'deletedSummary',
      'deletedWorkItems',
      'workItems.notes',
      'report.task',
      'report',
    ],
  ],
  [
    ['deleteWorkItemNote'],
    ['deletedTaskNotes', 'deletedRecords', 'deletedSummary', 'deletedWorkItems', 'report'],
  ],
  [
    [
      'restoreMeetingNote',
      'permanentDeleteMeetingNote',
      'batchRestoreMeetingNotes',
      'batchPurgeMeetingNotes',
      'purgeAllMeetingNotes',
    ],
    [
      'deletedMeetingNotes',
      'deletedRecords',
      'deletedSummary',
      'meetings',
      'report.meeting',
      'report',
    ],
  ],
  [
    ['deleteMeetingNote'],
    ['deletedMeetingNotes', 'deletedRecords', 'deletedSummary', 'meetings', 'report.meeting'],
  ],
  [
    [
      'restoreAgendaItem',
      'permanentDeleteAgendaItem',
      'batchRestoreAgendaItems',
      'batchPurgeAgendaItems',
      'purgeAllAgendaItems',
    ],
    [
      'deletedAgendaItems',
      'deletedRecords',
      'deletedSummary',
      'meetings',
      'report.meeting',
      'report',
    ],
  ],
  [
    ['deleteAgendaItem'],
    ['deletedAgendaItems', 'deletedRecords', 'deletedSummary', 'meetings', 'report.meeting'],
  ],
  // Ebeveynin yaşam döngüsü çocuk çöplerini (`parent_deleted`, ebeveyn kalıcı silinince çocuk) ve
  // birleşik listeyi de yeniler.
  [
    ['deleteWorkItem', 'restoreWorkItem', 'permanentDeleteWorkItem', 'batchPurgeWorkItems'],
    ['deletedFiles', 'deletedSubtasks', 'deletedTaskNotes', 'deletedRecords', 'deletedSummary'],
  ],
  [
    ['deleteMeeting', 'restoreMeeting', 'permanentDeleteMeeting', 'purgeAllMeetings'],
    ['deletedMeetingNotes', 'deletedAgendaItems', 'deletedRecords', 'deletedSummary'],
  ],
  [
    ['deleteDepartment', 'restoreDepartment', 'permanentDeleteDepartment', 'purgeAllDepartments'],
    ['deletedRecords', 'deletedSummary'],
  ],
  // Hesap (S1) yazmaları şirket geneli: bütün programların birleşik liste, özet ve panosu.
  [
    ['restoreAccount', 'permanentDeleteAccount', 'batchRestoreAccounts', 'purgeAllAccounts'],
    ['deletedRecordsAllPrograms', 'deletedSummaryAllPrograms', 'dashboardAllPrograms'],
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

  it('program kapsamlı çöp yazması başka programın birleşik/özet önbelleğine dokunmaz', () => {
    const p2 = { programId: 'p2', departmentId: null }
    const own = [queryKeys.deletedRecords.list(S, f), queryKeys.deletedSummary.all(S)]
    const other = [queryKeys.deletedRecords.list(p2, f), queryKeys.deletedSummary.all(p2)]
    for (const operation of [
      'restoreFile',
      'deleteWorkItemSubtask',
      'purgeAllAgendaItems',
    ] as const) {
      const client = new QueryClient()
      for (const key of [...own, ...other]) client.setQueryData(key, 1)
      for (const filter of invalidationFilters(operation, S, {}))
        void client.invalidateQueries(filter)
      expect(
        own.every((key) => client.getQueryState(key)?.isInvalidated),
        operation,
      ).toBe(true)
      expect(
        other.some((key) => client.getQueryState(key)?.isInvalidated),
        operation,
      ).toBe(false)
    }
  })

  it('hesap (S1) yazması bütün programların birleşik liste, özet ve panosunu bayatlatır; hesap başlığı program taşımaz', () => {
    const p2 = { programId: 'p2', departmentId: null }
    const keys = [S, p2].flatMap((scope) => [
      queryKeys.deletedRecords.list(scope, f),
      queryKeys.deletedSummary.all(scope),
      queryKeys.report.dashboard(scope),
    ])
    const unrelated = queryKeys.deletedFiles.list(p2, f)
    for (const operation of ['restoreAccount', 'batchPurgeAccounts'] as const) {
      const client = new QueryClient()
      for (const key of [...keys, unrelated]) client.setQueryData(key, 1)
      // Eylemin yakalanmış kapsamı p1; p2 önbelleği yine de bayatlar.
      for (const filter of invalidationFilters(operation, S, {}))
        void client.invalidateQueries(filter)
      expect(
        keys.every((key) => client.getQueryState(key)?.isInvalidated),
        operation,
      ).toBe(true)
      expect(client.getQueryState(unrelated)?.isInvalidated, operation).toBe(false)
    }
  })

  it.each([
    'deleteFile',
    'restoreFile',
    'permanentDeleteFile',
    'batchRestoreFiles',
    'batchPurgeFiles',
    'purgeAllFiles',
  ] as const)(
    '%s: eylemin programındaki bütün departman ref özetleri bayatlar; p2 ve paylaşılan sayı/ek değişmez',
    async (operation) => {
      const client = new QueryClient()
      const d1 = queryKeys.chats.refSummary({ programId: 'p1', departmentId: 'd1' }, 'r1')
      const d2 = queryKeys.chats.refSummary({ programId: 'p1', departmentId: 'd2' }, 'r2')
      const none = queryKeys.chats.refSummary({ programId: 'p1', departmentId: null }, 'r3')
      const other = queryKeys.chats.refSummary({ programId: 'p2', departmentId: 'd1' }, 'r4')
      const counts = queryKeys.chats.sharedCounts({ programId: 'p1', departmentId: 'd1' }, 'c1')
      const files = queryKeys.chats.attachments({ programId: 'p1', departmentId: 'd1' }, 'c1')
      for (const key of [d1, d2, none, other, counts, files]) client.setQueryData(key, 1)
      await Promise.all(
        invalidationFilters(operation, { programId: 'p1', departmentId: null }, {}).map((filter) =>
          client.invalidateQueries(filter),
        ),
      )
      for (const key of [d1, d2, none]) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
      for (const key of [other, counts, files]) {
        expect(client.getQueryState(key)?.isInvalidated).toBe(false)
      }
    },
  )
})
