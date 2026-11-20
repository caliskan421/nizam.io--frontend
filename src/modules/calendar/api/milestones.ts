import { api, unwrap } from '@/shared/http'

import type { MilestoneCreate, MilestoneUpdate } from '../model/calendar'

export function createMilestone(id: string, body: MilestoneCreate) {
  return unwrap(api.POST('/v1/programs/{id}/milestones', { params: { path: { id } }, body }))
}

export function updateMilestone(id: string, milestoneId: string, body: MilestoneUpdate) {
  return unwrap(
    api.PATCH('/v1/programs/{id}/milestones/{milestoneId}', {
      params: { path: { id, milestoneId } },
      body,
    }),
  )
}

export function deleteMilestone(id: string, milestoneId: string) {
  return unwrap(
    api.DELETE('/v1/programs/{id}/milestones/{milestoneId}', {
      params: { path: { id, milestoneId } },
    }),
  )
}
