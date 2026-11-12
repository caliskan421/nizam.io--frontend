import type { DeletedRow } from '../model/types'

// Bileşen testleri için satır fikstürü (örnek veri; gerçek değildir).
export function fixtureRow(over: Partial<DeletedRow> = {}): DeletedRow {
  return {
    kind: 'gorev',
    id: 'w1',
    key: 'gorev:w1',
    title: 'Saha pano montajı',
    code: null,
    subLine: 'Mekanik › Görevler',
    deletedAt: '2026-11-12T10:42:00Z',
    actor: null,
    departmentIds: ['d1'],
    searchText: 'saha pano montajı',
    status: 'devam_ediyor',
    fileCount: 2,
    place: null,
    inviteMode: null,
    departmentNames: ['Mekanik'],
    departmentKind: null,
    ...over,
  }
}
