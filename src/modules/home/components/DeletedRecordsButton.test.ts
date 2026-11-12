import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import DeletedRecordsButton from './DeletedRecordsButton.vue'

async function mountButton(count: number | null) {
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/silinen-kayitlar', name: 'deleted-records.list', component: empty },
    ],
  })
  await router.push('/')
  return mount(DeletedRecordsButton, { props: { count }, global: { plugins: [router] } })
}

describe('E-01-02 Silinen kayıtlar düğmesi', () => {
  it('etiket + sayaç; hedef /silinen-kayitlar; BE-119 açıklaması title’da', async () => {
    const wrapper = await mountButton(12)
    expect(wrapper.text()).toContain('Silinen kayıtlar')
    expect(wrapper.find('.rp-count').text()).toBe('12')
    expect(wrapper.attributes('href')).toBe('/silinen-kayitlar')
    expect(wrapper.attributes('title')).toMatch(/şirket genelindeki silinmiş hesapları/)
  })

  it('sayı yoksa sahte sayı çizilmez', async () => {
    const wrapper = await mountButton(null)
    expect(wrapper.find('.rp-count').exists()).toBe(false)
  })

  it('sıfır gerçek bir sayıdır ve gösterilir', async () => {
    const wrapper = await mountButton(0)
    expect(wrapper.find('.rp-count').text()).toBe('0')
  })
})
