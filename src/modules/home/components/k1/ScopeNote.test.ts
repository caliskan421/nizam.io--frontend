import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScopeNote from './ScopeNote.vue'

describe('ScopeNote (CX-F6-E-03)', () => {
  it('tavanda "ilk N görev" + Devam et; hatada Yeniden dene; yüklenirken eylem yok', async () => {
    const capped = mount(ScopeNote, { props: { scope: 'capped', loaded: 1000 } })
    expect(capped.text()).toContain('Yalnız ilk 1000 görev yüklendi')
    await capped.get('[data-action="scope-more"]').trigger('click')
    expect(capped.emitted('more')).toHaveLength(1)
    expect(capped.get('[data-action="scope-more"]').text()).toBe('Devam et')

    const failed = mount(ScopeNote, { props: { scope: 'failed', loaded: 200 } })
    expect(failed.text()).toContain('sonraki sayfa yüklenemedi')
    expect(failed.get('[data-action="scope-more"]').text()).toBe('Yeniden dene')

    const loading = mount(ScopeNote, { props: { scope: 'loading', loaded: 200 } })
    expect(loading.find('[data-action="scope-more"]').exists()).toBe(false)
  })

  it('compact: yalnız kısa etiket, eylem yok', () => {
    const note = mount(ScopeNote, { props: { scope: 'capped', loaded: 7, compact: true } })
    expect(note.text()).toBe('İlk 7 görev içinde')
    expect(note.find('button').exists()).toBe(false)
  })
})
