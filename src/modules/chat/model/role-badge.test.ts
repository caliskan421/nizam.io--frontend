import { describe, expect, it } from 'vitest'

import { messageBadge, programRoleLine } from './role-badge'

const names: Record<string, string> = { d1: 'Yazılım', d2: 'Tasarım' }
const nameOf = (id: string) => names[id] ?? null

describe('programRoleLine (üye alt yazısı)', () => {
  it('rol + koordinatörlükler; çözülemeyen departman adı düşer', () => {
    expect(programRoleLine({ role: 'coordinator', department_ids: ['d1', 'd2'] }, nameOf)).toBe(
      'Koordinatör · Yazılım, Tasarım',
    )
    expect(programRoleLine({ role: 'member', department_ids: ['d1', 'yok'] }, nameOf)).toBe(
      'Üye · Yazılım',
    )
  })

  it('şirket yöneticisi ve programdan çıkmış hesap yalnız rol', () => {
    expect(programRoleLine({ role: 'company_admin', department_ids: [] }, nameOf)).toBe('Admin')
    expect(programRoleLine({ role: 'none', department_ids: [] }, nameOf)).toBe('Programda değil')
  })
})

describe('messageBadge', () => {
  it('Admin ve Koordinatör rozet taşır; title koordinatörlükleri söyler', () => {
    expect(messageBadge({ role: 'company_admin', department_ids: [] }, nameOf)).toEqual({
      text: 'Admin',
      title: 'Admin',
    })
    expect(messageBadge({ role: 'coordinator', department_ids: ['d2'] }, nameOf)).toEqual({
      text: 'Koordinatör',
      title: 'Koordinatör · Tasarım',
    })
  })

  it('üye, programdan çıkmış (none) ve alanı olmayan mesaj rozetsiz', () => {
    expect(messageBadge({ role: 'member', department_ids: ['d1'] }, nameOf)).toBeNull()
    expect(messageBadge({ role: 'none', department_ids: [] }, nameOf)).toBeNull()
    expect(messageBadge(undefined, nameOf)).toBeNull()
  })
})
