/**
 * Çöpü boşalt yazmaları (BE-115; ADR-0045): `POST /v1/admin/deleted/<tür>/purge-all`, gövde
 * `{confirm}` = tür yol adı (aksi 422 `confirm`); çağrı başına en çok 50 kayıt, cevap
 * `{succeeded[], failed[], remaining}`. İşlem anahtarı ALMAZ (anahtarsız organizasyon yazması
 * kalıbı: sonuç bilinmiyorsa kör tekrar yok, listeler yeniden okunur). Görev ve toplantı seçili
 * programın, hesap şirketin silinmişlerini kapsar; koordinatörlük için kullanılmaz (uç şirket
 * geneli ve programa bağlıları silemez, sekme kümesiyle örtüşmez).
 */
import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'

import type { DeletedBatchResult, PurgeAllTarget } from '../model/types'

export const usePurgeAllWorkItems = () =>
  useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
    operation: 'purgeAllWorkItems',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/work-items/purge-all', {
        params: { header: programHeaders(v) },
        body: { confirm: v.confirm },
        signal: ctx.signal,
      }),
  })

export const usePurgeAllMeetings = () =>
  useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
    operation: 'purgeAllMeetings',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/meetings/purge-all', {
        params: { header: programHeaders(v) },
        body: { confirm: v.confirm },
        signal: ctx.signal,
      }),
  })

export const usePurgeAllAccounts = () =>
  useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
    operation: 'purgeAllAccounts',
    send: (v, ctx) =>
      api.POST('/v1/admin/deleted/accounts/purge-all', {
        body: { confirm: v.confirm },
        signal: ctx.signal,
      }),
  })
