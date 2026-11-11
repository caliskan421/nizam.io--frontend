import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'
import type {
  AddAgendaInput,
  AgendaItem,
  AgendaTarget,
  ParticipantInput,
  ParticipantResult,
  UpdateAgendaInput,
} from '../model/types'

export function useAddAgendaItem() {
  return useKeylessMutation<AddAgendaInput, AgendaItem>({
    operation: 'addAgendaItem',
    send: (vars, ctx) =>
      api.POST('/v1/meetings/{id}/agenda', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
export function useUpdateAgendaItem() {
  return useKeylessMutation<UpdateAgendaInput, AgendaItem>({
    operation: 'updateAgendaItem',
    send: (vars, ctx) =>
      api.PATCH('/v1/meeting-agenda/{itemId}', {
        params: { header: programHeaders(vars), path: { itemId: vars.itemId } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
export function useDeleteAgendaItem() {
  return useKeylessMutation<AgendaTarget, void>({
    operation: 'deleteAgendaItem',
    send: (vars, ctx) =>
      api.DELETE('/v1/meeting-agenda/{itemId}', {
        params: { header: programHeaders(vars), path: { itemId: vars.itemId } },
        signal: ctx.signal,
      }),
  })
}
export function useAddMeetingParticipant() {
  return useKeylessMutation<ParticipantInput, ParticipantResult>({
    operation: 'addMeetingParticipant',
    send: (vars, ctx) =>
      api.POST('/v1/meetings/{id}/participants', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        body: { user_id: vars.userId },
        signal: ctx.signal,
      }),
  })
}
export function useRemoveMeetingParticipant() {
  return useKeylessMutation<ParticipantInput, void>({
    operation: 'removeMeetingParticipant',
    send: (vars, ctx) =>
      api.DELETE('/v1/meetings/{id}/participants/{userId}', {
        params: { header: programHeaders(vars), path: { id: vars.id, userId: vars.userId } },
        signal: ctx.signal,
      }),
  })
}
