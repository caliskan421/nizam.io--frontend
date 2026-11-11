import { expect, it } from 'vitest'
import { ApiError } from '@/shared/errors/api-error'
import { isMeetingAccessLoss } from './use-meeting-loss'

it('yalnız 403/404 toplantı erişim kaybını tanır', () => {
  expect(
    isMeetingAccessLoss(new ApiError({ code: 'collaboration.meeting_not_found', status: 404 })),
  ).toBe(true)
  expect(
    isMeetingAccessLoss(new ApiError({ code: 'collaboration.not_authorized', status: 403 })),
  ).toBe(true)
  expect(isMeetingAccessLoss(new ApiError({ code: 'platform.internal_error', status: 500 }))).toBe(
    false,
  )
})
