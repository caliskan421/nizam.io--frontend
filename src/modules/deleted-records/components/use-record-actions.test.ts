import { describe, expect, it } from 'vitest'

import { fixtureRow } from '../__tests__/fixtures'
import { confirmOptions } from './use-record-actions'

describe('onay seçenekleri (E-12-58/59)', () => {
  it('geri yükle: birincil ton, etkilenen kayıt 1, türe özgü uyarı', () => {
    const options = confirmOptions('restore', fixtureRow())
    expect(options).toMatchObject({
      title: 'Saha pano montajı geri yüklensin mi?',
      confirmLabel: 'Geri yükle',
      tone: 'primary',
    })
    expect(options.body).toEqual([
      'Bu işlem 1 kaydı geri yükler.',
      'Koordinatörlüğü silinmişse görev geri yüklenemez.',
    ])
    expect(confirmOptions('restore', fixtureRow({ kind: 'toplanti' })).body).toContain(
      'Canlı konferans geri gelmez.',
    )
    expect(confirmOptions('restore', fixtureRow({ kind: 'kullanici' })).body).toContain(
      'Devredilmiş açık görev atamaları geri dönmez.',
    )
    expect(confirmOptions('restore', fixtureRow({ kind: 'koordinatorluk' })).body).toContain(
      'Üyelik yetkileri geri döner, koordinatörlüğün görevleri dönmez.',
    )
  })

  it('kalıcı sil: tehlike tonu, "geri alınamaz", görevde dosya sayısı', () => {
    const task = confirmOptions('purge', fixtureRow({ fileCount: 3 }))
    expect(task).toMatchObject({ tone: 'danger', confirmLabel: 'Kalıcı sil' })
    expect(task.title).toBe('Saha pano montajı kalıcı olarak silinsin mi?')
    expect(task.body).toEqual(['Bu işlem geri alınamaz.', '3 dosya da silinir.'])
    expect(confirmOptions('purge', fixtureRow({ fileCount: 0 })).body).toEqual([
      'Bu işlem geri alınamaz.',
    ])
    expect(
      confirmOptions('purge', fixtureRow({ kind: 'kullanici', fileCount: null })).body,
    ).toEqual(['Bu işlem geri alınamaz.'])
  })
})
