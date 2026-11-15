import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import {
  FALLBACK_ENTRY,
  KNOWN_NOTIFICATION_TYPES,
  NOTIFICATION_DICTIONARY,
  describeNotification,
} from './dictionary'

// 14 `backend.md` §4.1: events.md'de "kuyruğa → notifications" işaretli 12 tür + F8 (pin v0.23.0-api) `work.task.reminder`.
const TWELVE = [
  'work.item.created',
  'work.item.transitioned',
  'work.item.assignment_changed',
  'work.item.date_changed',
  'work.date_change.requested',
  'work.date_change.reviewed',
  'work.task.reminder',
  'collaboration.meeting.created',
  'collaboration.meeting.updated',
  'organization.membership.assigned',
  'organization.membership.removed',
  'organization.membership.role_changed',
  'program.transfer.completed',
]

const SENTENCES: Record<string, [string, string]> = {
  'work.item.created': ['Görev', 'Yeni görev oluşturuldu'],
  'work.item.transitioned': ['Görev', 'Bir görevin durumu değişti'],
  'work.item.assignment_changed': ['Atama', 'Bir görevin ataması değişti'],
  'work.item.date_changed': ['Tarih', 'Bir görevin tarihi değişti'],
  'work.date_change.requested': ['Tarih talebi', 'Yeni tarih talebi'],
  'work.date_change.reviewed': ['Tarih talebi', 'Tarih talebi sonuçlandı'],
  'work.task.reminder': ['Hatırlatma', 'Bir görev için hatırlatma var'],
  'collaboration.meeting.created': ['Toplantı', 'Yeni toplantı'],
  'collaboration.meeting.updated': ['Toplantı', 'Toplantı üyelere açıldı'],
  'organization.membership.assigned': ['Ekip', 'Ekibe yeni üye atandı'],
  'organization.membership.removed': ['Ekip', 'Ekipten üye çıkarıldı'],
  'organization.membership.role_changed': ['Ekip', 'Ekipte üye rolü değişti'],
  'program.transfer.completed': ['Aktarım', 'Görev aktarımı tamamlandı'],
}

describe('bildirim sözlüğü (13 tür)', () => {
  it('tam 13 tür; backend.md §4.1 + events.md work.task.reminder ile aynı küme', () => {
    expect([...KNOWN_NOTIFICATION_TYPES].sort()).toEqual([...TWELVE].sort())
  })

  it.each(TWELVE)('%s: etiket ve cümle backend.md ile birebir; metin sözlükte var', (type) => {
    const { entry, known } = describeNotification({ type })
    expect(known).toBe(true)
    const [label, text] = SENTENCES[type]!
    expect(i18n.global.t(`notifications.rows.types.${entry.id}.label`)).toBe(label)
    expect(i18n.global.t(`notifications.rows.types.${entry.id}.text`)).toBe(text)
  })

  it('bilinmeyen tür genel satıra düşer ("Yeni bildirim", zil, nötr ton, hedefsiz)', () => {
    const { entry, known } = describeNotification({ type: 'x.y.z' })
    expect(known).toBe(false)
    expect(entry).toBe(FALLBACK_ENTRY)
    expect(i18n.global.t(`notifications.rows.types.${entry.id}.text`)).toBe('Yeni bildirim')
    expect(entry).toMatchObject({ icon: 'bell', tone: 'muted', subject: 'unknown', action: null })
  })

  it('Object prototipi anahtarları bilinen tür sayılmaz', () => {
    expect(describeNotification({ type: 'constructor' }).known).toBe(false)
    expect(describeNotification({ type: '__proto__' }).known).toBe(false)
  })

  it('ek düğmeler: yalnız tarih talebi "İncele", toplantı "Gündemi aç"', () => {
    const actions = Object.fromEntries(
      Object.entries(NOTIFICATION_DICTIONARY).map(([type, e]) => [type, e.action]),
    )
    expect(actions['work.date_change.requested']).toBe('review')
    expect(actions['collaboration.meeting.created']).toBe('agenda')
    expect(actions['collaboration.meeting.updated']).toBe('agenda')
    expect(Object.values(actions).filter(Boolean)).toHaveLength(3)
  })
})
