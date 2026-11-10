import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref, type App } from 'vue'

import { FULLSCREEN_TRIGGER, useFullscreen } from './use-fullscreen'

const apps: App[] = []

function setup() {
  const host = document.createElement('div')
  host.innerHTML = '<button data-action="fullscreen" type="button">tam ekran</button>'
  document.body.append(host)
  const target = ref<HTMLElement | null>(host)
  let api!: ReturnType<typeof useFullscreen>
  const app = createApp(
    defineComponent({
      setup() {
        api = useFullscreen(target)
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  apps.push(app)
  return { host, api }
}

function defineFullscreenElement(value: Element | null) {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value })
}

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  defineFullscreenElement(null)
  Reflect.deleteProperty(document, 'exitFullscreen')
  document.body.innerHTML = ''
})

describe('tam ekran (E-03C-12)', () => {
  it('API yoksa CSS kipi: giriş/çıkış durumu; çıkışta odak tam ekran düğmesine', async () => {
    const { host, api } = setup()
    api.set(true)
    expect(api.active.value).toBe(true)
    api.set(false)
    await flushPromises()
    expect(api.active.value).toBe(false)
    expect(document.activeElement).toBe(host.querySelector(FULLSCREEN_TRIGGER))
  })

  it('yerel kip: istek kabın kendisine gider; tarayıcı Esc ile çıkarsa durum ve odak eşitlenir', async () => {
    const { host, api } = setup()
    const request = vi.fn(() => Promise.resolve())
    host.requestFullscreen = request
    api.set(true)
    expect(request).toHaveBeenCalledTimes(1)
    defineFullscreenElement(host)
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(api.active.value).toBe(true)
    // Tarayıcı kendi Esc’iyle yerel kipten çıktı
    defineFullscreenElement(null)
    document.dispatchEvent(new Event('fullscreenchange'))
    await flushPromises()
    expect(api.active.value).toBe(false)
    expect(document.activeElement).toBe(host.querySelector(FULLSCREEN_TRIGGER))
  })

  it('yerel kipte düğmeyle çıkış document.exitFullscreen çağırır', async () => {
    const { host, api } = setup()
    host.requestFullscreen = vi.fn(() => Promise.resolve())
    const exit = vi.fn(() => Promise.resolve())
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit })
    api.set(true)
    defineFullscreenElement(host)
    api.set(false)
    await flushPromises()
    expect(exit).toHaveBeenCalledTimes(1)
    expect(api.active.value).toBe(false)
  })

  it('izin verilmezse (istek reddedilir) CSS kipi sürer ve Esc ile çıkılır', async () => {
    const { host, api } = setup()
    host.requestFullscreen = vi.fn(() => Promise.reject(new Error('izin yok')))
    api.set(true)
    await flushPromises()
    expect(api.active.value).toBe(true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(api.active.value).toBe(false)
  })

  it('yerel kipteyken Esc’i tarayıcı işler (pencere dinleyicisi çıkmaz)', async () => {
    const { host, api } = setup()
    host.requestFullscreen = vi.fn(() => Promise.resolve())
    api.set(true)
    defineFullscreenElement(host)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(api.active.value).toBe(true)
  })

  it('çift giriş tek istektir; kap yoksa giriş etkisiz', () => {
    const { host, api } = setup()
    const request = vi.fn(() => Promise.resolve())
    host.requestFullscreen = request
    api.set(true)
    api.set(true)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
