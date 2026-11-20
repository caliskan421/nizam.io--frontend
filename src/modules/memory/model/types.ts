import type { components, operations } from '@/shared/api/schema'

type Schema = components['schemas']
export type Experience = Schema['MemoryExperience']
export type ExperienceDetail = Schema['MemoryExperienceDetail']
export type ExperienceCreate = Schema['MemoryExperienceCreate']
export type ExperienceUpdate = Schema['MemoryExperienceUpdate']
export type ExperienceConvert = Schema['MemoryConvertRequest']
export type ExperienceFilter = NonNullable<
  operations['listMemoryExperiences']['parameters']['query']
>
export type SourceKind = Source['kind']
export type Source = NonNullable<ExperienceCreate['source']>
export type WorkNote = Schema['ProgramWorkItemNote']
export type MeetingNote = Schema['ProgramMeetingNote']
export type TaskNotesBody = Schema['MemoryTaskNotesRequest']

export const AREAS = {
  volunteers: 'Gönüllüler',
  transport: 'Ulaşım',
  energy: 'Enerji',
  infrastructure: 'Altyapı',
  supply: 'Tedarik',
  communication: 'İletişim',
  security: 'Güvenlik',
  accommodation: 'Konaklama',
} satisfies Record<Experience['area'], string>

export const STATUSES = {
  open: 'Açık',
  suggested: 'Önerildi',
  applied: 'Uygulandı',
} satisfies Record<Experience['status'], string>
