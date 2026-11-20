import { api, unwrap } from '@/shared/http'

import type {
  ExperienceConvert,
  ExperienceCreate,
  ExperienceFilter,
  ExperienceUpdate,
  SourceKind,
  TaskNotesBody,
} from '../model/types'

const header = (program: string) => ({ 'X-Nizamio-Program': program })
const entity = (program: string, id: string) => ({ header: header(program), path: { id } })
const read = (signal: AbortSignal) => ({ cache: 'no-store' as const, signal })

export const listExperiences = (program: string, query: ExperienceFilter, signal: AbortSignal) =>
  unwrap(
    api.GET('/v1/memory/experiences', {
      params: { header: header(program), query },
      ...read(signal),
    }),
  )

export const readExperience = (program: string, id: string, signal: AbortSignal) =>
  unwrap(api.GET('/v1/memory/experiences/{id}', { params: entity(program, id), ...read(signal) }))

export const addExperience = (program: string, body: ExperienceCreate, key: string) =>
  unwrap(
    api.POST('/v1/memory/experiences', {
      params: { header: { ...header(program), 'Idempotency-Key': key } },
      body,
    }),
  )

export const editExperience = (program: string, id: string, body: ExperienceUpdate) =>
  unwrap(api.PATCH('/v1/memory/experiences/{id}', { params: entity(program, id), body }))

export const deleteExperience = (program: string, id: string) =>
  unwrap(api.DELETE('/v1/memory/experiences/{id}', { params: entity(program, id) }))

export const convertExperience = (program: string, id: string, body: ExperienceConvert) =>
  unwrap(
    api.POST('/v1/memory/experiences/{id}/convert-to-task', { params: entity(program, id), body }),
  )

export function endorseExperience(program: string, id: string, endorsed: boolean) {
  const params = entity(program, id)
  return unwrap(
    endorsed
      ? api.PUT('/v1/memory/experiences/{id}/endorsement', { params })
      : api.DELETE('/v1/memory/experiences/{id}/endorsement', { params }),
  )
}

export const listWorkNotes = (
  program: string,
  q: string,
  cursor: string | undefined,
  signal: AbortSignal,
) =>
  unwrap(
    api.GET('/v1/work-item-notes', {
      params: { header: header(program), query: { q: q || undefined, cursor, limit: 30 } },
      ...read(signal),
    }),
  )

export const listMeetingNotes = (
  program: string,
  q: string,
  cursor: string | undefined,
  signal: AbortSignal,
) =>
  unwrap(
    api.GET('/v1/meeting-notes', {
      params: { header: header(program), query: { q: q || undefined, cursor, limit: 30 } },
      ...read(signal),
    }),
  )

export const readSources = (
  program: string,
  kind: SourceKind,
  ids: string[],
  signal: AbortSignal,
) =>
  unwrap(
    api.GET('/v1/memory/experiences/by-source', {
      params: { header: header(program), query: { kind, ids } },
      ...read(signal),
    }),
  )

export const readRelated = (
  program: string,
  text: string,
  department: string,
  signal: AbortSignal,
) =>
  unwrap(
    api.GET('/v1/memory/related', {
      params: { header: header(program), query: { text, department_id: department, limit: 3 } },
      ...read(signal),
    }),
  )

export const addExperienceTaskNotes = (program: string, body: TaskNotesBody, key: string) =>
  unwrap(
    api.POST('/v1/memory/task-notes', {
      params: { header: { ...header(program), 'Idempotency-Key': key } },
      body,
    }),
  )
