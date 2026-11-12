import { describe, expect, it } from 'vitest'

import * as skeleton from './index'

// O2b sözleşmesi: ad → (bildirilmesi gereken prop'lar, emit adları, sahibi W). Bileşen
// BAĞLANMAZ (dolu gövdeler Pinia / TanStack Query / router ister): yalnız derlenmiş seçenek
// nesnesindeki `props` / `emits` bildirimleri denetlenir; yer tutucu ya da dolu gövdeyle aynı
// sonuç (KESİN 22; web-1 W41b, web-2 W72 dersi).
const CONTRACT = {
  ArchiveSearchBar: [['q', 'kind', 'disabled'], ['update:q', 'update:kind'], 'W122'],
  FolderGrid: [
    ['cards', 'sortField', 'sortDirection', 'loading', 'error'],
    ['open', 'update:sort', 'retry'],
    'W122',
  ],
  FolderCard: [['card'], ['open'], 'W122'],
  TagLegend: [['selected'], ['select'], 'W122'],
  StorageSummary: [['totalFiles', 'loading'], [], 'W122'],
  FolderTree: [
    ['folders', 'activeFolderId', 'tasks', 'selectedTaskId', 'truncated', 'loadingTasks'],
    ['selectFolder', 'selectTask'],
    'W123',
  ],
  TaskFolderCards: [['tasks', 'selectedTaskId', 'truncated', 'loading'], ['select'], 'W123'],
  FileFilterBar: [
    ['tag', 'view', 'loaded', 'total', 'hasMore'],
    ['update:tag', 'update:view'],
    'W123',
  ],
  FileGrid: [
    ['files', 'taskTitles', 'selectedFileId', 'hasMore', 'loading', 'error', 'needsTask'],
    ['select', 'loadMore', 'retry'],
    'W123',
  ],
  FileList: [
    ['files', 'taskTitles', 'selectedFileId', 'hasMore', 'loading', 'error', 'needsTask'],
    ['select', 'loadMore', 'retry'],
    'W123',
  ],
  FilePreview: [
    ['file', 'position', 'total', 'hasMore', 'target', 'taskTitle'],
    ['close', 'previous', 'next', 'deleted', 'renamed', 'openTask'],
    'W124',
  ],
  FileActions: [['file', 'target'], ['deleted', 'renamed'], 'W124'],
  RenameFileDialog: [['open', 'file', 'target'], ['update:open', 'renamed'], 'W124'],
  UploadDialog: [['tasks', 'defaultTaskId'], ['close', 'uploaded'], 'W125'],
  FolderZipButton: [['target', 'folder'], [], 'W126'],
  PeriodZipButton: [['target'], [], 'W126'],
} as const

type Declared = {
  props?: Record<string, unknown> | string[]
  emits?: Record<string, unknown> | string[]
}

function names(option: Declared['props']): string[] {
  if (!option) return []
  return Array.isArray(option) ? option : Object.keys(option)
}

describe('arşiv bileşen iskeleti (W121 → O2b)', () => {
  it('iskelet tam olarak sözleşmedeki on altı bileşeni dışa açar', () => {
    const exported = Object.keys(skeleton).filter((k) => /^[A-Z]/.test(k))
    expect(exported.sort()).toEqual(Object.keys(CONTRACT).sort())
    expect(exported).toHaveLength(16)
  })

  it.each(Object.entries(CONTRACT))('%s: prop/emit bildirimi', (name, [props, emits, owner]) => {
    const component = skeleton[name as keyof typeof CONTRACT] as Declared
    const declaredProps = names(component.props)
    const declaredEmits = names(component.emits)
    for (const prop of props) expect(declaredProps, `${owner} ${name} prop`).toContain(prop)
    for (const emit of emits) expect(declaredEmits, `${owner} ${name} emit`).toContain(emit)
  })

  it('yükleme penceresi sözleşmesi: emits close/uploaded, props tasks/defaultTaskId (W125)', () => {
    const dialog = skeleton.UploadDialog as Declared
    expect(names(dialog.emits).sort()).toEqual(['close', 'uploaded'])
    expect(names(dialog.props).sort()).toEqual(['defaultTaskId', 'tasks'])
  })

  it('bileşenler yetkiyi kendileri hesaplamaz: rol/yönetici olgusu prop adında taşınmaz', () => {
    for (const name of Object.keys(CONTRACT)) {
      const component = skeleton[name as keyof typeof CONTRACT] as Declared
      const declared = [...names(component.props), ...names(component.emits)]
      expect(
        declared.filter((n) => /admin|role|rol|company|koordinator|uye/i.test(n)),
        name,
      ).toEqual([])
    }
  })
})
