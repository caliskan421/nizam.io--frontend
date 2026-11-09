/**
 * Tek sorgu anahtarı fabrikası (docs/ekranlar/ortak-kurallar.md §6, CX-T-01).
 *
 * Gruplar anahtarı kendisi yazmaz; buradan başvurur. İki tür anahtar vardır:
 *  - **Hesap geneli** (S0/S1, kapsamdan bağımsız): §6 tablosundaki dizi birebir
 *    (`['me']`, `['programs']`, `['users', filters]` …).
 *  - **Kapsamlı** (`scoped(...)`): `scopedKey()` üzerine kurulur; anahtar
 *    `['nizamio', {program, department}, ...parça]` biçimindedir. Kapsam değişince bu kökle
 *    başlayan bütün sorgular iptal edilip önbellekten düşer (K2) — `isScopedQueryKey`.
 *
 * Geçersizleme: `INVALIDATED_BY` her kaynağın §6 "geçersizleyen mutasyonlar" sütununu
 * operationId listesi olarak tutar; `invalidationFilters()` bir mutasyon için TanStack
 * filtrelerini üretir. Yazma sonrası yeniden okuma budur; iyimser güncelleme yoktur (§7).
 */
import type { QueryKey } from '@tanstack/vue-query'

import type { OperationMeta } from '@/shared/api/operations.gen'
import { QUERY_KEY_ROOT, scopedKey, type ScopeSnapshot } from '@/shared/scope/scope'

export type OperationId = OperationMeta['operationId']
export type QueryFilters = Record<string, unknown>
type Part = string | number | QueryFilters

/** Kapsamlı anahtar: `scoped(scope, ['work-items', id])`. */
export function scoped(scope: ScopeSnapshot, parts: ReadonlyArray<Part>): QueryKey {
  return scopedKey(scope, ...parts)
}

/**
 * Anahtar `scoped(...)`/`scopedKey(...)` ile mi üretildi (kapsam değişiminde iptal + düşürme
 * hedefi)? TEK tanım; kapsam temizliği (`shared/scope/lifecycle.ts`) doğrudan buradan alır.
 * Bağımlılık tek yönlüdür: query-keys → scope (`scopedKey`); scope http'yi içe aktarmaz.
 */
export function isScopedQueryKey(key: readonly unknown[]): boolean {
  const head = key[1]
  return (
    key[0] === QUERY_KEY_ROOT &&
    typeof head === 'object' &&
    head !== null &&
    !Array.isArray(head) &&
    'program' in head
  )
}

export type ArchiveFacet = 'folders' | 'tasks' | 'attachments' | 'uploaders'

/** §6 tablosu: kaynak → anahtar. */
export const queryKeys = {
  instance: { profile: () => ['instance', 'profile'] as const },
  notifications: { unreadCount: () => ['notifications', 'unread-count'] as const },
  chatsUnread: { overview: () => ['chats', 'unread-overview'] as const },
  programs: { all: () => ['programs'] as const },
  me: {
    root: () => ['me'] as const,
    departments: () => ['me', 'departments'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (filters: QueryFilters) => ['users', filters] as const,
  },
  departments: {
    all: (s: ScopeSnapshot) => scoped(s, ['departments']),
    /** `listMembers` — departmanın seçili programdaki ekibi (görev atama adayları). */
    members: (s: ScopeSnapshot, departmentId: string) =>
      scoped(s, ['departments', departmentId, 'members']),
  },
  workItems: {
    all: (s: ScopeSnapshot) => scoped(s, ['work-items']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['work-items', filters]),
    item: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id]),
    subtasks: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'subtasks']),
    notes: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'notes']),
    /** 03, 03c ve 06 AYNI anahtarı kullanır. */
    files: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'files']),
  },
  gantt: {
    all: (s: ScopeSnapshot) => scoped(s, ['gantt']),
    face: (s: ScopeSnapshot, face: string) => scoped(s, ['gantt', face]),
  },
  dateRequests: {
    all: (s: ScopeSnapshot) => scoped(s, ['date-requests']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['date-requests', filters]),
  },
  report: {
    dashboard: (s: ScopeSnapshot) => scoped(s, ['report', 'dashboard']),
    coordinatorships: (s: ScopeSnapshot) => scoped(s, ['report', 'dashboard', 'coordinatorships']),
  },
  archive: {
    all: (s: ScopeSnapshot) => scoped(s, ['archive']),
    list: (s: ScopeSnapshot, facet: ArchiveFacet, filters: QueryFilters) =>
      scoped(s, ['archive', facet, filters]),
  },
  meetings: {
    all: (s: ScopeSnapshot) => scoped(s, ['meetings']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['meetings', filters]),
    item: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', id]),
    agenda: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', id, 'agenda']),
    notes: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', id, 'notes']),
  },
  chats: {
    all: (s: ScopeSnapshot) => scoped(s, ['chats']),
    messages: (s: ScopeSnapshot, id: string) => scoped(s, ['chats', id, 'messages']),
  },
} as const

/** §6 satırları (geçersizleme birimi). */
export type QueryResource =
  | 'instance.profile'
  | 'notifications.unreadCount'
  | 'chats.unreadOverview'
  | 'programs'
  | 'me'
  | 'departments'
  | 'departments.members'
  | 'workItems.list'
  | 'workItems.item'
  | 'workItems.subtasks'
  | 'workItems.notes'
  | 'workItems.files'
  | 'gantt'
  | 'dateRequests'
  | 'report'
  | 'archive'
  | 'meetings'
  | 'chats'
  | 'users'

// "Görev oluştur/güncelle/sil/geçiş/ata; tarih uçları" (§6 görev satırları).
const WORK_ITEM_WRITES = [
  'createWorkItem',
  'updateWorkItem',
  'deleteWorkItem',
  'transitionWorkItem',
  'ownStatusWorkItem',
  'addAssignments',
  'removeAssignment',
  'claimWorkItem',
  'unclaimWorkItem',
  'restoreWorkItem',
  'permanentDeleteWorkItem',
  'transferWorkItems',
  'convertNoteToTask',
  'createTaskFromChatMessage',
] as const satisfies readonly OperationId[]

// Görev tarihini değiştiren uçlar (istemci-akislari §6, §8 "dates_revision").
const DATE_WRITES = [
  'updateWorkItem',
  'extendWorkItem',
  'pullEndDate',
  'pullCompletion',
  'setCompletionDate',
  'requestDateChange',
  'reviewDateChangeRequest',
  'deleteDateChangeRequest',
] as const satisfies readonly OperationId[]

const SUBTASK_WRITES = [
  'createWorkItemSubtask',
  'updateWorkItemSubtask',
  'deleteWorkItemSubtask',
] as const satisfies readonly OperationId[]

const NOTE_WRITES = [
  'addWorkItemNote',
  'updateWorkItemNote',
  'deleteWorkItemNote',
] as const satisfies readonly OperationId[]

const FILE_WRITES = [
  'attachFile',
  'renameFile',
  'deleteFile',
] as const satisfies readonly OperationId[]

const DEPENDENCY_WRITES = [
  'addDependency',
  'removeDependency',
] as const satisfies readonly OperationId[]

const MEMBERSHIP_WRITES = [
  'assignMembership',
  'updateMembershipRole',
  'removeMember',
  'assignCoordinator',
  'removeCoordinator',
] as const satisfies readonly OperationId[]

const unique = (...lists: ReadonlyArray<readonly OperationId[]>): readonly OperationId[] => [
  ...new Set(lists.flat()),
]

/**
 * §6 "Geçersizleyen mutasyonlar" sütunu (operationId). Tabloda adı geçmeyen ama aynı kaydı
 * değiştiren uçlar (geri yükleme, kalıcı silme, aktarım, nottan/mesajdan görev) satırın
 * kaynağına eklendi; fazla geçersizleme güvenlidir, eksik geçersizleme bayat veri gösterir.
 */
export const INVALIDATED_BY: Readonly<Record<QueryResource, readonly OperationId[]>> = {
  // Yalnız yeniden yükleme.
  'instance.profile': [],
  'notifications.unreadCount': ['markNotificationRead', 'markAllNotificationsRead'],
  'chats.unreadOverview': ['markChatRead', 'markAllChatsRead'],
  programs: [
    'createProgram',
    'updateProgram',
    'deleteProgram',
    'resetProgram',
    'transferWorkItems',
  ],
  // K6 yetki kaybı ayrıca standing katmanında; burada üyelik değişiklikleri.
  me: MEMBERSHIP_WRITES,
  departments: [
    'linkDepartment',
    'unlinkDepartment',
    'renameDepartmentLink',
    'restoreDepartment',
    'permanentDeleteDepartment',
  ],
  // Ekip satırı ve hesap durumu (`status: deleted`) değiştiren uçlar.
  'departments.members': unique(MEMBERSHIP_WRITES, [
    'deleteAccount',
    'restoreAccount',
    'permanentDeleteAccount',
    'deleteUser',
  ]),
  'workItems.list': unique(WORK_ITEM_WRITES, DATE_WRITES, SUBTASK_WRITES),
  'workItems.item': unique(WORK_ITEM_WRITES, DATE_WRITES, SUBTASK_WRITES, ['attachFile']),
  'workItems.subtasks': unique(SUBTASK_WRITES, ['transitionWorkItem', 'removeAssignment']),
  'workItems.notes': NOTE_WRITES,
  'workItems.files': unique(FILE_WRITES, ['deleteWorkItemSubtask']),
  gantt: unique(DATE_WRITES, DEPENDENCY_WRITES, ['createWorkItem', 'deleteWorkItem']),
  dateRequests: ['requestDateChange', 'reviewDateChangeRequest', 'deleteDateChangeRequest'],
  // Yazma sonrası geçersizleme yok; odakta tazele.
  report: [],
  archive: FILE_WRITES,
  meetings: [
    'createMeeting',
    'updateMeeting',
    'deleteMeeting',
    'restoreMeeting',
    'permanentDeleteMeeting',
    'addAgendaItem',
    'updateAgendaItem',
    'deleteAgendaItem',
    'addMeetingNote',
    'updateMeetingNote',
    'deleteMeetingNote',
    'convertNoteToTask',
    'addMeetingParticipant',
    'removeMeetingParticipant',
    'startConference',
    'endConference',
  ],
  chats: [
    'openDirectChat',
    'createGroupChat',
    'updateChat',
    'deleteChat',
    'grantChatAdmin',
    'revokeChatAdmin',
    'addChatMembers',
    'removeChatMember',
    'sendChatMessage',
    'sendChatAttachment',
    'editChatMessage',
    'deleteChatMessage',
    'pinChatMessage',
    'unpinChatMessage',
    'closeChatPoll',
    'voteChatPoll',
    'setChatReaction',
    'deleteChatReaction',
    'createTaskFromChatMessage',
    'markChatRead',
    'markAllChatsRead',
  ],
  users: unique(
    [
      'createUser',
      'updateUser',
      'deleteUser',
      'openAccount',
      'updateAccount',
      'deleteAccount',
      'unlockAccount',
      'restoreAccount',
      'permanentDeleteAccount',
      'resetLockouts',
    ],
    MEMBERSHIP_WRITES,
  ),
}

/** Mutasyonun hedef kaydı; verilmezse ilgili kaynağın kapsamdaki bütün kayıtları geçersizlenir. */
export interface InvalidationContext {
  workItemId?: string
}

/** TanStack `invalidateQueries` filtresi (yalnız kullandığımız alanlar). */
export interface InvalidationFilter {
  queryKey: QueryKey
  exact?: boolean
  predicate?: (query: { queryKey: QueryKey }) => boolean
}

const isFiltersPart = (part: unknown): boolean =>
  typeof part === 'object' && part !== null && !Array.isArray(part)

/** `scoped(['work-items', id, <alt>])` biçimli anahtarlar (alt = subtasks | notes | files). */
function workItemChild(scope: ScopeSnapshot, child: string, id?: string): InvalidationFilter {
  if (id !== undefined) return { queryKey: scoped(scope, ['work-items', id, child]), exact: true }
  return {
    queryKey: queryKeys.workItems.all(scope),
    predicate: ({ queryKey }) => queryKey.length === 5 && queryKey[4] === child,
  }
}

type FilterBuilder = (scope: ScopeSnapshot, ctx: InvalidationContext) => InvalidationFilter | null

const prefix =
  (key: (scope: ScopeSnapshot) => QueryKey): FilterBuilder =>
  (scope) => ({ queryKey: key(scope) })

/** Kaynak → filtre eşlemesi (§6). null: yazma sonrası geçersizleme yok. */
const FILTERS: Readonly<Record<QueryResource, FilterBuilder>> = {
  'instance.profile': () => null,
  report: () => null,
  'notifications.unreadCount': prefix(() => queryKeys.notifications.unreadCount()),
  'chats.unreadOverview': prefix(() => queryKeys.chatsUnread.overview()),
  programs: prefix(() => queryKeys.programs.all()),
  // ['me'] öneki ['me','departments']'ı da kapsar.
  me: prefix(() => queryKeys.me.root()),
  users: prefix(() => queryKeys.users.all()),
  departments: prefix(queryKeys.departments.all),
  'departments.members': (scope) => ({
    queryKey: queryKeys.departments.all(scope),
    predicate: ({ queryKey }) => queryKey.length === 5 && queryKey[4] === 'members',
  }),
  'workItems.list': (scope) => ({
    queryKey: queryKeys.workItems.all(scope),
    predicate: ({ queryKey }) => queryKey.length === 4 && isFiltersPart(queryKey[3]),
  }),
  'workItems.item': (scope, ctx) =>
    ctx.workItemId !== undefined
      ? { queryKey: queryKeys.workItems.item(scope, ctx.workItemId), exact: true }
      : {
          queryKey: queryKeys.workItems.all(scope),
          predicate: ({ queryKey }) => queryKey.length === 4 && typeof queryKey[3] === 'string',
        },
  'workItems.subtasks': (scope, ctx) => workItemChild(scope, 'subtasks', ctx.workItemId),
  'workItems.notes': (scope, ctx) => workItemChild(scope, 'notes', ctx.workItemId),
  'workItems.files': (scope, ctx) => workItemChild(scope, 'files', ctx.workItemId),
  gantt: prefix(queryKeys.gantt.all),
  dateRequests: prefix(queryKeys.dateRequests.all),
  archive: prefix(queryKeys.archive.all),
  meetings: prefix(queryKeys.meetings.all),
  chats: prefix(queryKeys.chats.all),
}

/** Bir mutasyonun geçersizlediği §6 kaynakları. */
export function resourcesInvalidatedBy(operation: OperationId): QueryResource[] {
  return (Object.keys(INVALIDATED_BY) as QueryResource[]).filter((resource) =>
    INVALIDATED_BY[resource].includes(operation),
  )
}

/** Başarılı bir mutasyondan sonra yeniden okunacak sorguların filtreleri. */
export function invalidationFilters(
  operation: OperationId,
  scope: ScopeSnapshot,
  ctx: InvalidationContext = {},
): InvalidationFilter[] {
  return resourcesInvalidatedBy(operation)
    .map((resource) => FILTERS[resource](scope, ctx))
    .filter((f): f is InvalidationFilter => f !== null)
}
