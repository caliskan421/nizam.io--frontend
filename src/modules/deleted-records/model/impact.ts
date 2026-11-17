/**
 * Koordinatörlük kalıcı silme etkisinin ekran dili (`departmentDeleteImpact`, ADR-0043). Saf
 * fonksiyonlar: sayılar yanıttan, metinler yalnız i18n'den (sunucu `message` gösterilmez).
 * Önizleme okuma anının görüntüsüdür; kilit ya da başarı garantisi DEĞİLDİR.
 */
import type { NormalizedFieldError } from '@/shared/errors/api-error'

import { deletedText } from './messages'
import type { DepartmentDeleteImpact } from './types'

const BLOCKER_KINDS = ['tables', 'projects', 'pending_proposals'] as const
type BlockerKind = (typeof BLOCKER_KINDS)[number]

const isBlockerKind = (value: string): value is BlockerKind =>
  (BLOCKER_KINDS as readonly string[]).includes(value)

/** `permanent_blockers` içinden sayısı sıfırdan büyük engeller, cümle parçası olarak. */
export function blockerParts(impact: Pick<DepartmentDeleteImpact, 'permanent_blockers'>): string[] {
  return BLOCKER_KINDS.filter((kind) => impact.permanent_blockers[kind] > 0).map((kind) =>
    deletedText(`impact.blockers.${kind}`, { n: impact.permanent_blockers[kind] }),
  )
}

/** Engelli (`permanent_blocked`) durumda gösterilen tek cümle; DELETE gönderilmez. */
export function blockedMessage(impact: DepartmentDeleteImpact): string {
  const parts = blockerParts(impact)
  return parts.length > 0
    ? deletedText('impact.blocked', { parts: parts.join(', ') })
    : deletedText('impact.blockedAny')
}

/**
 * 409 `organization.department_in_use` `fields[]` → engel parçaları. Yalnız bilinen alan (`tables`,
 * `projects`, `pending_proposals`) ve kod (`organization.department_usage`) okunur; `value` yalnız
 * tam sayı dizesiyse sayı sayılır, aksi halde sayısız tür adı yazılır. `null`: tanınan engel yok.
 */
export function blockerPartsFromFields(fields: readonly NormalizedFieldError[]): string[] | null {
  const parts: string[] = []
  for (const kind of BLOCKER_KINDS) {
    const field = fields.find((f) => f.code === 'organization.department_usage' && f.field === kind)
    if (!field || !isBlockerKind(field.field)) continue
    const n =
      field.value !== undefined && /^\d{1,9}$/.test(field.value) ? Number(field.value) : null
    parts.push(
      n === null
        ? deletedText(`impact.blockersUnknownCount.${kind}`)
        : deletedText(`impact.blockers.${kind}`, { n }),
    )
  }
  return parts.length > 0 ? parts : null
}

/** Kalıcı silme onayının gövde paragrafları (okuma başarılı ve engel yok). */
export function impactConfirmBody(impact: DepartmentDeleteImpact): string[] {
  const tasks = impact.active_items + impact.completed_items + impact.deleted_items
  const links = impact.programs.filter((program) => program.linked).length
  const lines = [
    deletedText('confirm.purgeBody'),
    deletedText('impact.company'),
    tasks > 0
      ? deletedText('impact.tasks', {
          total: tasks,
          active: impact.active_items,
          completed: impact.completed_items,
          deleted: impact.deleted_items,
          together: impact.deleted_with_department,
        })
      : deletedText('impact.tasksNone'),
    impact.file_count > 0
      ? deletedText('impact.files', { n: impact.file_count })
      : deletedText('impact.filesNone'),
    impact.member_count > 0
      ? deletedText('impact.members', { n: impact.member_count })
      : deletedText('impact.membersNone'),
    links > 0 ? deletedText('impact.links', { n: links }) : deletedText('impact.linksNone'),
    impact.meeting_count > 0
      ? deletedText('impact.meetings', { n: impact.meeting_count })
      : deletedText('impact.meetingsNone'),
  ]
  if (impact.programs.length > 0) {
    lines.push(deletedText('impact.programsTitle'))
    for (const program of impact.programs) {
      lines.push(
        deletedText('impact.program', {
          name: program.program_name ?? deletedText('impact.programUnnamed'),
          active: program.active_items,
          completed: program.completed_items,
          deleted: program.deleted_items,
          link: deletedText(program.linked ? 'impact.programLinked' : 'impact.programUnlinked'),
        }),
      )
    }
  }
  lines.push(deletedText('impact.snapshot'))
  return lines
}
