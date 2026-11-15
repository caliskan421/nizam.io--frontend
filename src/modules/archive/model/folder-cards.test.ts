import { describe, expect, it } from 'vitest'

import { FOLDER_CARD_PAGE, archiveFolderCards, pageCards } from './folder-cards'

const folder = (over: Record<string, unknown>) => ({
  folder_id: 'd1',
  name: 'Ağ',
  file_count: 0,
  task_count: 0,
  total_bytes: 0,
  last_uploaded_at: null,
  is_virtual: false,
  ...over,
})

describe('06 klasör kartları', () => {
  it('yönetici (programArchiveFolders) ve K/Ü aynı biçim: sunucu sayıları, ada göre sıra, rozet yok', () => {
    const cards = archiveFolderCards([
      folder({ folder_id: 'd2', name: 'Zemin', file_count: 5 }),
      folder({ folder_id: 'd1', name: 'Ağ', file_count: 0 }),
    ])
    expect(cards).toEqual([
      { folderId: 'd1', name: 'Ağ', fileCount: 0, virtual: false },
      { folderId: 'd2', name: 'Zemin', fileCount: 5, virtual: false },
    ])
    expect(JSON.stringify(cards)).not.toMatch(/grup|group|code/i)
  })

  it('dosya sayısına göre sıra: azalan, eşitte ada', () => {
    const list = [
      folder({ folder_id: 'a', name: 'A', file_count: 1 }),
      folder({ folder_id: 'b', name: 'B', file_count: 7 }),
      folder({ folder_id: 'c', name: 'C', file_count: 7 }),
    ]
    expect(archiveFolderCards(list, 'dosya', 'azalan').map((c) => c.folderId)).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('K/Ü: archiveFolders sayılarıyla; sanal klasör işaretli', () => {
    expect(
      archiveFolderCards([
        folder({ folder_id: 'my-tasks', name: 'Görevlerim', file_count: 4, is_virtual: true }),
      ]),
    ).toEqual([{ folderId: 'my-tasks', name: 'Görevlerim', fileCount: 4, virtual: true }])
    expect(archiveFolderCards(undefined)).toEqual([])
  })

  it('ilk 12 kart + kalan; genişletince hepsi', () => {
    const cards = Array.from({ length: 15 }, (_, i) => ({
      folderId: `d${i}`,
      name: `D${i}`,
      fileCount: 0,
      virtual: false,
    }))
    expect(FOLDER_CARD_PAGE).toBe(12)
    expect(pageCards(cards, false)).toMatchObject({ remaining: 3 })
    expect(pageCards(cards, false).shown).toHaveLength(12)
    expect(pageCards(cards, true)).toMatchObject({ remaining: 0 })
    expect(pageCards(cards, true).shown).toHaveLength(15)
    expect(pageCards(cards.slice(0, 5), false).remaining).toBe(0)
  })
})
