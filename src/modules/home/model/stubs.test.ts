import { describe, expect, it } from 'vitest'

import {
  CARD_APPROVAL_SPLIT,
  CARD_ARCHIVE_COUNT,
  CARD_LAST_UPLOAD,
  CARD_MEMBER_AVATARS,
} from './stubs'

describe('kart statik olguları (K13)', () => {
  it('hiçbiri sahte veri taşımaz: yalnız "kullanılabilir değil" olgusu', () => {
    expect(CARD_ARCHIVE_COUNT).toEqual({ available: false })
    expect(CARD_LAST_UPLOAD).toEqual({ available: false })
    expect(CARD_APPROVAL_SPLIT).toEqual({ separate: false })
    expect(CARD_MEMBER_AVATARS).toEqual({ allMembers: false })
  })
})
