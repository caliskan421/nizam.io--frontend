import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import UploadDropZone from './UploadDropZone.vue'

const mountZone = (props: Record<string, unknown> = {}) =>
  mount(UploadDropZone, {
    props: { file: null, disabled: false, ...props },
    global: { plugins: [i18n] },
  })

describe('UploadDropZone', () => {
  it('derlenmiş props/emits bildirimleri', () => {
    const options = UploadDropZone as unknown as { props: object; emits: string[] }
    expect(Object.keys(options.props)).toEqual(['file', 'disabled', 'invalid', 'id', 'describedBy'])
    expect(options.emits).toEqual(['update:file', 'extra'])
  })

  it('bırakma dosyayı bildirir; birden çok dosyada extra true', async () => {
    const wrapper = mountZone()
    const a = new File(['1'], 'a.pdf')
    const b = new File(['2'], 'b.pdf')
    await wrapper
      .get('[data-testid="upload-drop"]')
      .trigger('drop', { dataTransfer: { files: [a, b] } })
    expect(wrapper.emitted('update:file')).toEqual([[a]])
    expect(wrapper.emitted('extra')).toEqual([[true]])
  })

  it('devre dışıyken bırakma yok sayılır ve vurgu çıkmaz', async () => {
    const wrapper = mountZone({ disabled: true })
    const zone = wrapper.get('[data-testid="upload-drop"]')
    await zone.trigger('dragover')
    expect(zone.classes()).not.toContain('au-drop--over')
    await zone.trigger('drop', { dataTransfer: { files: [new File(['1'], 'a.pdf')] } })
    expect(wrapper.emitted('update:file')).toBeUndefined()
  })

  it('düğme gizli girdiyi tetikler; seçim bildirilir ve aynı dosya yeniden seçilebilir', async () => {
    const wrapper = mountZone({ id: 'x' })
    const input = wrapper.get('[data-testid="upload-file"]')
    let clicked = 0
    input.element.addEventListener('click', () => (clicked += 1))
    await wrapper.get('#x').trigger('click')
    expect(clicked).toBe(1)
    const file = new File(['1'], 'a.pdf')
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    expect(wrapper.emitted('update:file')).toEqual([[file]])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('seçili dosya adı ve boyutu görünür, düğme "Başka dosya seç" olur', () => {
    const wrapper = mountZone({ file: new File(['abc'], 'rapor.pdf') })
    expect(wrapper.get('[data-testid="upload-file-name"]').text()).toBe(
      'Seçilen dosya: rapor.pdf (3 B)',
    )
    expect(wrapper.get('[data-testid="upload-choose"]').text()).toBe('Başka dosya seç')
  })

  it('geçersizken aria-invalid taşır', () => {
    const wrapper = mountZone({ invalid: true })
    expect(wrapper.get('[data-testid="upload-choose"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[data-testid="upload-drop"]').classes()).toContain('au-drop--invalid')
  })
})
