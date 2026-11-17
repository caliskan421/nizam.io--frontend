import type { MutationOutcome } from '@/shared/http/mutation'
import { describe, expect, it } from 'vitest'

import { interpretChildOutcome } from './outcome-child'

const ok = (data: unknown) =>
  ({ kind: 'success', data }) as unknown as MutationOutcome<unknown, unknown, unknown>
const fail = (code: string) =>
  ({ kind: 'failed', error: { code } }) as unknown as MutationOutcome<unknown, unknown, unknown>

describe('çocuk tür sonuç yorumu', () => {
  it('dosya geri yükleme: ad numaralandıysa yeni ad söylenir, değilse düz mesaj', () => {
    const renamed = interpretChildOutcome(
      'restore',
      'rapor.csv',
      ok({ file_id: 'f', status: 'restored', display_name: 'rapor (2).csv', renamed: true }),
    )
    expect(renamed).toEqual({
      kind: 'done',
      message:
        'rapor.csv geri yüklendi; aynı ad görevde kullanıldığı için “rapor (2).csv” olarak adlandırıldı.',
    })
    const plain = interpretChildOutcome(
      'restore',
      'rapor.csv',
      ok({ file_id: 'f', status: 'restored', display_name: 'rapor.csv', renamed: false }),
    )
    expect(plain).toEqual({ kind: 'done', message: 'rapor.csv geri yüklendi.' })
  })

  it('kalıcı silme başarısı; 404 dosya yok: kalıcı silmede başarı, geri yüklemede yenile', () => {
    expect(interpretChildOutcome('purge', 'a', ok({ status: 'purged' }))?.kind).toBe('done')
    expect(interpretChildOutcome('purge', 'a', fail('records.file_not_found'))?.kind).toBe('gone')
    expect(interpretChildOutcome('restore', 'a', fail('records.file_not_found'))?.kind).toBe(
      'refresh',
    )
  })

  it.each([
    ['records.not_deleted', 'gone', 'Kayıt zaten geri yüklenmiş.'],
    ['records.permanent_requires_deleted', 'refresh', 'Kayıt silinmiş durumda değil.'],
    ['records.work_item_deleted', 'refresh', 'Önce kaydın bağlı olduğu görevi geri yükleyin.'],
    ['work.item_deleted', 'refresh', 'Önce kaydın bağlı olduğu görevi geri yükleyin.'],
    [
      'collaboration.meeting_deleted',
      'refresh',
      'Önce kaydın bağlı olduğu toplantıyı geri yükleyin.',
    ],
    [
      'records.too_many_files',
      'refresh',
      'Görevin dosya sınırına ulaşıldı; dosya geri yüklenemedi.',
    ],
    [
      'work.subtask_limit_reached',
      'refresh',
      'Görevin alt görev sınırına ulaşıldı; alt görev geri yüklenemedi.',
    ],
    ['work.item_completed', 'refresh', 'Görev tamamlanmış; açık alt görev geri yüklenemez.'],
    [
      'collaboration.agenda_limit_reached',
      'refresh',
      'Toplantının gündem sınırına ulaşıldı; madde geri yüklenemedi.',
    ],
    ['records.transfer_active', 'refresh', 'Devam eden bir aktarım nedeniyle işlem yapılamadı.'],
  ])('%s → %s', (code, kind, message) => {
    expect(interpretChildOutcome('restore', 'x', fail(code))).toEqual({ kind, message })
  })

  it('bilinmeyen kod ve bilinmeyen sonuç ortak bildirime bırakılır', () => {
    expect(interpretChildOutcome('restore', 'x', fail('platform.rate_limited'))).toBeNull()
    expect(
      interpretChildOutcome('restore', 'x', {
        kind: 'unknown_outcome',
      } as unknown as MutationOutcome<unknown, unknown, unknown>),
    ).toBeNull()
  })
})
