import { errorText } from '@/shared/i18n'
export function meetingFieldErrors(result: {
  kind: string
  error?: { status: number | null; fields: { field: string; messageKey: string }[] }
}) {
  if (result.kind !== 'failed' || result.error?.status !== 422) return {}
  const errors: Record<string, string> = {}
  for (const field of result.error.fields) {
    if (
      [
        'title',
        'meeting_date',
        'department_ids',
        'participant_ids',
        'members_included',
        'invite_mode',
      ].includes(field.field)
    )
      errors[field.field] = errorText(field)
  }
  return errors
}

export function fieldErrorAttrs(errors: Record<string, string>, field: string) {
  return errors[field] ? { 'aria-invalid': true, 'aria-describedby': `meeting-${field}-error` } : {}
}
