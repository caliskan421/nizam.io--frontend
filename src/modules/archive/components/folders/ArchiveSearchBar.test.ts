import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'

import ArchiveSearchBar from './ArchiveSearchBar.vue'

beforeEach(() => vi.useFakeTimers())
const wrappers: Array<{ unmount: () => void }> = []
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function bar(props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(ArchiveSearchBar, {
    props: { q: '', kind: 'tumu', disabled: false, ...props },
    global: { plugins: [i18n, pinia] },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('arama (E-06-06/26)', () => {
  it('etiketli, yalnız dosya adı vaadi; ~300 ms gecikmeyle tek update:q', async () => {
    const w = bar()
    const input = w.get('input[type="search"]')
    expect(input.attributes('aria-label')).toBe('Tüm arşivde ara')
    expect(input.attributes('placeholder')).toBe('Dosya adı ara…')
    expect(input.attributes('placeholder')).not.toMatch(/kişi|etiket|görev/i)
    await input.setValue('ra')
    await input.setValue('rapor')
    vi.advanceTimersByTime(299)
    expect(w.emitted('update:q')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(w.emitted('update:q')).toEqual([['rapor']])
  })

  it('dışarıdan değişim (geri tuşu) bekleyen yazımı düşürür ve kutuyu eşitler', async () => {
    const w = bar({ q: 'eski' })
    await w.get('input').setValue('yeni')
    await w.setProps({ q: '' })
    vi.advanceTimersByTime(400)
    expect(w.emitted('update:q')).toBeUndefined()
    expect((w.get('input').element as HTMLInputElement).value).toBe('')
  })

  it('sahip sökülünce bekleyen yazım gitmez', async () => {
    const w = bar()
    await w.get('input').setValue('x')
    w.unmount()
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:q')).toBeUndefined()
  })

  it('kapsam değişince bekleyen yazım düşer ve kutu URL durumuna döner', async () => {
    const w = bar({ q: 'eski' })
    useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
    await w.get('input').setValue('yarım')
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    vi.advanceTimersByTime(500)
    await flushPromises()
    expect(w.emitted('update:q')).toBeUndefined()
    expect((w.get('input').element as HTMLInputElement).value).toBe('eski')
  })
})

describe('"/" kısayolu', () => {
  const press = (target: EventTarget, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: '/',
      bubbles: true,
      cancelable: true,
      ...init,
    })
    target.dispatchEvent(event)
    return event
  }

  it('kutuya odaklar; yazı alanındayken ve değiştiricili tuşta dokunmaz', () => {
    const w = bar()
    const input = w.get('input').element
    const event = press(document.body)
    expect(document.activeElement).toBe(input)
    expect(event.defaultPrevented).toBe(true)
    ;(input as HTMLInputElement).blur()
    press(document.body, { ctrlKey: true })
    expect(document.activeElement).not.toBe(input)
    const other = document.createElement('textarea')
    document.body.appendChild(other)
    other.focus()
    expect(press(other).defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(other)
  })

  it('devre dışıyken ve sökülünce çalışmaz', () => {
    const off = bar({ disabled: true })
    press(document.body)
    expect(document.activeElement).toBe(document.body)
    off.unmount()
    const w = bar()
    w.unmount()
    press(document.body)
    expect(document.activeElement).toBe(document.body)
  })
})

describe('tür segmenti (E-06-07)', () => {
  it('yalnız Tümü / Görsel / Belge (PDF yok); basılı olan kind', () => {
    const w = bar({ kind: 'gorsel' })
    const buttons = w.findAll('.rp-seg button')
    expect(buttons.map((b) => b.text())).toEqual(['Tümü', 'Görsel', 'Belge'])
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'true', 'false'])
    expect(w.text()).not.toMatch(/PDF/)
  })

  it('tık update:kind yayar', async () => {
    const w = bar()
    await w.findAll('.rp-seg button')[2]!.trigger('click')
    expect(w.emitted('update:kind')).toEqual([['belge']])
  })
})

describe('yönetici (disabled; P33, BE-072)', () => {
  it('arama ve segment devre dışı, BE-072 stub, "Görev klasörü seçin" açıklaması, kısayol ipucu yok', () => {
    const w = bar({ disabled: true })
    expect(w.find('[data-design-stub="BE-072"]').exists()).toBe(true)
    expect(w.get('input').attributes('disabled')).toBeDefined()
    expect(w.findAll('.rp-seg button').every((b) => b.attributes('disabled') !== undefined)).toBe(
      true,
    )
    expect(w.get('[role="status"]').text()).toBe('Görev klasörü seçin')
    expect(w.find('kbd').exists()).toBe(false)
  })

  it('etkinken stub çerçevesi ve açıklama yok', () => {
    const w = bar()
    expect(w.find('[data-design-stub]').exists()).toBe(false)
    expect(w.find('[role="status"]').exists()).toBe(false)
    expect(w.get('kbd').text()).toBe('/')
  })
})
