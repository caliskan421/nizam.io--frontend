import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { h } from 'vue'
import { createMemoryHistory, RouterView } from 'vue-router'

import { createAppRouter } from '@/app/router'
import { sessionGate } from '@/app/session-gate'

afterEach(() => {
  delete document.documentElement.dataset.theme
})

async function start(ornek?: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: 'tables.design', query: { ornek } })
  const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [router] } })
  await flushPromises()
  const shadow = wrapper.get('.tables-preview-host').element.shadowRoot!
  return { router, shadow, wrapper }
}

it('ayrı S2 önizleme rotası kimlik kapısına ve Tablolar menü grubuna bağlıdır', async () => {
  const { router, wrapper } = await start()
  expect(router.currentRoute.value.meta).toMatchObject({ scope: 'S2', menuKey: 'sheets' })
  expect(
    sessionGate({
      status: 'anonymous',
      shell: false,
      routeScope: router.currentRoute.value.meta.scope,
    }),
  ).toBe('to-session')
  expect(wrapper.get('a[href="/tablolar"]').text()).toContain('Tablolar')
  wrapper.unmount()
})

it('paylaşım rolü ve örnek tema uygulamanın temasını ve adresini değiştirmez', async () => {
  document.documentElement.dataset.theme = 'light'
  const { router, shadow, wrapper } = await start()
  const role = shadow.getElementById('role') as HTMLSelectElement
  role.value = 'admin'
  role.dispatchEvent(new Event('change'))
  expect(shadow.querySelector('h1')?.textContent).toBe('Koordinatörlük tabloları')
  expect(shadow.textContent).not.toContain('Deniz’in kişisel notları')
  shadow.querySelector<HTMLButtonElement>('#theme')?.click()
  expect(shadow.querySelector<HTMLElement>('.preview-surface')?.dataset.theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(router.currentRoute.value.path).toBe('/tablolar/tasarim')
  expect(shadow.querySelectorAll('link[rel=stylesheet]')).toHaveLength(2)
  expect(shadow.querySelector('iframe, script, style, [onclick], [style]')).toBeNull()
  wrapper.unmount()
})

it('birlikte çalışma, bağlantı referansı ve ileri akışlar adres üzerinden açılır', async () => {
  const { router, shadow, wrapper } = await start('birlikte-calisma')
  expect(shadow.textContent).toContain('Son hareketler')
  const comment = shadow.getElementById('comment') as HTMLTextAreaElement
  comment.value = 'Örnek yorum'
  shadow.getElementById('comment-form')?.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(shadow.getElementById('comment-list')?.textContent).toContain('Örnek yorum')
  await router.push({ name: 'tables.design', query: { ornek: 'baglantilar' } })
  await flushPromises()
  expect(shadow.textContent).toContain('Erişilemeyen bağlantı')
  await router.push({ name: 'tables.design', query: { ornek: 'ileri-akislar' } })
  await flushPromises()
  const control = shadow.getElementById('scenario') as HTMLSelectElement
  control.value = 'move'
  control.dispatchEvent(new Event('change'))
  expect(shadow.textContent).toContain('Bu tablo taşınsın mı?')
  wrapper.unmount()
})
