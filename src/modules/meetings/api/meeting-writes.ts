import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'
import type {
  CreateMeetingInput,
  MeetingRevised,
  MeetingCreated,
  MeetingLifecycleResult,
  MeetingTarget,
  UpdateMeetingInput,
} from '../model/types'

export function useCreateMeeting() {
  return useKeylessMutation<CreateMeetingInput, MeetingCreated>({
    operation: 'createMeeting',
    send: (vars, ctx) =>
      api.POST('/v1/meetings', {
        params: { header: programHeaders(vars) },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
export function useUpdateMeeting() {
  return useKeylessMutation<UpdateMeetingInput, MeetingRevised>({
    operation: 'updateMeeting',
    send: (vars, ctx) =>
      api.PATCH('/v1/meetings/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
export function useDeleteMeeting() {
  return useKeylessMutation<MeetingTarget, void>({
    operation: 'deleteMeeting',
    send: (vars, ctx) =>
      api.DELETE('/v1/meetings/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}
export function useRestoreMeeting() {
  return useKeylessMutation<MeetingTarget, MeetingLifecycleResult>({
    operation: 'restoreMeeting',
    send: (vars, ctx) =>
      api.PATCH('/v1/admin/restore/meetings/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}
export function usePermanentDeleteMeeting() {
  return useKeylessMutation<MeetingTarget, MeetingLifecycleResult>({
    operation: 'permanentDeleteMeeting',
    send: (vars, ctx) =>
      api.DELETE('/v1/admin/permanent/meetings/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}
