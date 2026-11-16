/**
 * "Atanana hatırlat" (BE-008, `remindWorkItem`, S3): görevin kendi kapsamıyla gider; anahtarsızdır
 * (sözleşme `Idempotency-Key` istemez). Yetki olgudan (koordinatörlük/ŞY — `canManageWorkItem`),
 * mercekten değil; sunucu kararı esastır (üye 403, tamamlanmış görev 409, atanansız 422, kota
 * 429). Teslim asenkrondur: 202 "gönderildi" bildirimi; alıcı seçimi yoktur. Çift tıklama kilitli.
 * Bildirim kurulumda alınan `useToast` ile (sökülmüş ekranın geç sonucu bildirim üretmez).
 */
import { api } from '@/shared/http'
import { reachesOwner, useProtectedMutation } from '@/shared/http/mutation'
import { i18n } from '@/shared/i18n'
import { useToast } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'

import type { WorkItem } from '../model/types'
import { targetOf } from '../model/target'
import { scopeHeaders } from './http'

export function useRemindWorkItem() {
  const toast = useToast()
  const mutation = useProtectedMutation<
    Pick<WorkItem, 'work_item_id' | 'program_id' | 'department_id'>,
    { recipient_count: number }
  >({
    operation: 'remindWorkItem',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/remind', {
        params: { header: scopeHeaders(targetOf(vars)), path: { id: vars.work_item_id } },
        signal: ctx.signal,
      }),
  })

  async function remind(item: Pick<WorkItem, 'work_item_id' | 'program_id' | 'department_id'>) {
    if (mutation.isPending.value) return
    const outcome = await mutation.submit(item)
    if (!reachesOwner(outcome)) return
    if (outcome.kind === 'success') {
      const n = outcome.data.recipient_count
      toast.push({
        message: i18n.global.t(
          n > 0 ? 'workDetail.actions.reminded' : 'workDetail.actions.remindedNone',
          { n },
        ),
      })
    } else notifyOutcome(outcome)
  }
  return { remind, isPending: mutation.isPending }
}
