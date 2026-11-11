import { expect, it } from 'vitest'
import Component from './DeletedMeetings.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(
    ['items', 'hasMore', 'loading', 'error'].sort(),
  )
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['close', 'refresh', 'loadMore'].sort())
})

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, beforeAll } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import { useInstanceStore } from '@/shared/instance/store'
import { useConfirm } from '@/shared/ui/confirm'
import type { Meeting } from '../../model/types'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

it('restores and confirms permanent deletion using the actual endpoints', async () => {
  const calls: string[] = []
  server.use(
    http.patch('http://localhost/v1/admin/restore/meetings/m', () => {
      calls.push('restore')
      return HttpResponse.json({ meeting_id: 'm', status: 'restored' })
    }),
    http.delete('http://localhost/v1/admin/permanent/meetings/m', () => {
      calls.push('purge')
      return HttpResponse.json({ meeting_id: 'm', status: 'purged' })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  useInstanceStore().profile = { timezone: 'America/New_York' } as NonNullable<
    ReturnType<typeof useInstanceStore>['profile']
  >
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const item = {
    meeting_id: 'm',
    program_id: 'p',
    title: 'Toplantı',
    meeting_date: '2026-11-11T10:00:00Z',
  } as Meeting
  const wrapper = mount(Component, {
    props: { items: [item], hasMore: true },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  expect(wrapper.text()).toContain(
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'America/New_York',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(item.meeting_date)),
  )
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Geri yükle')!
    .trigger('click')
  await settleQueries(client)
  expect(calls).toEqual(['restore'])
  expect(wrapper.emitted('refresh')).toHaveLength(1)
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Kalıcı olarak sil')!
    .trigger('click')
  expect(calls).toEqual(['restore'])
  const confirm = useConfirm()
  await confirm.accept(confirm.current.value!.id)
  await settleQueries(client)
  expect(calls).toEqual(['restore', 'purge'])
  expect(wrapper.emitted('refresh')).toHaveLength(2)
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Daha fazla göster')!
    .trigger('click')
  expect(wrapper.emitted('loadMore')).toHaveLength(1)
  wrapper.unmount()
  client.clear()
})
