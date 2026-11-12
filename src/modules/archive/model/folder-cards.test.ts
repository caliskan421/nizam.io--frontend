import { describe, expect, it } from 'vitest'

import { FOLDER_CARD_PAGE, adminFolderCards, archiveFolderCards, pageCards } from './folder-cards'

describe('06 klasör kartları', () => {
  it('yönetici: departman adlarından, sayılar null (statik —; BE-072/BE-025), rozet yok', () => {
    const cards = adminFolderCards([
      { department_id: 'd2', display_name: 'Zemin', code: 'ZM' },
      { department_id: 'd1', display_name: 'Ağ' },
    ])
    expect(cards).toEqual([
      { folderId: 'd1', name: 'Ağ', fileCount: null, virtual: false },
      { folderId: 'd2', name: 'Zemin', fileCount: null, virtual: false },
    ])
    expect(JSON.stringify(cards)).not.toMatch(/grup|group|code/i)
  })

  it('yönetici sayıya göre sıra istese de ada düşer (sayı yok)', () => {
    const departments = [
      { department_id: 'b', display_name: 'B' },
      { department_id: 'a', display_name: 'A' },
    ]
    expect(adminFolderCards(departments, 'dosya').map((c) => c.folderId)).toEqual(['a', 'b'])
  })

  it('K/Ü: archiveFolders sayılarıyla; sanal klasör işaretli', () => {
    expect(
      archiveFolderCards([
        { folder_id: 'my-tasks', name: 'Görevlerim', file_count: 4, is_virtual: true },
      ]),
    ).toEqual([{ folderId: 'my-tasks', name: 'Görevlerim', fileCount: 4, virtual: true }])
    expect(archiveFolderCards(undefined)).toEqual([])
  })

  it('ilk 12 kart + kalan; genişletince hepsi', () => {
    const cards = Array.from({ length: 15 }, (_, i) => ({
      folderId: `d${i}`,
      name: `D${i}`,
      fileCount: null,
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
