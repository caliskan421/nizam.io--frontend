import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import type { FileGridProps } from '../index'
import FileGrid from './FileGrid.vue'
import { BASE } from './files.fixtures'

const mounted: ReturnType<typeof mount>[] = []
function mountGrid(over: Partial<FileGridProps> = {}) {
  const wrapper = mount(FileGrid, { props: { ...BASE, ...over }, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
})

describe('FileGrid (E-06-41…45)', () => {
  it('kart: ad, görev adı, tür rozeti (küçük resim yok) ve etiket noktası', () => {
    const w = mountGrid()
    const cards = w.findAll('button.arch-card')
    expect(cards).toHaveLength(4)
    const first = cards[0]!
    expect(first.find('.arch-card__name').text()).toBe('saha.jpeg')
    expect(first.find('.arch-card__task').text()).toBe('Gölgelendirme çalışmaları')
    expect(first.find('.arch-badge').text()).toBe('IMG')
    expect(first.find('.arch-dot').attributes('title')).toBe('Girdi')
    expect(w.find('img').exists()).toBe(false)
    expect(cards[1]!.find('.arch-badge').text()).toBe('DOC')
  })

  it('görev adı sözlükte yoksa statik —; bilinmeyen etiket nötr, ham adıyla', () => {
    const w = mountGrid()
    const third = w.findAll('button.arch-card')[2]!
    expect(third.find('.arch-card__task').text()).toBe('—')
    expect(third.find('.arch-dot').attributes('title')).toBe('bilinmeyen')
    expect(third.find('.arch-dot').attributes('style')).toContain('--ink-muted')
  })

  it('alt görev satırı yalnız subtask_id olan dosyada, ad göstermeden', () => {
    const w = mountGrid()
    const subs = w.findAll('[data-testid="file-subtask"]')
    expect(subs).toHaveLength(1)
    expect(subs[0]!.text()).toBe('↳ Alt görev')
  })

  it('seçili kart aria-pressed; tıklama select(file_id)', async () => {
    const w = mountGrid({ selectedFileId: 'f2' })
    expect(w.find('[data-file-id="f2"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('[data-file-id="f1"]').attributes('aria-pressed')).toBe('false')
    await w.find('[data-file-id="f1"]').trigger('click')
    expect(w.emitted('select')).toEqual([['f1']])
  })

  it('"Daha fazla yükle" yalnız hasMore iken; yüklerken devre dışı', async () => {
    const w = mountGrid()
    expect(w.find('.arch-files__more').exists()).toBe(false)
    await w.setProps({ hasMore: true })
    await w.find('.arch-files__more').trigger('click')
    expect(w.emitted('loadMore')).toHaveLength(1)
    await w.setProps({ loading: true })
    expect(w.find('.arch-files__more').attributes('disabled')).toBeDefined()
  })

  it('durumlar: yönetici görev seçmemiş, hata (yeniden dene), ilk yükleme, boş', async () => {
    const w = mountGrid({ needsTask: true })
    expect(w.find('[data-testid="files-needs-task"]').text()).toContain('Görev klasörü seçin')
    expect(w.find('button.arch-card').exists()).toBe(false)
    await w.setProps({ needsTask: false, error: true })
    expect(w.find('[data-testid="files-error"]').exists()).toBe(true)
    await w.find('[data-testid="files-error"] button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    await w.setProps({ error: false, files: [], loading: true })
    expect(w.find('[data-testid="files-loading"]').attributes('aria-busy')).toBe('true')
    await w.setProps({ loading: false })
    expect(w.find('[data-testid="files-empty"]').exists()).toBe(true)
  })
})
