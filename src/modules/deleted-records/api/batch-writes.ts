/**
 * Toplu yaşam döngüsü yazmaları (BE-114; ADR-0045): tür × {geri yükle, kalıcı sil} = sekiz uç,
 * `POST /v1/admin/deleted/<tür>/{restore|purge}` gövdesi `{ids}` (1–100, tekrarlı kimlik bir
 * kez). Cevap kısmi başarı zarfıdır (`succeeded[]`, `failed[{id, code}]`); sistem hatası döngüyü
 * durdurur (5xx; işlenmiş öğeler kalıcıdır). İşlem anahtarı ve `expected_revision` ALMAZ:
 * anahtarsız organizasyon yazması kalıbı (`useKeylessMutation`) — sonuç bilinmiyorsa kör tekrar
 * yok, listeler yeniden okunur. S2 türlerde program başlığı eylemle dondurulur; hesap ucu S1'dir.
 */
import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'

import type { BatchTarget, DeletedBatchResult } from '../model/types'

export const useBatchRestoreWorkItems = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchRestoreWorkItems',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/work-items/restore', {
        params: { header: programHeaders(v) },
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchPurgeWorkItems = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchPurgeWorkItems',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/work-items/purge', {
        params: { header: programHeaders(v) },
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchRestoreMeetings = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchRestoreMeetings',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/meetings/restore', {
        params: { header: programHeaders(v) },
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchPurgeMeetings = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchPurgeMeetings',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/meetings/purge', {
        params: { header: programHeaders(v) },
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchRestoreDepartments = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchRestoreDepartments',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/departments/restore', {
        params: { header: programHeaders(v) },
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchPurgeDepartments = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchPurgeDepartments',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/departments/purge', {
        params: { header: programHeaders(v) },
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchRestoreAccounts = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchRestoreAccounts',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/accounts/restore', {
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })

export const useBatchPurgeAccounts = () =>
  useKeylessMutation<BatchTarget, DeletedBatchResult>({
    operation: 'batchPurgeAccounts',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/accounts/purge', {
        body: { ids: v.ids },
        signal: ctx.signal,
      }),
  })
