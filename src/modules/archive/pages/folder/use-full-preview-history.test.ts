import { flushPromises, mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useFullPreviewHistory } from './use-full-preview-history'

async function setup() {
  const page = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv', component: page },
      { path: '/arsiv/:id', component: page },
    ],
  })
  await router.push('/arsiv')
  await router.push('/arsiv/b1?dosya=f1')
  let preview!: ReturnType<typeof useFullPreviewHistory<string>>
  const wrapper = mount(
    defineComponent({
      setup() {
        preview = useFullPreviewHistory<string>()
        return () => null
      },
    }),
    { global: { plugins: [router] } },
  )
  return { preview, router, wrapper }
}

it.each(['geri', 'kapat'])(
  '%s önce tam ekranı kapatır, sonraki Geri önceki rotaya döner',
  async (mode) => {
    const { preview, router, wrapper } = await setup()
    try {
      preview.open('f1')
      expect(preview.shown.value).toBe('f1')
      expect(router.currentRoute.value.fullPath).toBe('/arsiv/b1?dosya=f1')
      if (mode === 'geri') router.back()
      else preview.close()
      await flushPromises()
      expect(preview.shown.value).toBeNull()
      expect(router.currentRoute.value.fullPath).toBe('/arsiv/b1?dosya=f1')
      router.back()
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe('/arsiv')
    } finally {
      wrapper.unmount()
    }
  },
)
