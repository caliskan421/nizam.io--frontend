import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { http, json, ORIGIN, requests, resetHarness, server } from '../../model/__tests__/harness'
import { fileItem, item, mountWith, settle } from './__tests__/support'
import FileRow from './FileRow.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())
enableAutoUnmount(afterEach)

function row(props: Record<string, unknown> = {}) {
  return mountWith(
    FileRow,
    { item, file: fileItem(), canRename: true, canDelete: true, ...props },
    { standing: null },
  )
}

describe('FileRow (W46 · E-03-61)', () => {
  it('ad + etiket · boyut · yükleyen; adsız yükleyen "Bilinmeyen kişi"', () => {
    const { wrapper } = row({ file: fileItem({ uploaded_by_full_name: null, tag: 'girdi' }) })
    expect(wrapper.text()).toContain('rapor.pdf')
    expect(wrapper.text()).toContain('Girdi · 2 KB · Bilinmeyen kişi')
    expect(wrapper.text()).not.toContain('alt göreve bağlı')
  })

  it('yetkisiz eylemler gizli (devre dışı değil); indir her zaman var', () => {
    const { wrapper } = row({ canRename: false, canDelete: false })
    expect(wrapper.find('[data-testid="file-download"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="file-rename"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="file-delete"]').exists()).toBe(false)
  })

  it('ad değiştir: boş ad reddedilir, aynı ad istek atmadan kapanır, vazgeç taslağı bırakır', async () => {
    const { h, wrapper } = row()
    await wrapper.find('[data-testid="file-rename"]').trigger('click')
    const input = wrapper.find('[data-testid="rename-input"]')
    expect((input.element as HTMLInputElement).value).toBe('rapor.pdf')

    await input.setValue('   ')
    await wrapper.find('[data-testid="rename-form"]').trigger('submit')
    expect(wrapper.text()).toContain('Dosya adı boş olamaz.')

    await input.setValue(' rapor.pdf ')
    await wrapper.find('[data-testid="rename-form"]').trigger('submit')
    await settle(h.queryClient)
    expect(wrapper.find('[data-testid="rename-form"]').exists()).toBe(false)
    expect(requests).toHaveLength(0)
  })

  it('başarıda düzenleme kapanır; görünen ad yeniden okunan listeden gelir (iyimser yok)', async () => {
    server.use(http.patch(`${ORIGIN}/v1/files/f1/name`, () => json(fileItem())))
    const { h, wrapper } = row()
    await wrapper.find('[data-testid="file-rename"]').trigger('click')
    await wrapper.find('[data-testid="rename-input"]').setValue('yeni.pdf')
    await wrapper.find('[data-testid="rename-form"]').trigger('submit')
    await settle(h.queryClient)
    expect(wrapper.find('[data-testid="rename-form"]').exists()).toBe(false)
    // Prop değişmedikçe eski ad görünür: yanıt beklenmeden/yerel olarak ad değişmez.
    expect(wrapper.find('.wf-row__name').text()).toBe('rapor.pdf')
  })
})
