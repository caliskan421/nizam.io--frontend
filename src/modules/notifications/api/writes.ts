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
import { invalidationFilters, type OperationId } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import type {
  DismissInput,
  MarkReadInput,
  MarkedCount,
  PushTargetResult,
  RegisterTargetRequest,
  SubjectMuteInput,
  UnregisterTargetInput,
} from '../model/types'

export const NOTIFICATION_NOT_FOUND = 'notifications.notification_not_found'

/**
 * Satır yazması sarmalayıcısı: 404 `notifications.notification_not_found` (başkasının/olmayan/
 * zaten kaldırılmış) sonuç `failed` döner AMA satır düşsün diye liste ve sayaç yine yeniden
 * okunur (sessiz).
 */
function rereadOnNotFound<V>(
  client: ReturnType<typeof useQueryClient>,
  operation: OperationId,
  submit: (vars: V) => Promise<MutationOutcome<V, void>>,
) {
  return async (vars: V): Promise<MutationOutcome<V, void>> => {
    const scope = { ...useScopeStore().snapshot }
    const outcome = await submit(vars)
    if (outcome.kind === 'failed' && outcome.error.code === NOTIFICATION_NOT_FOUND) {
      const filters = invalidationFilters(operation, scope)
      await Promise.all(filters.map((filter) => client.invalidateQueries(filter)))
    }
    return outcome
  }
}

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
  return { ...mutation, submit: rereadOnNotFound(client, 'markNotificationRead', mutation.submit) }
}

/** `dismissNotification` (BE-156; 204, kalıcı; kayıt birleştirilmiş bir grubun başıysa grubuyla). */
export function useDismissNotification() {
  const client = useQueryClient()
  const mutation = useProtectedMutation<DismissInput, void>({
    operation: 'dismissNotification',
    send: (vars, ctx) =>
      api.DELETE('/v1/notifications/{id}', {
        params: { path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
  return { ...mutation, submit: rereadOnNotFound(client, 'dismissNotification', mutation.submit) }
}

/** `muteNotificationSubject` (BE-156; S1, idempotent 204; 500 konu tavanı 422 `subject_id`). */
export function useMuteNotificationSubject() {
  return useProtectedMutation<SubjectMuteInput, void>({
    operation: 'muteNotificationSubject',
    send: (vars, ctx) =>
      api.PUT('/v1/notifications/subject-mutes/{kind}/{id}', {
        params: { path: { kind: vars.kind, id: vars.id } },
        signal: ctx.signal,
      }),
  })
}

/** `unmuteNotificationSubject` (S1 kişisel; satır yoksa da 204): konuya erişim kalmasa da çalışır. */
export function useUnmuteNotificationSubject() {
  return useProtectedMutation<SubjectMuteInput, void>({
    operation: 'unmuteNotificationSubject',
    send: (vars, ctx) =>
      api.DELETE('/v1/notifications/subject-mutes/{kind}/{id}', {
        params: { path: { kind: vars.kind, id: vars.id } },
        signal: ctx.signal,
      }),
  })
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
