import { expect, it } from 'vitest'
import { meetingFieldErrors } from './meeting-field-errors'

it('maps recognized fields through local code messages and ignores unrelated errors', () => {
  expect(
    meetingFieldErrors({
      kind: 'failed',
      error: {
        status: 422,
        fields: [
          { field: 'title', messageKey: 'errors.collaboration.input_invalid' },
          { field: 'other', messageKey: 'errors.collaboration.input_invalid' },
        ],
      },
    }),
  ).toEqual({ title: 'Girilen bilgiler geçersiz.' })
  expect(meetingFieldErrors({ kind: 'failed', error: { status: 403, fields: [] } })).toEqual({})
})
