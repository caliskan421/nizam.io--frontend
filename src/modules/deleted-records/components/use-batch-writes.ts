/**
 * Sekiz toplu yaşam döngüsü yazması tek tabloda: tür × eylem → gönderici (BE-114). 100'den fazla
 * kayıt ardışık ≤100'lük isteklerle gider; her istek eylemin YAKALANMIŞ bağlamıyla (`context`)
 * gönderilir ve parçalar arasında sıra bozulmaz (çift tık kilidi: `pending`). Sistem hatasında
 * (5xx / ağ) döngü durur: işlenmiş öğeler kalıcıdır, kalanının durumu bilinmez ve kör tekrar
 * yoktur (keyless kalıp listeyi yeniden okur). Başarısız parça zarfı değil, protokol sonucudur.
 */
import { computed } from 'vue'

import type { ActionContext, MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

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
import { chunk, emptyRun, mergeRun, type BatchRun } from '../model/batch'
import type { DeletedKind } from '../model/kinds'
import type { LifecycleAction } from '../model/outcome'
import type { BatchTarget, DeletedBatchResult } from '../model/types'

type Outcome = MutationOutcome<BatchTarget, DeletedBatchResult, unknown>
type Submit = (vars: BatchTarget, opts: { context: ActionContext }) => Promise<Outcome>

/** İşlenen kısım + (varsa) bütün işlemi durduran sonuç. */
export interface BatchResult {
  run: BatchRun
  stopped: Outcome | null
}

export function useBatchWrites() {
  const scope = useScopeStore()
  const writes = {
    gorev: { restore: useBatchRestoreWorkItems(), purge: useBatchPurgeWorkItems() },
    toplanti: { restore: useBatchRestoreMeetings(), purge: useBatchPurgeMeetings() },
    koordinatorluk: { restore: useBatchRestoreDepartments(), purge: useBatchPurgeDepartments() },
    kullanici: { restore: useBatchRestoreAccounts(), purge: useBatchPurgeAccounts() },
  }
  const pending = computed(() =>
    Object.values(writes).some(
      (pair) => pair.restore.isPending.value || pair.purge.isPending.value,
    ),
  )

  async function run(
    kind: DeletedKind,
    action: LifecycleAction,
    ids: readonly string[],
    context: ActionContext,
  ): Promise<BatchResult> {
    const submit: Submit = writes[kind][action].submit
    const programId = scope.programId ?? ''
    let merged = emptyRun()
    for (const part of chunk(ids)) {
      const outcome = await submit({ programId, ids: part }, { context })
      if (outcome.kind !== 'success') return { run: merged, stopped: outcome }
      merged = mergeRun(merged, outcome.data)
    }
    return { run: merged, stopped: null }
  }

  return { run, pending }
}
