/**
 * Dönem aktarımı (`previewTransfer` → `transferWorkItems`; `listTransfers` geçmişi). Hepsi S1.
 *
 *  - Ön izleme salt okunurdur (PROGRAM-K25) ama POST'tur: `useProtectedMutation` ile gönderilir,
 *    `Idempotency-Key` TAŞIMAZ (sözleşme istemiyor; KESİN 8), geçersizleme yoktur.
 *  - Yürütme `Idempotency-Key` ister (PROGRAM-K19): anahtar kullanıcı eylemi başına motorda
 *    üretilir; ağ tekrarı aynı anahtar + aynı gövdeyle (`unknown_outcome.retry`). Gövde ön
 *    izlemenin `preview_fingerprint`'ini taşır; 409 `program.transfer_preview_stale` çağırana
 *    döner — otomatik yeniden önizleme / yeniden gönderim YOK.
 *  - Başarıda motor §6 listesini yeniden okur (`['programs']`, görev listeleri); aktarım ekip
 *    satırı ve departman bağı da ekleyebildiği için (PROGRAM-K28, K42) standing ve kapsamlı
 *    sorgular tazelenir (K2).
 *  - Geçmiş anahtarı `['programs', 'transfers']`: `['programs']` önekinin altında — aktarım ve
 *    program yazmalarının §6 geçersizlemesi geçmişi de yeniden okutur (ortak fabrikada ayrı
 *    anahtar yok; rapor: SAHİPLİK-DIŞI İHTİYAÇ).
 */
import {
  useInfiniteQuery,
  useQueryClient,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed } from 'vue'

import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'
import { isScopedQueryKey, queryKeys } from '@/shared/http/query-keys'
import { unwrapList } from '@/shared/http/truncation'
import { invalidateStanding } from '@/shared/scope/standing'

import type {
  TransferHistory,
  TransferInput,
  TransferPreview,
  TransferResult,
  TransferSelection,
} from '../model/types'
import { PROGRAM_STALE_MS, retryTransient, TRANSFER_PAGE_LIMIT } from './http'

export const TRANSFER_HISTORY_KEY = [...queryKeys.programs.all(), 'transfers'] as const

function selectionBody(vars: TransferSelection) {
  return {
    source_program_id: vars.sourceProgramId,
    target_program_id: vars.targetProgramId,
    department_id: vars.departmentId,
    work_item_ids: vars.workItemIds,
  }
}

export function usePreviewTransfer() {
  return useProtectedMutation<TransferSelection, TransferPreview>({
    operation: 'previewTransfer',
    send: (vars, ctx) =>
      api.POST('/v1/program-transfers/preview', { body: selectionBody(vars), signal: ctx.signal }),
  })
}

export function useTransferWorkItems() {
  const client = useQueryClient()
  const mutation = useProtectedMutation<TransferInput, TransferResult>({
    operation: 'transferWorkItems',
    queryClient: client,
    send: (vars, ctx) =>
      api.POST('/v1/program-transfers', {
        params: { header: { 'Idempotency-Key': ctx.idempotencyKey } },
        body: {
          ...selectionBody(vars),
          preview_fingerprint: vars.previewFingerprint,
          ...(vars.addMissingAccess ? { add_missing_access: true } : {}),
        },
        signal: ctx.signal,
      }),
  })
  async function submit(...args: Parameters<typeof mutation.submit>) {
    const outcome = await mutation.submit(...args)
    if (outcome.kind === 'success') {
      await Promise.all([
        invalidateStanding(client),
        client.invalidateQueries({ predicate: (q) => isScopedQueryKey(q.queryKey) }),
      ])
    }
    return outcome
  }
  return { submit, isPending: mutation.isPending }
}

/** Aktarım geçmişi (imleçli; "Daha fazla yükle", P4). */
export function useTransferHistory() {
  const query = useInfiniteQuery({
    queryKey: TRANSFER_HISTORY_KEY,
    queryFn: ({ pageParam, signal }: QueryFunctionContext<QueryKey, string | undefined>) =>
      unwrapList(
        api.GET('/v1/program-transfers', {
          params: {
            query: { limit: TRANSFER_PAGE_LIMIT, ...(pageParam ? { cursor: pageParam } : {}) },
          },
          signal,
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: TransferHistory) => last.next_cursor || undefined,
    retry: retryTransient,
    staleTime: PROGRAM_STALE_MS,
    refetchOnWindowFocus: false,
  })
  return {
    query,
    transfers: computed(() => query.data.value?.pages.flatMap((p) => p.transfers) ?? []),
  }
}
