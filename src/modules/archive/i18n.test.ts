import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'
import { trArchive } from '@/shared/i18n/tr/archive'

import { ARCHIVE_KINDS } from './model/mime'
import type { TypeBadge } from './model/mime'

const walk = (node: Record<string, unknown>, prefix: string): [string, string][] =>
  Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string'
      ? [[`${prefix}${k}`, v] as [string, string]]
      : walk(v as Record<string, unknown>, `${prefix}${k}.`),
  )

describe('trArchive (tek kök ağaç)', () => {
  it('kök yalnız archive; her yaprak statik ağaçta çözülür', () => {
    expect(Object.keys(trArchive)).toEqual(['archive'])
    const g = i18n.global
    const entries = walk(trArchive, '')
    expect(entries.length).toBeGreaterThan(20)
    for (const [key, text] of entries) {
      expect(g.te(key), key).toBe(true)
      expect(g.tm(key), key).toBe(text)
    }
  })

  it('O2b alt dalları sahipleriyle hazır (ikinci kök ağaç ya da dosya yok)', () => {
    expect(Object.keys(trArchive.archive)).toEqual(
      expect.arrayContaining([
        'folders',
        'tree',
        'tasks',
        'files',
        'preview',
        'actions',
        'upload',
        'zip',
      ]),
    )
  })

  it('P38: alt başlık "Görevlere yüklenen dosyalar"; "Kurumsal hafıza" yok', () => {
    expect(i18n.global.t('archive.page.subtitle')).toBe('Görevlere yüklenen dosyalar')
    expect(JSON.stringify(trArchive)).not.toMatch(/Kurumsal hafıza/i)
  })

  it('tür segmenti ve rozet adları model kümeleriyle uyumlu', () => {
    for (const kind of ARCHIVE_KINDS) {
      expect(i18n.global.te(`archive.shared.kind.${kind}`), kind).toBe(true)
    }
    const badges: TypeBadge[] = ['IMG', 'PDF', 'DOC', 'XLS', 'PPT', 'TXT', 'ZIP', 'DOSYA']
    for (const badge of badges) expect(i18n.global.te(`archive.type.${badge}`), badge).toBe(true)
    expect(i18n.global.te('archive.shared.kind.pdf')).toBe(false)
  })

  it('yönetici boş durumu anahtarı (BE-072) çözülür', () => {
    expect(i18n.global.t('archive.shared.selectTask')).toBe('Görev klasörü seçin')
  })
})
