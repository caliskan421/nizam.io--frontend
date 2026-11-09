// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { emptyUser, pickDepartment, userSchema } from './user-schema'

describe('kullanıcı oluştur şeması (E-05-05)', () => {
  it('e-posta biçimi ve birim zorunlu; ad isteğe bağlı; parola alanı yok', () => {
    const base = { ...emptyUser('d1'), email: 'a@b.co' }
    expect(userSchema().safeParse(base).success).toBe(true)
    expect(userSchema().safeParse({ ...base, email: 'ab.co' }).success).toBe(false)
    expect(userSchema().safeParse({ ...base, departmentId: '' }).success).toBe(false)
    expect(Object.keys(emptyUser(null))).not.toContain('password')
    expect(emptyUser(null).role).toBe('member')
  })

  it('birim önseçimi: geçerli seçim korunur, tek seçenek seçilir, aksi boş', () => {
    const two = [{ value: 'd1' }, { value: 'd2' }]
    expect(pickDepartment('d2', two)).toBe('d2')
    expect(pickDepartment('dx', two)).toBe('')
    expect(pickDepartment('', [{ value: 'd9' }])).toBe('d9')
  })
})
