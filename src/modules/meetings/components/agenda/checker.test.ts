import { expect, it } from 'vitest'
import type { AgendaItem, MeetingDetail } from '../../model/types'
import { checker } from './checker'
it('uses participant names and the unknown fallback', () => {
  const item = { checked_by_account_id: 'a', checked_at: '2026-01-01T12:00:00Z' } as AgendaItem
  const participants = [
    { account_id: 'a', full_name: 'Ada Yılmaz' },
  ] as MeetingDetail['participants']
  expect(checker(item, participants, 'UTC', 'Bilinmeyen kişi')).toBe('Ada Y. · 12:00')
  expect(checker(item, [], 'UTC', 'Bilinmeyen kişi')).toBe('Bilinmeyen kişi · 12:00')
})
