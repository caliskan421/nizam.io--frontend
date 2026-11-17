/**
 * Silinebilir dokuz kaydın yaşam döngüsü kaydı (v0.26; ADR-0045/0053/0054/0055). Sunucunun
 * birleşik listesindeki `kind` değerleri (`kinds` parametresiyle aynı sözcük), yol adları (toplu
 * uç yolu ve `purge-all` onay değeri), başlık sınıfı ve her işlemin `operationId`'si TEK yerde.
 * Mevcut dört ekran türü (`DeletedKind`) ve URL değerleri değişmez; `viewKind` yalnız eşleme.
 * Bilinmeyen (gelecek) `kind` için `toLifecycleKind` `null` döner: o satıra yazma üretilmez.
 */
import type { OperationId } from '@/shared/http/query-keys'

import type { ListQuery } from './filters'
import type { DeletedKind } from './kinds'

export const LIFECYCLE_KINDS = [
  'tasks',
  'subtasks',
  'files',
  'meetings',
  'task_notes',
  'meeting_notes',
  'agenda_items',
  'departments',
  'accounts',
] as const
export type LifecycleKind = (typeof LIFECYCLE_KINDS)[number]

/** Yeni beş çocuk tür (dosya, alt görev, görev notu, toplantı notu, gündem). */
export const CHILD_KINDS = [
  'files',
  'subtasks',
  'task_notes',
  'meeting_notes',
  'agenda_items',
] as const satisfies readonly LifecycleKind[]
export type ChildKind = (typeof CHILD_KINDS)[number]

export interface LifecycleSpec {
  /** Toplu uç yolu parçası ve `purge-all` onay değeri (`confirm`). */
  path: string
  /** `account`: S1, program başlığı yok; `program`: S2, başlık eylemle dondurulur. */
  scope: 'program' | 'account'
  /** Mevcut ekran türü; çocuk türlerde `null` (W193 görünümü). */
  view: DeletedKind | null
  operations: Readonly<{
    restore: OperationId
    purge: OperationId
    batchRestore: OperationId
    batchPurge: OperationId
    purgeAll: OperationId
  }>
}

export const LIFECYCLE: Readonly<Record<LifecycleKind, LifecycleSpec>> = {
  tasks: {
    path: 'work-items',
    scope: 'program',
    view: 'gorev',
    operations: {
      restore: 'restoreWorkItem',
      purge: 'permanentDeleteWorkItem',
      batchRestore: 'batchRestoreWorkItems',
      batchPurge: 'batchPurgeWorkItems',
      purgeAll: 'purgeAllWorkItems',
    },
  },
  subtasks: {
    path: 'subtasks',
    scope: 'program',
    view: null,
    operations: {
      restore: 'restoreSubtask',
      purge: 'permanentDeleteSubtask',
      batchRestore: 'batchRestoreSubtasks',
      batchPurge: 'batchPurgeSubtasks',
      purgeAll: 'purgeAllSubtasks',
    },
  },
  files: {
    path: 'files',
    scope: 'program',
    view: null,
    operations: {
      restore: 'restoreFile',
      purge: 'permanentDeleteFile',
      batchRestore: 'batchRestoreFiles',
      batchPurge: 'batchPurgeFiles',
      purgeAll: 'purgeAllFiles',
    },
  },
  meetings: {
    path: 'meetings',
    scope: 'program',
    view: 'toplanti',
    operations: {
      restore: 'restoreMeeting',
      purge: 'permanentDeleteMeeting',
      batchRestore: 'batchRestoreMeetings',
      batchPurge: 'batchPurgeMeetings',
      purgeAll: 'purgeAllMeetings',
    },
  },
  task_notes: {
    path: 'task-notes',
    scope: 'program',
    view: null,
    operations: {
      restore: 'restoreTaskNote',
      purge: 'permanentDeleteTaskNote',
      batchRestore: 'batchRestoreTaskNotes',
      batchPurge: 'batchPurgeTaskNotes',
      purgeAll: 'purgeAllTaskNotes',
    },
  },
  meeting_notes: {
    path: 'meeting-notes',
    scope: 'program',
    view: null,
    operations: {
      restore: 'restoreMeetingNote',
      purge: 'permanentDeleteMeetingNote',
      batchRestore: 'batchRestoreMeetingNotes',
      batchPurge: 'batchPurgeMeetingNotes',
      purgeAll: 'purgeAllMeetingNotes',
    },
  },
  agenda_items: {
    path: 'agenda-items',
    scope: 'program',
    view: null,
    operations: {
      restore: 'restoreAgendaItem',
      purge: 'permanentDeleteAgendaItem',
      batchRestore: 'batchRestoreAgendaItems',
      batchPurge: 'batchPurgeAgendaItems',
      purgeAll: 'purgeAllAgendaItems',
    },
  },
  departments: {
    path: 'departments',
    scope: 'program',
    view: 'koordinatorluk',
    operations: {
      restore: 'restoreDepartment',
      purge: 'permanentDeleteDepartment',
      batchRestore: 'batchRestoreDepartments',
      batchPurge: 'batchPurgeDepartments',
      purgeAll: 'purgeAllDepartments',
    },
  },
  accounts: {
    path: 'accounts',
    scope: 'account',
    view: 'kullanici',
    operations: {
      restore: 'restoreAccount',
      purge: 'permanentDeleteAccount',
      batchRestore: 'batchRestoreAccounts',
      batchPurge: 'batchPurgeAccounts',
      purgeAll: 'purgeAllAccounts',
    },
  },
}

/** Sunucu `kind` dizesi → bilinen tür; bilinmeyen (gelecek) değer `null`: yazma yok. */
export function toLifecycleKind(kind: string): LifecycleKind | null {
  return (LIFECYCLE_KINDS as readonly string[]).includes(kind) ? (kind as LifecycleKind) : null
}

export function isChildKind(kind: LifecycleKind): kind is ChildKind {
  return (CHILD_KINDS as readonly string[]).includes(kind)
}

/** Mevcut ekran türü → kayıt türü (dört tür). */
export function lifecycleOf(view: DeletedKind): LifecycleKind {
  const found = LIFECYCLE_KINDS.find((kind) => LIFECYCLE[kind].view === view)
  return found as LifecycleKind
}

/** S2 başlıklı türler (program başlığı gerekir); hesap S1'dir. */
export function needsProgram(kind: LifecycleKind): boolean {
  return LIFECYCLE[kind].scope === 'program'
}

/**
 * Birleşik listenin `kinds` parametresi: boş küme "parametre yok" (= hepsi) değil `undefined`
 * döndürür; bilinmeyen değer elenir. Sunucu sırası ve virgüllü biçim değişmez.
 */
export function kindsParam(kinds: readonly LifecycleKind[] | undefined): string | undefined {
  if (!kinds || kinds.length === 0) return undefined
  return kinds.join(',')
}

/** Birleşik listenin sunucu sorgusu: sıra yoktur (`sort`/`order` gönderilmez); `kinds` türleri seçer. */
export interface UnifiedQuery extends Omit<ListQuery, 'sort' | 'order'> {
  kinds?: readonly LifecycleKind[]
}
