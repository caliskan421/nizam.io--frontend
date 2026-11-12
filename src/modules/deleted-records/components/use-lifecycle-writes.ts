/**
 * Sekiz yaşam döngüsü yazması tek tabloda: tür × eylem → gönderici. Toplantı yazmaları `meetings`
 * modülündendir. S2 hedefi eylem anında dondurulur (program başlığı eylemin kapsamından gider);
 * hesap uçları S1'dir. `Idempotency-Key`/`expected_revision` yok. `pending`: herhangi biri uçuşta.
 */
import { computed } from 'vue'

import { usePermanentDeleteMeeting, useRestoreMeeting } from '@/modules/meetings/public'
import type { ActionContext, MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import {
  usePermanentDeleteAccount,
  usePermanentDeleteDepartment,
  usePermanentDeleteWorkItem,
  useRestoreAccount,
  useRestoreDepartment,
  useRestoreWorkItem,
} from '../api/writes'
import type { DeletedKind } from '../model/kinds'
import type { LifecycleAction } from '../model/outcome'
import type { DeletedRow } from '../model/types'

export type LifecycleOutcome = MutationOutcome<unknown, unknown, unknown>
export type LifecycleSend = (row: DeletedRow, context: ActionContext) => Promise<LifecycleOutcome>

export function useLifecycleWrites() {
  const scope = useScopeStore()
  const restoreTask = useRestoreWorkItem()
  const purgeTask = usePermanentDeleteWorkItem()
  const restoreMeeting = useRestoreMeeting()
  const purgeMeeting = usePermanentDeleteMeeting()
  const restoreDepartment = useRestoreDepartment()
  const purgeDepartment = usePermanentDeleteDepartment()
  const restoreAccount = useRestoreAccount()
  const purgeAccount = usePermanentDeleteAccount()
  const pending = computed(() =>
    [
      restoreTask,
      purgeTask,
      restoreMeeting,
      purgeMeeting,
      restoreDepartment,
      purgeDepartment,
      restoreAccount,
      purgeAccount,
    ].some((write) => write.isPending.value),
  )

  const target = (row: DeletedRow) => ({ programId: scope.programId ?? '', id: row.id })

  const senders: Record<DeletedKind, Record<LifecycleAction, LifecycleSend>> = {
    gorev: {
      restore: (row, context) => restoreTask.submit(target(row), { context }),
      purge: (row, context) => purgeTask.submit(target(row), { context }),
    },
    toplanti: {
      restore: (row, context) => restoreMeeting.submit(target(row), { context }),
      purge: (row, context) => purgeMeeting.submit(target(row), { context }),
    },
    koordinatorluk: {
      restore: (row, context) => restoreDepartment.submit(target(row), { context }),
      purge: (row, context) => purgeDepartment.submit(target(row), { context }),
    },
    kullanici: {
      restore: (row, context) => restoreAccount.submit({ id: row.id }, { context }),
      purge: (row, context) => purgeAccount.submit({ id: row.id }, { context }),
    },
  }
  return { senders, pending }
}
