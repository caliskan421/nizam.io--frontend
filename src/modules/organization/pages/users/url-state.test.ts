import { describe, expect, it } from 'vitest'

import { DEFAULT_USERS_STATE, parseUsersQuery, usersQuery } from './url-state'

describe('05 URL durumu', () => {
  it('katalog adları: rol, q, koordinatorluk, secili', () => {
    expect(
      parseUsersQuery({ rol: 'uye', q: 'ay', koordinatorluk: 'd1', secili: 'u1', sayfa: '3' }),
    ).toEqual({ tab: 'uye', search: 'ay', department: 'd1', selected: 'u1' })
  })

  it('geçersiz değer sessizce düşer; boş sorgu varsayılan', () => {
    expect(
      parseUsersQuery({ rol: 'yonetici', q: '   ', koordinatorluk: 'a b', secili: ['u2', 'u3'] }),
    ).toEqual({ ...DEFAULT_USERS_STATE, selected: 'u2' })
    expect(parseUsersQuery({})).toEqual(DEFAULT_USERS_STATE)
    expect(parseUsersQuery({ rol: 'admin' }).tab).toBe('admin')
  })

  it('varsayılanlar yazılmaz; gidiş-dönüş', () => {
    expect(usersQuery(DEFAULT_USERS_STATE)).toEqual({})
    const state = { tab: 'koordinator' as const, search: 'Işık', department: 'd2', selected: 'u9' }
    expect(parseUsersQuery(usersQuery(state))).toEqual(state)
  })
})
