import { describe, expect, it } from 'vitest'

import { chatText } from '../../../messages'
import { MEMBER_ROLE_ROWS } from '../member-roles'

describe('üye satırı olguları (tablo)', () => {
  it('her grup rolü için satır var; etiketler çözülür', () => {
    expect(Object.keys(MEMBER_ROLE_ROWS).sort()).toEqual(['admin', 'founder', 'member'])
    expect(chatText(MEMBER_ROLE_ROWS.admin.label!)).toBe('Yönetici')
    expect(chatText(MEMBER_ROLE_ROWS.founder.label!)).toBe('Kurucu')
    expect(MEMBER_ROLE_ROWS.member.label).toBeNull()
  })

  it('yönetici eylemi: üye → yap, yönetici → al, kurucu → yok', () => {
    expect(MEMBER_ROLE_ROWS.member.adminAction).toBe('grant')
    expect(MEMBER_ROLE_ROWS.admin.adminAction).toBe('revoke')
    expect(MEMBER_ROLE_ROWS.founder.adminAction).toBeNull()
  })
})
