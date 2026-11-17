import { describe, expect, it } from 'vitest'

import { trArchive } from './tr/archive'
import { trDeletedRecords } from './tr/deleted-records'
import { trErrors } from './tr/errors'
import { trMeetings } from './tr/meetings'
import { trNotes, trSubtasks, trWorkFiles } from './tr/work'

// v0.26 (ADR-0053/0054): dosya, alt görev, görev notu ve toplantı notu silmesi çöpe taşır; saklama
// süresizdir ve geri yükleme/kalıcı silme yalnız şirket yöneticisindedir. Silme onayı bunu söyler.
const TRASH = 'silinen kayıtlara taşınır'
const ADMIN = 'Bir şirket yöneticisi geri yükleyebilir veya kalıcı silebilir.'

describe('çöpe taşıyan silme onay metinleri', () => {
  const texts = {
    'arşiv dosyası': trArchive.archive.actions.removeBody,
    'görev dosyası': trWorkFiles.workFiles.remove.body,
    'alt görev': trSubtasks.subtasks.confirm.body,
    'görev notu': trNotes.work.notes.confirmBody,
    'toplantı notu': trMeetings.meetings.notes.deleteBody,
  }

  it.each(Object.entries(texts))(
    '%s: çöp ve yönetici ifadesi, "kalıcı/geri alınamaz" yok',
    (_, t) => {
      expect(t).toContain(TRASH)
      expect(t).toContain(ADMIN)
      expect(t).not.toMatch(/geri alınamaz|kalıcı olarak/)
    },
  )

  it('alt görevin dosyaları görevde kalır uyarısı korunur', () => {
    expect(trSubtasks.subtasks.confirm.body).toContain('{title}')
    expect(trSubtasks.subtasks.confirm.body).toContain('bağlı dosyalar görevde kalır')
  })

  it('yönetici gerçek kalıcı silme metinleri değişmez', () => {
    expect(trDeletedRecords.deletedRecords.confirm.purgeBody).toBe('Bu işlem geri alınamaz.')
    expect(trMeetings.meetings.deleted.confirmBody).toBe('Bu işlem geri alınamaz.')
  })

  it('v0.26 çöp 409 kodları açık Türkçe metin taşır', () => {
    for (const code of [
      'collaboration.meeting_deleted',
      'records.not_deleted',
      'records.permanent_requires_deleted',
      'records.source_completed',
      'records.work_item_deleted',
    ] as const) {
      expect(trErrors[code]).toMatch(/\S/)
    }
    expect(trErrors['records.work_item_deleted']).toContain('geri yükleyin')
  })
})
