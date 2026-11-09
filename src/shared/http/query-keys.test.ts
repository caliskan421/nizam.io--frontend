import { QueryClient, type QueryKey } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { OPERATIONS } from '@/shared/api/operations.gen'
import { globalKey, scopedKey, type ScopeSnapshot } from '@/shared/scope/scope'
import { STANDING_KEYS } from '@/shared/scope/standing'

import {
  INVALIDATED_BY,
  invalidationFilters,
  isScopedQueryKey,
  queryKeys,
  resourcesInvalidatedBy,
  scoped,
  type OperationId,
  type QueryResource,
} from './query-keys'

const S: ScopeSnapshot = { programId: 'p1', departmentId: 'd1' }
const OTHER: ScopeSnapshot = { programId: 'p2', departmentId: null }
const root = (s: ScopeSnapshot) => ['nizamio', { program: s.programId, department: s.departmentId }]
const f = { status: 'yeni' }

/**
 * ortak-kurallar.md §6 tablosu: kaynak → beklenen anahtar → tablodaki geçersizleyen mutasyonlar
 * (en az bunlar; fazlası güvenli).
 */
const TABLE: Array<{
  resource: QueryResource
  key: QueryKey
  expected: readonly unknown[]
  mustInvalidate: readonly OperationId[]
}> = [
  {
    resource: 'instance.profile',
    key: queryKeys.instance.profile(),
    expected: ['instance', 'profile'],
    mustInvalidate: [],
  },
  {
    resource: 'notifications.unreadCount',
    key: queryKeys.notifications.unreadCount(),
    expected: ['notifications', 'unread-count'],
    mustInvalidate: ['markNotificationRead', 'markAllNotificationsRead'],
  },
  {
    resource: 'chats.unreadOverview',
    key: queryKeys.chatsUnread.overview(),
    expected: ['chats', 'unread-overview'],
    mustInvalidate: ['markChatRead', 'markAllChatsRead'],
  },
  {
    resource: 'programs',
    key: queryKeys.programs.all(),
    expected: ['programs'],
    mustInvalidate: ['createProgram', 'resetProgram', 'transferWorkItems'],
  },
  {
    resource: 'me',
    key: queryKeys.me.departments(),
    expected: ['me', 'departments'],
    mustInvalidate: ['assignMembership', 'updateMembershipRole', 'removeMember'],
  },
  {
    resource: 'departments',
    key: queryKeys.departments.all(S),
    expected: [...root(S), 'departments'],
    mustInvalidate: [
      'linkDepartment',
      'unlinkDepartment',
      'renameDepartmentLink',
      'updateDepartment',
    ],
  },
  {
    resource: 'departments.members',
    key: queryKeys.departments.members(S, 'd2'),
    expected: [...root(S), 'departments', 'd2', 'members'],
    mustInvalidate: [
      'assignMembership',
      'updateMembershipRole',
      'removeMember',
      'deleteAccount',
      'createUser',
    ],
  },
  {
    resource: 'departments.assignable',
    key: queryKeys.departments.assignable(S, 'd2'),
    expected: [...root(S), 'departments', 'd2', 'assignable'],
    mustInvalidate: ['assignMembership', 'removeMember', 'createUser', 'deleteUser'],
  },
  {
    resource: 'catalog.departments',
    key: queryKeys.catalog.departments(),
    expected: ['catalog', 'departments'],
    mustInvalidate: ['createDepartment', 'updateDepartment', 'deleteDepartment'],
  },
  {
    resource: 'deletedDepartments',
    key: queryKeys.deletedDepartments.all(S),
    expected: [...root(S), 'deleted-departments'],
    mustInvalidate: ['deleteDepartment', 'restoreDepartment'],
  },
  {
    resource: 'workItems.list',
    key: queryKeys.workItems.list(S, f),
    expected: [...root(S), 'work-items', f],
    mustInvalidate: [
      'createWorkItem',
      'updateWorkItem',
      'deleteWorkItem',
      'transitionWorkItem',
      'addAssignments',
      'removeAssignment',
      'extendWorkItem',
      'requestDateChange',
      'reviewDateChangeRequest',
    ],
  },
  {
    resource: 'workItems.item',
    key: queryKeys.workItems.item(S, 'w1'),
    expected: [...root(S), 'work-items', 'w1'],
    mustInvalidate: ['createWorkItem', 'updateWorkItem', 'deleteWorkItem', 'transitionWorkItem'],
  },
  {
    resource: 'workItems.subtasks',
    key: queryKeys.workItems.subtasks(S, 'w1'),
    expected: [...root(S), 'work-items', 'w1', 'subtasks'],
    mustInvalidate: ['createWorkItemSubtask', 'updateWorkItemSubtask', 'deleteWorkItemSubtask'],
  },
  {
    resource: 'workItems.notes',
    key: queryKeys.workItems.notes(S, 'w1'),
    expected: [...root(S), 'work-items', 'w1', 'notes'],
    mustInvalidate: ['addWorkItemNote', 'updateWorkItemNote', 'deleteWorkItemNote'],
  },
  {
    resource: 'workItems.files',
    key: queryKeys.workItems.files(S, 'w1'),
    expected: [...root(S), 'work-items', 'w1', 'files'],
    mustInvalidate: ['attachFile', 'renameFile', 'deleteFile'],
  },
  {
    resource: 'gantt',
    key: queryKeys.gantt.face(S, 'program'),
    expected: [...root(S), 'gantt', 'program'],
    mustInvalidate: ['updateWorkItem', 'extendWorkItem', 'addDependency', 'removeDependency'],
  },
  {
    resource: 'dateRequests',
    key: queryKeys.dateRequests.list(S, f),
    expected: [...root(S), 'date-requests', f],
    mustInvalidate: ['requestDateChange', 'reviewDateChangeRequest', 'deleteDateChangeRequest'],
  },
  {
    resource: 'report',
    key: queryKeys.report.coordinatorships(S),
    expected: [...root(S), 'report', 'dashboard', 'coordinatorships'],
    mustInvalidate: [],
  },
  {
    resource: 'archive',
    key: queryKeys.archive.list(S, 'attachments', f),
    expected: [...root(S), 'archive', 'attachments', f],
    mustInvalidate: ['attachFile', 'renameFile', 'deleteFile'],
  },
  {
    resource: 'meetings',
    key: queryKeys.meetings.agenda(S, 'm1'),
    expected: [...root(S), 'meetings', 'm1', 'agenda'],
    mustInvalidate: [
      'createMeeting',
      'updateMeeting',
      'addAgendaItem',
      'updateMeetingNote',
      'addMeetingParticipant',
    ],
  },
  {
    resource: 'chats',
    key: queryKeys.chats.messages(S, 'c1'),
    expected: [...root(S), 'chats', 'c1', 'messages'],
    mustInvalidate: ['sendChatMessage', 'createGroupChat', 'deleteChat'],
  },
  {
    resource: 'users',
    key: queryKeys.users.list(f),
    expected: ['users', f],
    mustInvalidate: ['createUser', 'updateAccount', 'removeMember'],
  },
]

/** Geçersizleme filtrelerinin gerçek TanStack önbelleğinde hangi anahtarları vurduğu. */
function hits(operation: OperationId, keys: QueryKey[], ctx = {}): QueryKey[] {
  const client = new QueryClient()
  for (const key of keys) client.setQueryData(key, 1)
  for (const filter of invalidationFilters(operation, S, ctx)) void client.invalidateQueries(filter)
  return keys.filter((key) => client.getQueryState(key)?.isInvalidated)
}

describe('query-keys — §6 tablosu', () => {
  it('tablo her kaynağı kapsar', () => {
    expect(TABLE.map((row) => row.resource).sort()).toEqual(Object.keys(INVALIDATED_BY).sort())
  })

  it.each(TABLE)('$resource: anahtar biçimi', ({ key, expected }) => {
    expect(key).toEqual(expected)
  })

  it.each(TABLE)('$resource: tablodaki mutasyonlar geçersizler', ({ resource, mustInvalidate }) => {
    for (const op of mustInvalidate) expect(resourcesInvalidatedBy(op), op).toContain(resource)
  })

  it.each(TABLE.filter((row) => row.resource !== 'report' && row.resource !== 'instance.profile'))(
    '$resource: geçersizleme filtresi bu anahtarı gerçekten vurur',
    ({ key, mustInvalidate }) => {
      const op = mustInvalidate[0]!
      expect(hits(op, [key], { workItemId: 'w1' }), op).toEqual([key])
    },
  )

  it('kurulum profili ve pano hiçbir yazmayla geçersizlenmez', () => {
    expect(INVALIDATED_BY['instance.profile']).toEqual([])
    expect(INVALIDATED_BY.report).toEqual([])
  })

  it('her operationId sözleşmede var ve yazma ucudur', () => {
    const writes = new Set(
      Object.entries(OPERATIONS)
        .filter(([key]) => !key.startsWith('GET '))
        .map(([, meta]) => meta.operationId),
    )
    for (const [resource, ops] of Object.entries(INVALIDATED_BY)) {
      for (const op of ops) expect(writes.has(op), `${resource}: ${op}`).toBe(true)
    }
  })
})

describe('query-keys — kapsam ve hedef', () => {
  it('kapsamlı anahtarlar scopedKey kökünden; hesap genelileri değil', () => {
    expect(isScopedQueryKey(queryKeys.workItems.all(S))).toBe(true)
    expect(isScopedQueryKey(queryKeys.chats.all(S))).toBe(true)
    expect(isScopedQueryKey(queryKeys.me.root())).toBe(false)
    expect(isScopedQueryKey(queryKeys.users.list({}))).toBe(false)
    expect(isScopedQueryKey(['nizamio', 'global', 'x'])).toBe(false)
  })

  it('üyelik yazması departman ekiplerini geçersizler, departman listesini değil', () => {
    const keys = [
      queryKeys.departments.all(S),
      queryKeys.departments.members(S, 'd1'),
      queryKeys.departments.members(S, 'd2'),
    ]
    expect(hits('assignMembership', keys)).toEqual([keys[1], keys[2]])
    expect(hits('createWorkItem', keys)).toEqual([])
  })

  it('üyelik yazması atanabilir havuzu da geçersizler; katalog ve silinenler S1/ayrı kök', () => {
    const keys = [
      queryKeys.departments.assignable(S, 'd1'),
      queryKeys.catalog.departments(),
      queryKeys.deletedDepartments.all(S),
    ]
    expect(hits('removeMember', keys)).toEqual([keys[0]])
    expect(hits('createDepartment', keys)).toEqual([keys[1]])
    // Katalog silme bağlı departman listesini (önek: ekip ve havuz dahil) de düşürür.
    expect(hits('deleteDepartment', keys)).toEqual(keys)
    expect(isScopedQueryKey(queryKeys.catalog.departments())).toBe(false)
    expect(isScopedQueryKey(queryKeys.deletedDepartments.all(S))).toBe(true)
  })

  it('görev dosyaları 03/03c/06 için tek anahtar', () => {
    expect(queryKeys.workItems.files(S, 'w1')).toEqual(queryKeys.workItems.files(S, 'w1'))
  })

  it('başka kapsamın anahtarları geçersizlenmez', () => {
    const mine = queryKeys.workItems.list(S, f)
    const other = queryKeys.workItems.list(OTHER, f)
    expect(hits('createWorkItem', [mine, other])).toEqual([mine])
  })

  it('görev kimliği verilince yalnız o görev; liste kendi yüklemine göre', () => {
    const keys = [
      queryKeys.workItems.list(S, f),
      queryKeys.workItems.item(S, 'w1'),
      queryKeys.workItems.item(S, 'w2'),
      queryKeys.workItems.notes(S, 'w1'),
      queryKeys.workItems.files(S, 'w1'),
    ]
    expect(hits('updateWorkItem', keys, { workItemId: 'w1' })).toEqual([keys[0], keys[1]])
    // Kimlik yoksa bütün görev kayıtları (alt kaynaklar değil).
    expect(hits('updateWorkItem', keys)).toEqual([keys[0], keys[1], keys[2]])
  })

  it('dosya adı/silme (görev kimliği yok): bütün görev dosyaları + arşiv, görev kaydı değil', () => {
    const keys = [
      queryKeys.workItems.files(S, 'w1'),
      queryKeys.workItems.files(S, 'w2'),
      queryKeys.workItems.item(S, 'w1'),
      queryKeys.archive.list(S, 'folders', {}),
    ]
    expect(hits('renameFile', keys)).toEqual([keys[0], keys[1], keys[3]])
  })

  it("['me'] öneki departmanlarımı da kapsar", () => {
    const keys = [queryKeys.me.root(), queryKeys.me.departments(), queryKeys.programs.all()]
    expect(hits('removeCoordinator', keys)).toEqual([keys[0], keys[1]])
  })
})

describe('query-keys — W13 kapsam katmanıyla tekilleştirme', () => {
  const lensed: ScopeSnapshot = { programId: 'p1', departmentId: 'd1', lens: 'coordinator' }
  const scopedKeys: QueryKey[] = [
    queryKeys.departments.all(lensed),
    queryKeys.workItems.list(lensed, f),
    queryKeys.workItems.item(lensed, 'w1'),
    queryKeys.workItems.files(lensed, 'w1'),
    queryKeys.gantt.face(lensed, 'program'),
    queryKeys.dateRequests.list(lensed, f),
    queryKeys.report.dashboard(lensed),
    queryKeys.archive.list(lensed, 'folders', f),
    queryKeys.meetings.notes(lensed, 'm1'),
    queryKeys.chats.messages(lensed, 'c1'),
  ]
  const accountKeys: QueryKey[] = [
    queryKeys.instance.profile(),
    queryKeys.notifications.unreadCount(),
    queryKeys.chatsUnread.overview(),
    queryKeys.programs.all(),
    queryKeys.me.root(),
    queryKeys.me.departments(),
    queryKeys.users.list(f),
  ]

  it('scoped() scopedKey() üzerine kuruludur (mercek dahil)', () => {
    expect(scoped(lensed, ['work-items', 'w1'])).toEqual(scopedKey(lensed, 'work-items', 'w1'))
    expect(queryKeys.workItems.item(lensed, 'w1')[1]).toEqual({
      program: 'p1',
      department: 'd1',
      lens: 'coordinator',
    })
  })

  it('isScopedQueryKey (lifecycle temizliğinin predicate’i) yalnız scopedKey anahtarlarını seçer', () => {
    for (const key of scopedKeys) expect(isScopedQueryKey(key), String(key[2])).toBe(true)
    expect(isScopedQueryKey(scopedKey({ programId: 'p1', departmentId: null }, 'x'))).toBe(true)
    for (const key of accountKeys) expect(isScopedQueryKey(key), String(key[0])).toBe(false)
    expect(isScopedQueryKey(globalKey('x'))).toBe(false)
    expect(isScopedQueryKey(['nizamio', ['program']])).toBe(false)
  })

  it('kapsam temizliği (lifecycle predicate) yalnız scoped anahtarları düşürür', () => {
    const client = new QueryClient()
    for (const key of [...scopedKeys, ...accountKeys]) client.setQueryData(key, 1)
    client.removeQueries({ predicate: (q) => isScopedQueryKey(q.queryKey) })
    const left = client
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
    expect(left).toHaveLength(accountKeys.length)
    expect(left).toEqual(expect.arrayContaining(accountKeys))
  })

  it('standing anahtarları fabrikadan gelir', () => {
    expect(STANDING_KEYS.me).toEqual(queryKeys.me.root())
    expect(STANDING_KEYS.myDepartments).toEqual(queryKeys.me.departments())
    expect(STANDING_KEYS.programs).toEqual(queryKeys.programs.all())
  })
})
