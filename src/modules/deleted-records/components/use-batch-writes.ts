/**
 * Toplu yaşam döngüsü yazmaları (BE-114): seçili satırlar GERÇEK türlerine göre gruplanır ve her tür
 * ≤100'lük ardışık isteklerle gönderilir. Tür sırası sabittir (geri yüklemede ebeveynler önce,
 * kalıcı silmede çocuklar önce); her istek eylemin YAKALANMIŞ bağlamıyla (`context`) gider. Sonuç
 * kimlikleri satır anahtarına (`kind:id`) çevrilir: farklı türlerde aynı kimlik çakışmaz.
 * Sistem hatasında (5xx / ağ) ya da bağlam bayatlayınca döngü durur: işlenenler kalıcıdır, kalanı
 * için yeni istek gitmez ve kör tekrar yoktur (keyless kalıp listeyi yeniden okur).
 */
import type { ActionContext } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import { chunk, emptyRun, mergeRun, type BatchRun } from '../model/batch'
import { PURGE_ORDER, RESTORE_ORDER } from '../model/lifecycle'
import type { LifecycleAction } from '../model/outcome'
import type { DeletedRow } from '../model/types'
import { useLifecycleHub, type BatchOutcome, type LifecycleHub } from './use-lifecycle-hub'

/** İşlenen kısım + (varsa) bütün işlemi durduran sonuç. */
export interface BatchResult {
  run: BatchRun
  stopped: BatchOutcome | null
}

export function useBatchWrites(hub: LifecycleHub = useLifecycleHub()) {
  const scope = useScopeStore()

  async function run(
    action: LifecycleAction,
    rows: readonly DeletedRow[],
    context: ActionContext,
  ): Promise<BatchResult> {
    const programId = scope.programId ?? ''
    const order = action === 'restore' ? RESTORE_ORDER : PURGE_ORDER
    let merged = emptyRun()
    for (const kind of order) {
      const ids = rows.filter((row) => row.kind === kind).map((row) => row.id)
      for (const part of chunk(ids)) {
        const outcome = await hub.batch[kind][action](part, programId, context)
        if (outcome.kind !== 'success') return { run: merged, stopped: outcome }
        merged = mergeRun(merged, outcome.data, kind)
      }
    }
    return { run: merged, stopped: null }
  }

  return { run, pending: hub.pending }
}
