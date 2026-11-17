/**
 * Dokuz yazma türünün tüm yaşam döngüsü yazmaları TEK yerde (kurulumda, setup): tekil geri
 * yükle / kalıcı sil, toplu (≤100) ve çöpü boşalt (≤50). Eski dört tür için mevcut hook'lar, beş
 * çocuk tür için `useChildLifecycleWrites`, koordinatörlük çöpü için `usePurgeAllDepartments`
 * (`scope=program` açık). Satırın GERÇEK türüne gider; `Tümü`/`Not ve gündem` görünümleri hiçbir
 * zaman yazma türü değildir. S2 hedefi eylemin dondurulmuş program başlığıyla, hesap (S1) başlıksız
 * gider. Hook'lar yalnız burada çağrılır; olay/callback içinde hook yoktur.
 */
import { computed, type Ref } from 'vue'

import { usePermanentDeleteMeeting, useRestoreMeeting } from '@/modules/meetings/public'
import type { ActionContext, MutationOutcome } from '@/shared/http/mutation'

import {
  useBatchPurgeAccounts,
  useBatchPurgeDepartments,
  useBatchPurgeMeetings,
  useBatchPurgeWorkItems,
  useBatchRestoreAccounts,
  useBatchRestoreDepartments,
  useBatchRestoreMeetings,
  useBatchRestoreWorkItems,
} from '../api/batch-writes'
import { useChildLifecycleWrites } from '../api/lifecycle-writes'
import {
  usePurgeAllAccounts,
  usePurgeAllDepartments,
  usePurgeAllMeetings,
  usePurgeAllWorkItems,
} from '../api/purge-all'
import {
  usePermanentDeleteAccount,
  usePermanentDeleteDepartment,
  usePermanentDeleteWorkItem,
  useRestoreAccount,
  useRestoreDepartment,
  useRestoreWorkItem,
} from '../api/writes'
import type { LifecycleKind } from '../model/lifecycle'
import type { LifecycleAction } from '../model/outcome'
import type { DeletedBatchResult, PurgeAllTarget } from '../model/types'

export type LifecycleOutcome = MutationOutcome<unknown, unknown, unknown>
export type BatchOutcome = MutationOutcome<unknown, DeletedBatchResult, unknown>
export type PurgeAllOutcome = MutationOutcome<PurgeAllTarget, DeletedBatchResult, unknown>
type PurgeContext = NonNullable<Extract<PurgeAllOutcome, { kind: 'success' }>['context']>

type Send = (id: string, programId: string, context: ActionContext) => Promise<LifecycleOutcome>
type SendBatch = (ids: string[], programId: string, context: ActionContext) => Promise<BatchOutcome>
export type SendPurgeAll = (
  target: PurgeAllTarget,
  opts: { context?: PurgeContext },
) => Promise<PurgeAllOutcome>

interface Pending {
  isPending: Ref<boolean>
}
interface Submits<V, D> extends Pending {
  submit: (vars: V, opts?: { context?: ActionContext }) => Promise<MutationOutcome<V, D, unknown>>
}
type ProgramId = { programId: string; id: string }
type ProgramIds = { programId: string; ids: string[] }

const s2 =
  <D>(write: Submits<ProgramId, D>): Send =>
  (id, programId, context) =>
    write.submit({ programId, id }, { context })
const s1 =
  <D>(write: Submits<{ id: string }, D>): Send =>
  (id, _programId, context) =>
    write.submit({ id }, { context })
const batchOf =
  (write: Submits<ProgramIds, DeletedBatchResult>): SendBatch =>
  (ids, programId, context) =>
    write.submit({ programId, ids }, { context })

/** Bütün yazma hook'ları (kurulumda, tek yerde). */
function useWrites() {
  return {
    task: { restore: useRestoreWorkItem(), purge: usePermanentDeleteWorkItem() },
    meeting: { restore: useRestoreMeeting(), purge: usePermanentDeleteMeeting() },
    department: { restore: useRestoreDepartment(), purge: usePermanentDeleteDepartment() },
    account: { restore: useRestoreAccount(), purge: usePermanentDeleteAccount() },
    child: useChildLifecycleWrites(),
    batch: {
      tasks: { restore: useBatchRestoreWorkItems(), purge: useBatchPurgeWorkItems() },
      meetings: { restore: useBatchRestoreMeetings(), purge: useBatchPurgeMeetings() },
      departments: { restore: useBatchRestoreDepartments(), purge: useBatchPurgeDepartments() },
      accounts: { restore: useBatchRestoreAccounts(), purge: useBatchPurgeAccounts() },
    },
    purgeAll: {
      tasks: usePurgeAllWorkItems(),
      meetings: usePurgeAllMeetings(),
      departments: usePurgeAllDepartments(),
      accounts: usePurgeAllAccounts(),
    },
  }
}
type Writes = ReturnType<typeof useWrites>

function singles({ task, meeting, department, account, child }: Writes) {
  const pair = (write: {
    restore: Submits<ProgramId, unknown>
    purge: Submits<ProgramId, unknown>
  }) => ({
    restore: s2(write.restore),
    purge: s2(write.purge),
  })
  const table: Record<LifecycleKind, Record<LifecycleAction, Send>> = {
    tasks: pair(task),
    meetings: pair(meeting),
    departments: pair(department),
    accounts: { restore: s1(account.restore), purge: s1(account.purge) },
    subtasks: pair(child.subtasks),
    files: pair(child.files),
    task_notes: pair(child.task_notes),
    meeting_notes: pair(child.meeting_notes),
    agenda_items: pair(child.agenda_items),
  }
  return table
}

function manies({ batch, child }: Writes) {
  const pair = (
    restore: Submits<ProgramIds, DeletedBatchResult>,
    purge: Submits<ProgramIds, DeletedBatchResult>,
  ) => ({
    restore: batchOf(restore),
    purge: batchOf(purge),
  })
  const table: Record<LifecycleKind, Record<LifecycleAction, SendBatch>> = {
    tasks: pair(batch.tasks.restore, batch.tasks.purge),
    meetings: pair(batch.meetings.restore, batch.meetings.purge),
    departments: pair(batch.departments.restore, batch.departments.purge),
    accounts: pair(batch.accounts.restore, batch.accounts.purge),
    subtasks: pair(child.subtasks.batchRestore, child.subtasks.batchPurge),
    files: pair(child.files.batchRestore, child.files.batchPurge),
    task_notes: pair(child.task_notes.batchRestore, child.task_notes.batchPurge),
    meeting_notes: pair(child.meeting_notes.batchRestore, child.meeting_notes.batchPurge),
    agenda_items: pair(child.agenda_items.batchRestore, child.agenda_items.batchPurge),
  }
  return table
}

function purgeAlls({ purgeAll, child }: Writes) {
  const table: Record<LifecycleKind, SendPurgeAll> = {
    tasks: purgeAll.tasks.submit,
    meetings: purgeAll.meetings.submit,
    departments: purgeAll.departments.submit,
    accounts: purgeAll.accounts.submit,
    subtasks: child.subtasks.purgeAll.submit,
    files: child.files.purgeAll.submit,
    task_notes: child.task_notes.purgeAll.submit,
    meeting_notes: child.meeting_notes.purgeAll.submit,
    agenda_items: child.agenda_items.purgeAll.submit,
  }
  return table
}

export function useLifecycleHub() {
  const writes = useWrites()
  const all: Pending[] = [
    ...Object.values(writes.task),
    ...Object.values(writes.meeting),
    ...Object.values(writes.department),
    ...Object.values(writes.account),
    ...Object.values(writes.batch).flatMap((pair) => Object.values(pair)),
    ...Object.values(writes.purgeAll),
    ...Object.values(writes.child).flatMap((set) => Object.values(set)),
  ]
  const pending = computed(() => all.some((write) => write.isPending.value))
  return {
    single: singles(writes),
    batch: manies(writes),
    purgeAll: purgeAlls(writes),
    pending,
  }
}

export type LifecycleHub = ReturnType<typeof useLifecycleHub>
