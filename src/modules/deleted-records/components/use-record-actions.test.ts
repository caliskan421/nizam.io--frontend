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
    expect(confirmOptions('restore', fixtureRow({ kind: 'meetings' })).body).toContain(
      'Canlı konferans geri gelmez.',
    )
    expect(confirmOptions('restore', fixtureRow({ kind: 'accounts' })).body).toContain(
      'Devredilmiş açık görev atamaları geri dönmez.',
    )
    expect(confirmOptions('restore', fixtureRow({ kind: 'departments' })).body).toContain(
      'Üyelik yetkileri geri döner. Koordinatörlükle birlikte silinen görevler, koordinatörlüğün hâlâ bağlı olduğu bütün programlarda geri gelir; daha önce ayrıca silinen görevler ve bağı kalkmış programdaki görevler silinmiş kalır.',
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
    expect(confirmOptions('purge', fixtureRow({ kind: 'accounts', fileCount: null })).body).toEqual(
      ['Bu işlem geri alınamaz.'],
    )
  })
})
