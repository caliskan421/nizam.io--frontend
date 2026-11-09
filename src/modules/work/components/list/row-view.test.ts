import { describe, expect, it } from 'vitest'

import { WORK_ITEM_STATUSES } from '../../model/types'
import { taskListText, trTaskList } from './messages'
import { dueNote, personName, requestTag, STATUS_DOT, statusLabel, subtaskToggle } from './row-view'

const base = {
  status: 'devam_ediyor',
  is_overdue: false,
  days_overdue: 0,
  end_on: '2026-11-12',
} as const

describe('satır gösterimi', () => {
  it('5 durum: etiket + nokta (iade_edildi = Geri gönderildi, back)', () => {
    expect(WORK_ITEM_STATUSES.map((s) => [statusLabel(s), STATUS_DOT[s]])).toEqual([
      ['Başlamadı', 'todo'],
      ['Devam ediyor', 'doing'],
      ['Onay bekliyor', 'review'],
      ['Geri gönderildi', 'back'],
      ['Tamamlandı', 'done'],
    ])
  })

  it('gecikmiş (sunucu days_overdue) / zamanında (istemci kalan) / tamamlanmış (not yok)', () => {
    expect(dueNote({ ...base, is_overdue: true, days_overdue: 88 }, '2026-11-09')).toEqual({
      text: '88 gün gecikti',
      tone: 'danger',
    })
    expect(dueNote(base, '2026-11-09')).toEqual({ text: '3 gün kaldı', tone: 'faint' })
    expect(dueNote({ ...base, status: 'tamamlandi', is_overdue: false }, '2026-11-09')).toBeNull()
    // Saat farkıyla sunucu bayrağı henüz gelmediyse eksi gün yazılmaz.
    expect(dueNote(base, '2026-11-13')).toBeNull()
  })

  it('talep etiketi + ipucu eski → yeni; talepsiz null', () => {
    expect(
      requestTag({
        end_on: '2026-09-05',
        pending_date_request: {
          request_id: 'r',
          new_start_on: '2026-09-01',
          new_end_on: '2026-11-15',
        },
      }),
    ).toEqual({ label: 'Talep · 15 Kas', title: 'Bitiş 05 Eyl → 15 Kas talep edildi' })
    expect(requestTag({ end_on: '2026-09-05', pending_date_request: null })).toBeNull()
  })

  it('null ad → Bilinmeyen kişi', () => {
    expect(personName(null)).toBe('Bilinmeyen kişi')
    expect(personName('  ')).toBe('Bilinmeyen kişi')
    expect(personName('Ayşe')).toBe('Ayşe')
  })

  it('alt görev düğmesi data-has / data-done / etiket', () => {
    expect(subtaskToggle({ total: 0, done: 0 })).toEqual({
      has: false,
      done: false,
      label: '+ alt',
    })
    expect(subtaskToggle({ total: 4, done: 2 })).toEqual({ has: true, done: false, label: '2/4' })
    expect(subtaskToggle({ total: 3, done: 3 })).toEqual({ has: true, done: true, label: '3/3' })
  })

  it('metinler i18n ağacından', () => {
    expect(taskListText('taskList.column.bitis')).toBe(trTaskList.taskList.column.bitis)
  })
})
