import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { trZip, zipText, type ZipTextKey } from './messages'

const leaves = (node: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string'
      ? [`${prefix}${k}`]
      : leaves(v as Record<string, unknown>, `${prefix}${k}.`),
  )

describe('archive.zip metinleri', () => {
  it('her yaprak statik ağaçta çözülür ve zipText aynı metni verir', () => {
    const keys = leaves(trZip)
    expect(keys.length).toBeGreaterThan(8)
    for (const key of keys) {
      expect(i18n.global.te(`archive.zip.${key}`), key).toBe(true)
      expect(zipText(key as ZipTextKey)).toBe(i18n.global.t(`archive.zip.${key}`))
    }
  })

  it('tasarım adları birebir; arşivde silinenler/geri yükleme vaadi yok (E-06-63)', () => {
    expect(zipText('folder.label')).toBe('Klasörü ZIP olarak indir')
    expect(zipText('period.label')).toBe('Tümünü indir')
    expect(JSON.stringify(trZip)).not.toMatch(/silinen|geri yükle/i)
  })
})
