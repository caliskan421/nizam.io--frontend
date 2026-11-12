import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import type { FolderTreeProps } from '../index'
import FolderTree from './FolderTree.vue'

const FOLDERS = [
  { folderId: 'd1', name: 'Altyapı ve tesisat', fileCount: 15, virtual: false },
  { folderId: 'd2', name: 'Mekanik sistemler', fileCount: 38, virtual: false },
]
const TASKS = [
  { work_item_id: 'w1', title: 'Gölgelendirme çalışmaları', file_count: 2 },
  { work_item_id: 'w2', title: 'İklimlendirme hesapları', file_count: 1 },
]

function props(over: Partial<FolderTreeProps> = {}): FolderTreeProps {
  return {
    folders: FOLDERS,
    activeFolderId: 'd1',
    tasks: TASKS,
    selectedTaskId: null,
    truncated: false,
    loadingTasks: false,
    ...over,
  }
}

const mounted: ReturnType<typeof mount>[] = []
function mountTree(over: Partial<FolderTreeProps> = {}) {
  const wrapper = mount(FolderTree, { props: props(over), attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
})

describe('FolderTree (E-06-27…30)', () => {
  it('düzey 0 tüm klasörler; düzey 1 yalnız açık klasörün görevleri', () => {
    const w = mountTree()
    expect(w.findAll('[data-folder-id]').map((n) => n.attributes('data-folder-id'))).toEqual([
      'd1',
      'd2',
    ])
    expect(w.findAll('[data-task-id]').map((n) => n.attributes('data-task-id'))).toEqual([
      'w1',
      'w2',
    ])
    // Görevler d1'in hemen altında; d2 düğümü ondan sonra gelir.
    const order = w.findAll('button.arch-node').map((n) => n.text())
    expect(order[0]).toContain('Altyapı ve tesisat')
    expect(order[1]).toContain('Gölgelendirme çalışmaları')
    expect(order[3]).toContain('Mekanik sistemler')
  })

  it('sayaçlar: klasör dosya sayısı, görev dosya sayısı; sayı yoksa statik —', () => {
    const w = mountTree({ folders: [{ ...FOLDERS[0]!, fileCount: null }] })
    const counts = w.findAll('.rp-count').map((c) => c.text())
    expect(counts).toEqual(['—', '2', '1'])
  })

  it('aria-current: görev yokken klasör, görev seçiliyken yalnız görev düğümü', async () => {
    const w = mountTree()
    expect(w.find('[data-folder-id="d1"]').attributes('aria-current')).toBe('page')
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
    await w.setProps({ selectedTaskId: 'w2' })
    expect(w.find('[data-folder-id="d1"]').attributes('aria-current')).toBeUndefined()
    expect(w.find('[data-task-id="w2"]').attributes('aria-current')).toBe('page')
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('başka klasör selectFolder; açık klasör + seçili görev selectTask(null); görev selectTask(id)', async () => {
    const w = mountTree({ selectedTaskId: 'w1' })
    await w.find('[data-folder-id="d2"]').trigger('click')
    expect(w.emitted('selectFolder')).toEqual([['d2']])
    await w.find('[data-folder-id="d1"]').trigger('click')
    expect(w.emitted('selectTask')).toEqual([[null]])
    await w.find('[data-task-id="w2"]').trigger('click')
    expect(w.emitted('selectTask')?.[1]).toEqual(['w2'])
  })

  it('açık klasöre görev seçili değilken basmak hiçbir şey yaymaz', async () => {
    const w = mountTree()
    await w.find('[data-folder-id="d1"]').trigger('click')
    expect(w.emitted('selectFolder')).toBeUndefined()
    expect(w.emitted('selectTask')).toBeUndefined()
  })

  it('klavye: ↓/↑/End/Home düğümler arasında odak taşır', async () => {
    const w = mountTree()
    const nodes = w.findAll('button.arch-node')
    ;(nodes[0]!.element as HTMLElement).focus()
    await nodes[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(nodes[1]!.element)
    await nodes[1]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(nodes[3]!.element)
    await nodes[3]!.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(nodes[2]!.element)
    await nodes[2]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(nodes[0]!.element)
  })

  it('yükleniyor iskeleti, kesilme uyarısı; konumlandırılmış etiketler', () => {
    const w = mountTree({ loadingTasks: true, tasks: [], truncated: true })
    expect(w.find('[role="status"]').attributes('aria-label')).toBe('Görev klasörleri yükleniyor')
    expect(w.text()).toContain('Görev listesi kesildi')
    expect(w.attributes('aria-label')).toBe('Klasör ağacı')
    expect(w.text()).toContain('koordinatörlükler')
  })

  it('yalnız tek düğüm (K/Ü) ve "grup" rozeti yok', () => {
    const w = mountTree({ folders: [FOLDERS[0]!] })
    expect(w.findAll('[data-folder-id]')).toHaveLength(1)
    expect(w.text()).not.toMatch(/çalışma grubu|grup/i)
  })
})
