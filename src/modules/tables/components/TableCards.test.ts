import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TableCards from './TableCards.vue'

it('yüklenen kartları ada ve sahipliğe göre süzer, sayfa sonu bilinmiyorsa kapsamlı sonuç vaat etmez', async () => {
  const target = {
    program_id: 'p1',
    department_id: '',
    space: 'personal' as const,
    sequence: 0,
    schema_version: 1,
  }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/tablolar', component: {} },
      { path: '/tablolar/:tableId', name: 'tables.detail', component: {} },
    ],
  })
  await router.push('/tablolar')
  const wrapper = mount(TableCards, {
    props: {
      items: [
        { ...target, id: 't1', name: 'İlk liste', owner_id: 'me' },
        { ...target, id: 't2', name: 'İkinci liste', owner_id: 'other' },
      ],
      accountId: 'me',
      unit: false,
      hasNext: true,
    },
    global: { plugins: [router] },
  })
  const button = (label: string) => wrapper.findAll('button').find((item) => item.text() === label)!
  await button('Oluşturduklarım').trigger('click')
  expect(wrapper.findAll('a').map((link) => link.get('strong').text())).toEqual(['İlk liste'])
  await button('Benimle paylaşılanlar').trigger('click')
  expect(wrapper.findAll('a').map((link) => link.get('strong').text())).toEqual(['İkinci liste'])
  await wrapper.get('input').setValue('İLK')
  expect(wrapper.text()).toContain('Yüklenen tablolarda eşleşme yok')
  await button('Tümü').trigger('click')
  expect(wrapper.findAll('a').map((link) => link.get('strong').text())).toEqual(['İlk liste'])
  wrapper.unmount()
})
