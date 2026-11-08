import { describe, expect, it } from 'vitest'

import { FILE_TAGS } from '../../model/types'
import { fileItem } from './__tests__/support'
import {
  evidenceFileName,
  filesOfSubtask,
  formatFileSize,
  isFileTag,
  normalizedName,
  slotLabel,
  tagLabel,
  tagOptions,
  uploaderName,
} from './model'

describe('dosya modeli (W46)', () => {
  it('etiket kapalı kümesi: yalnız sözleşme değerleri (P5); varsayılan/boş geçersiz', () => {
    for (const tag of FILE_TAGS) expect(isFileTag(tag)).toBe(true)
    expect(isFileTag('')).toBe(false)
    expect(isFileTag('kanit')).toBe(false)
  })

  it('etiket seçici seçenekleri sözleşme sırasında, Türkçe etiketlerle', () => {
    expect(tagOptions()).toEqual([
      { value: 'ister', label: 'İster' },
      { value: 'plan', label: 'Plan' },
      { value: 'girdi', label: 'Girdi' },
      { value: 'analiz', label: 'Analiz' },
      { value: 'cikti', label: 'Çıktı' },
      { value: 'sonuc', label: 'Sonuç' },
    ])
    // Küme dışı (yeni sunucu değeri) olduğu gibi gösterilir.
    expect(tagLabel('yeni')).toBe('yeni')
  })

  it('boyut: 1024 tabanı, en çok bir ondalık, tr biçimi', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(900)).toBe('900 B')
    expect(formatFileSize(2048)).toBe('2 KB')
    expect(formatFileSize(1536)).toBe('1,5 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
    expect(formatFileSize(3 * 1024 ** 4)).toBe('3.072 GB')
  })

  it('yükleyen adı yoksa "Bilinmeyen kişi" (G4)', () => {
    expect(uploaderName(fileItem())).toBe('Ayşe')
    expect(uploaderName(fileItem({ uploaded_by_full_name: null }))).toBe('Bilinmeyen kişi')
  })

  it('E-03-50: son dosyanın adı, dosya yoksa null', () => {
    expect(evidenceFileName([])).toBeNull()
    const files = [fileItem(), fileItem({ file_id: 'f2', display_name: 'son.png' })]
    expect(evidenceFileName(files)).toBe('son.png')
  })

  it('E-03-35: alt göreve bağlı dosyalar ve yuva etiketi ("ad +n")', () => {
    const files = [
      fileItem({ file_id: 'a', subtask_id: 's1', display_name: 'bir.pdf' }),
      fileItem({ file_id: 'b', display_name: 'gorev.pdf' }),
      fileItem({ file_id: 'c', subtask_id: 's1', display_name: 'iki.pdf' }),
      fileItem({ file_id: 'd', subtask_id: 's2', display_name: 'diger.pdf' }),
    ]
    const own = filesOfSubtask(files, 's1')
    expect(own.map((f) => f.file_id)).toEqual(['a', 'c'])
    expect(slotLabel(own)).toBe('iki.pdf +1')
    expect(slotLabel(filesOfSubtask(files, 's2'))).toBe('diger.pdf')
    expect(slotLabel(filesOfSubtask(files, 's3'))).toBeNull()
  })

  it('ad taslağı kırpılır; boşsa null', () => {
    expect(normalizedName('  yeni.pdf ')).toBe('yeni.pdf')
    expect(normalizedName('   ')).toBeNull()
  })
})
