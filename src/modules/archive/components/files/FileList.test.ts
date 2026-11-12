import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import type { FileListProps } from '../index'
import FileList from './FileList.vue'
import { BASE } from './files.fixtures'

const mounted: ReturnType<typeof mount>[] = []
function mountList(over: Partial<FileListProps> = {}) {
  const wrapper = mount(FileList, { props: { ...BASE, ...over }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
})

describe('FileList (E-06-61)', () => {
  it('sütunlar ad/görev/tür/boyut/etiket mevcut alanlarla', () => {
    const w = mountList()
    expect(w.findAll('th').map((h) => h.text())).toEqual(['Ad', 'Görev', 'Tür', 'Boyut', 'Etiket'])
    const cells = w.findAll('tbody tr')[0]!.findAll('td')
    expect(cells.map((c) => c.text())).toEqual([
      'saha.jpeg',
      'Gölgelendirme çalışmaları',
      'IMG',
      '2,0 KB',
      'Girdi',
    ])
  })

  it('seçili satır aria-selected; ad düğmesi select(file_id)', async () => {
    const w = mountList({ selectedFileId: 'f3' })
    const rows = w.findAll('tbody tr')
    expect(rows[2]!.attributes('aria-selected')).toBe('true')
    expect(rows[0]!.attributes('aria-selected')).toBe('false')
    await w.find('[data-file-id="f1"]').trigger('click')
    expect(w.emitted('select')).toEqual([['f1']])
  })

  it('daha fazla yükle ve durumlar ızgarayla aynı sözleşme', async () => {
    const w = mountList({ hasMore: true })
    await w.find('.arch-files__more').trigger('click')
    expect(w.emitted('loadMore')).toHaveLength(1)
    await w.setProps({ needsTask: true })
    expect(w.find('table').exists()).toBe(false)
    expect(w.find('[data-testid="files-needs-task"]').exists()).toBe(true)
    await w.setProps({ needsTask: false, files: [] })
    expect(w.find('[data-testid="files-empty"]').exists()).toBe(true)
  })
})
