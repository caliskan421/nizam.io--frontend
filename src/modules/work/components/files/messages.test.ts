import { describe, expect, it } from 'vitest'

import { filesText, trWorkFiles } from './messages'

describe('dosya metinleri (W46)', () => {
  it('workFiles.* anahtarları TR ağacından okunur, parametre yerleşir', () => {
    expect(filesText('workFiles.upload.task')).toBe('Kanıt dosyası yükle')
    expect(filesText('workFiles.row.downloadOf', { name: 'a.pdf' })).toBe('a.pdf dosyasını indir')
  })

  it('her etiket değerinin metni var (kapalı küme, P5)', () => {
    expect(Object.keys(trWorkFiles.workFiles.tag).sort()).toEqual(
      ['analiz', 'cikti', 'girdi', 'ister', 'plan', 'sonuc'].sort(),
    )
  })
})
