import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'
import { trDeletedRecords } from '@/shared/i18n/tr/deleted-records'

import { deletedText } from './messages'

function leaves(node: unknown, path = ''): string[] {
  if (typeof node === 'string') return [path]
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    leaves(value, path ? `${path}.${key}` : key),
  )
}

describe('silinen kayıtlar metinleri (tek kök ağaç, KESİN 24)', () => {
  it('kök yalnız deletedRecords; her yaprak çözülür ve vue-i18n özel karakteri taşımaz', () => {
    expect(Object.keys(trDeletedRecords)).toEqual(['deletedRecords'])
    for (const key of leaves(trDeletedRecords.deletedRecords)) {
      const raw = key
        .split('.')
        .reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)[part],
          trDeletedRecords.deletedRecords,
        ) as string
      expect(i18n.global.te(`deletedRecords.${key}`), key).toBe(true)
      // Yalnız {param} yer tutucusuna izin: @, $, | ve kaçışsız ayraç yok.
      expect(raw.replace(/\{[a-z]+\}/g, ''), key).not.toMatch(/[{}@$|]/)
    }
  })

  it('P37/P44 metinleri ve yer tutucular', () => {
    expect(deletedText('page.retention')).toBe(
      'Silinen kayıtlar bir yönetici kalıcı olarak silene kadar saklanır.',
    )
    expect(deletedText('page.sub.loaded', { n: 3, kind: 'görev' })).toBe(
      '3 görev · yalnız yönetici görür',
    )
    expect(deletedText('confirm.purgeBody')).toBe('Bu işlem geri alınamaz.')
    expect(deletedText('filters.search.placeholder')).toBe('Yüklenen kayıtlarda ara')
    expect(deletedText('footer.more')).toBe('Daha fazla yükle')
  })

  it('saklama süresi / kalan süre / "yakında kalıcı silinecek" metni yok (P37)', () => {
    const all = JSON.stringify(trDeletedRecords)
    expect(all).not.toMatch(/kalan süre|Yakında kalıcı|gün saklanır|30 gün/)
  })
})
