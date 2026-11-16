import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { approvalRowParts, approvalsNote } from './approvals'

const NOW = new Date('2026-10-20T12:00:00Z')
const TZ = 'Europe/Istanbul'

describe('onay kartı alt yazısı ve satır parçaları (BE-137)', () => {
  it('"Kanıt yüklendi" yalnız her satırda file_count > 0; en eskisi en eski submitted_at', () => {
    const items = [
      item({ file_count: 4, submitted_at: '2026-10-20T10:00:00Z' }),
      item({ file_count: 2, submitted_at: '2026-10-19T13:20:00Z' }),
    ]
    expect(approvalsNote(items, NOW, TZ)).toBe(
      'Kanıt yüklendi, kararını bekliyor · en eskisi dün 16:20',
    )
    const noFile = [...items, item({ file_count: 0, submitted_at: null })]
    expect(approvalsNote(noFile, NOW, TZ)).toBe('Kararını bekliyor · en eskisi dün 16:20')
  })

  it('zaman alanı yoksa "en eskisi" yok; boş listede yalnız not', () => {
    expect(approvalsNote([item({ file_count: 1, submitted_at: null })], NOW, TZ)).toBe(
      'Kanıt yüklendi, kararını bekliyor',
    )
    expect(approvalsNote([], NOW, TZ)).toBe('Kararını bekliyor')
  })

  it('satır: "gönderildi ‹n› önce" ve "‹n› dosya"; alan yok/0 → gizli', () => {
    expect(
      approvalRowParts(item({ file_count: 4, submitted_at: '2026-10-20T10:00:00Z' }), NOW, TZ),
    ).toEqual({ sent: 'gönderildi 2 sa önce', files: '4 dosya' })
    expect(approvalRowParts(item({ file_count: 0, submitted_at: null }), NOW, TZ)).toEqual({
      sent: null,
      files: null,
    })
  })
})
