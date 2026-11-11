import { expect, it } from 'vitest'
import Component from './MeetingForm.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(
    ['editSection', 'initialFocus', 'meeting'].sort(),
  )
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['close', 'saved', 'selectPeople'].sort())
})

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { afterAll, beforeAll, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import type * as WorkPublic from '@/modules/work/public'
import type { MeetingDetail } from '../../model/types'

vi.mock('@/modules/work/public', async (importOriginal) => ({
  ...(await importOriginal<typeof WorkPublic>()),
  useProgramDepartments: () => ({
    query: { data: ref({ departments: [{ department_id: 'd', display_name: 'Birim' }] }) },
  }),
}))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: true, rows: [] })),
  }),
}))
vi.mock('../../api/queries', () => ({
  useMeetingCandidates: () => ({
    data: ref({
      people: [{ accountId: 'a1', fullName: 'Ada Örnek' }],
      partial: false,
      truncated: false,
    }),
    isPending: ref(false),
    isError: ref(false),
    refetch: vi.fn(),
  }),
}))
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
it('creates person meeting with one owner and returns the real meeting id', async () => {
  let payload: Record<string, unknown> | undefined
  server.use(
    http.post('http://localhost/v1/meetings', async ({ request }) => {
      payload = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(
        {
          meeting: { meeting_id: 'real-id' },
          failed_participants: [],
          side_effects: { event_failed: false, failed_messages: 0 },
        },
        { status: 201 },
      )
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(Component, {
    attachTo: document.body,
    props: { meeting: null },
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient: client }]],
      stubs: { MeetingPersonSelector: true, teleport: true },
    },
  })
  await wrapper.get('input[required]:not([type])').setValue('Test')
  await wrapper.get('input[type=date]').setValue('2099-12-31')
  await wrapper.get('input[type=time]').setValue('10:00')
  await wrapper.get('input[value=person]').setValue()
  await wrapper.findAll('input[type=radio]').at(-1)!.setValue()
  await wrapper.get('form').trigger('submit')
  await settleQueries(client)
  expect(payload).toMatchObject({
    title: 'Test',
    invite_mode: 'person',
    department_ids: ['d'],
    participant_ids: [],
  })
  expect(payload).not.toHaveProperty('members_included')
  expect(wrapper.emitted('saved')).toEqual([['real-id']])
  wrapper.unmount()
  client.clear()
})

it('sends only the department set for an authorized department edit', async () => {
  let payload: Record<string, unknown> | undefined
  server.use(
    http.patch('http://localhost/v1/meetings/m', async ({ request }) => {
      payload = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ side_effects: { event_failed: false, failed_messages: 0 } })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const meeting = {
    meeting_id: 'm',
    program_id: 'p',
    title: 'T',
    meeting_date: '2020-01-01T10:00:00Z',
    invite_mode: 'coordinatorship',
    owner_department_id: 'd',
    departments: [{ department_id: 'd', department_name: 'Birim' }],
    members_included: false,
  } as MeetingDetail
  const wrapper = mount(Component, {
    props: { meeting, editSection: 'departments' },
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient: client }]],
      stubs: { teleport: true },
    },
  })
  expect(wrapper.find('input[type=date]').exists()).toBe(false)
  await wrapper.get('form').trigger('submit')
  await settleQueries(client)
  expect(payload).toEqual({ department_ids: ['d'] })
  expect(wrapper.emitted('saved')).toEqual([['m']])
  wrapper.unmount()
  client.clear()
})

it('uses the real nested selector and returns focus to its opener', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(Component, {
    attachTo: document.body,
    props: { meeting: null },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  await nextTick()
  const opener = [...document.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('Kişileri seç'),
  )!
  opener.focus()
  opener.click()
  await nextTick()
  await nextTick()
  const search = document.querySelector<HTMLInputElement>('input[type=search]')!
  expect(document.activeElement).toBe(search)
  const person = [...document.querySelectorAll('label')].find((label) =>
    label.textContent?.includes('Ada Örnek'),
  )!
  person.querySelector('input')!.click()
  await nextTick()
  const apply = [...document.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === 'Uygula',
  )!
  apply.click()
  await nextTick()
  await nextTick()
  expect(opener.textContent).toContain('(1)')
  expect(document.activeElement).toBe(opener)
  wrapper.unmount()
  client.clear()
})

it('focuses the date field when rescheduling opens the real modal', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const meeting = {
    meeting_id: 'm',
    program_id: 'p',
    title: 'T',
    meeting_date: '2099-01-01T10:00:00Z',
    invite_mode: 'person',
    owner_department_id: 'd',
    departments: [{ department_id: 'd', department_name: 'Birim' }],
    members_included: false,
  } as MeetingDetail
  const wrapper = mount(Component, {
    attachTo: document.body,
    props: { meeting, initialFocus: 'date' },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  await nextTick()
  await nextTick()
  await nextTick()
  expect(document.activeElement).toBe(document.querySelector('input[type=date]'))
  wrapper.unmount()
  client.clear()
})
