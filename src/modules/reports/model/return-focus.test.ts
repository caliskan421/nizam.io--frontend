import { describe, expect, it } from 'vitest'

import {
  meetingReturnKey,
  requestFocusReturn,
  SEASON_RETURN_KEY,
  takeFocusReturn,
} from './return-focus'

describe('önizleme dönüş odağı', () => {
  it('bayrak yalnız kendi anahtarıyla bir kez tüketilir', () => {
    requestFocusReturn(SEASON_RETURN_KEY)
    expect(takeFocusReturn(meetingReturnKey('m1'))).toBe(false)
    expect(takeFocusReturn(SEASON_RETURN_KEY)).toBe(true)
    expect(takeFocusReturn(SEASON_RETURN_KEY)).toBe(false)
  })

  it('toplantı anahtarı toplantıya özgü', () => {
    requestFocusReturn(meetingReturnKey('m1'))
    expect(takeFocusReturn(meetingReturnKey('m2'))).toBe(false)
    expect(takeFocusReturn(meetingReturnKey('m1'))).toBe(true)
  })
})
