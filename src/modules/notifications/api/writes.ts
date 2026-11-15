/**
 * Bildirim yazmaları (14 `backend.md` §2; S1, `X-Requested-With`, `Idempotency-Key` YOK — uç
 * tanımlamaz). Hepsi `useProtectedMutation`; iyimser güncelleme yok: başarıda sayaç + panel
 * listesi birlikte yenilenir (KESİN 29, `INVALIDATED_BY`).
 *  - `markNotificationRead` idempotenttir (K17); 404 `notifications.notification_not_found`
 *    (başkasının/olmayan) sonuç `failed` döner AMA satır düşsün diye liste ve sayaç yine
 *    yeniden okunur (sessiz).
 *  - Cihaz kaydı (`registerPushTarget`/`unregisterPushTarget`) yalnız api katmanıdır; service
 *    worker ve izin arayüzü W159'dadır. `target_id` yalnız bellekte (depolama listesi dışı); çıkış silmesi `model/push-signout.ts`.
 */
import { useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/http'
import { useProtectedMutation, type MutationOutcome } from '@/shared/http/mutation'
import { invalidationFilters } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import type {
  MarkReadInput,
  MarkedCount,
  PushTargetResult,
  RegisterTargetRequest,
  UnregisterTargetInput,
} from '../model/types'

export const NOTIFICATION_NOT_FOUND = 'notifications.notification_not_found'

export function useMarkNotificationRead() {
  const client = useQueryClient()
  const mutation = useProtectedMutation<MarkReadInput, void>({
    operation: 'markNotificationRead',
    send: (vars, ctx) =>
      api.POST('/v1/notifications/{id}/read', {
        params: { path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
  async function submit(vars: MarkReadInput): Promise<MutationOutcome<MarkReadInput, void>> {
    const scope = { ...useScopeStore().snapshot }
    const outcome = await mutation.submit(vars)
    if (outcome.kind === 'failed' && outcome.error.code === NOTIFICATION_NOT_FOUND) {
      const filters = invalidationFilters('markNotificationRead', scope)
      await Promise.all(filters.map((filter) => client.invalidateQueries(filter)))
    }
    return outcome
  }
  return { ...mutation, submit }
}

export function useMarkAllNotificationsRead() {
  return useProtectedMutation<void, MarkedCount>({
    operation: 'markAllNotificationsRead',
    send: (_vars, ctx) => api.POST('/v1/notifications/read-all', { signal: ctx.signal }),
  })
}

export function useRegisterPushTarget() {
  return useProtectedMutation<RegisterTargetRequest, PushTargetResult>({
    operation: 'registerPushTarget',
    send: (vars, ctx) => api.POST('/v1/notifications/targets', { body: vars, signal: ctx.signal }),
  })
}

export function useUnregisterPushTarget() {
  return useProtectedMutation<UnregisterTargetInput, void>({
    operation: 'unregisterPushTarget',
    send: (vars, ctx) =>
      api.DELETE('/v1/notifications/targets/{target_id}', {
        params: { path: { target_id: vars.targetId } },
        signal: ctx.signal,
      }),
  })
}
