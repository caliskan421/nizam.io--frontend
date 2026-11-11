import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingDetail } from '../../model/types'
import MeetingPeople from './MeetingPeople.vue'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: true, rows: [] })),
  }),
}))
vi.mock('../../api/queries', () => ({
  useMeetingCandidates: () => ({
    data: ref({
      people: [
        { accountId: 'b', fullName: 'Bora' },
        { accountId: 'c', fullName: 'Cem' },
      ],
      partial: false,
      truncated: false,
    }),
    isPending: ref(false),
    isError: ref(false),
    refetch: vi.fn(),
  }),
}))
const meeting = {
  meeting_id: 'm',
  program_id: 'p',
  invite_mode: 'person',
  owner_department_id: 'd',
  departments: [{ department_id: 'd', department_name: 'Birim' }],
  created_by_account_id: 'a',
  members_included: false,
  viewer_role: 'admin',
  participants: [],
} as unknown as MeetingDetail
it('sends selected people in order and reports partial failure', async () => {
  const calls: string[] = []
  server.use(
    http.post('http://localhost/v1/meetings/m/participants', async ({ request }) => {
      const body = (await request.json()) as { user_id: string }
      calls.push(body.user_id)
      return body.user_id === 'b'
        ? HttpResponse.json({ meeting_id: 'm', user_id: 'b' }, { status: 201 })
        : HttpResponse.json(
            {
              code: 'collaboration.participant_invalid',
              message: 'secret',
              request_id: 'r',
              fields: [],
            },
            { status: 422 },
          )
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(MeetingPeople, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  await wrapper.get('button').trigger('click')
  await wrapper.vm.$nextTick()
  for (const box of document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) box.click()
  await wrapper.vm.$nextTick()
  ;[...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Uygula'))!.click()
  await settleQueries(client)
  expect(calls).toEqual(['b', 'c'])
  expect(wrapper.text()).toContain('Cem')
  expect(wrapper.text()).not.toContain('secret')
  expect(wrapper.emitted('refresh')).toHaveLength(1)
  wrapper.unmount()
})
it('stops the sequence after an unknown outcome', async () => {
  let calls = 0
  server.use(
    http.post('http://localhost/v1/meetings/m/participants', () => {
      calls += 1
      return HttpResponse.error()
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(MeetingPeople, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  await wrapper.get('button').trigger('click')
  await wrapper.vm.$nextTick()
  for (const box of document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) box.click()
  await wrapper.vm.$nextTick()
  ;[...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Uygula'))!.click()
  await settleQueries(client)
  expect(calls).toBe(1)
  expect(wrapper.text()).toContain('Sonuç doğrulanamadı')
  wrapper.unmount()
})
it.each(['escape', 'cancel', 'close'])('restores focus after %s', async (method) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(MeetingPeople, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  const trigger = wrapper.get('button')
  ;(trigger.element as HTMLButtonElement).focus()
  await trigger.trigger('click')
  await wrapper.vm.$nextTick()
  if (method === 'escape')
    document
      .querySelector('input[type=search]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  else if (method === 'cancel')
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Vazgeç'))!
      .click()
  else document.querySelector<HTMLButtonElement>('[role=dialog] button[aria-label]')!.click()
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  expect(document.activeElement).toBe(trigger.element)
  wrapper.unmount()
})
it('blocks another removal and add while a removal is pending', async () => {
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  let calls = 0
  server.use(
    http.delete('http://localhost/v1/meetings/m/participants/:id', async () => {
      calls += 1
      await pending
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const value = {
    ...meeting,
    participants: [
      { account_id: 'b', full_name: 'Bora', teams: [] },
      { account_id: 'c', full_name: 'Cem', teams: [] },
    ],
  }
  const wrapper = mount(MeetingPeople, {
    props: { meeting: value },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  await wrapper.get('[aria-label="Bora: Katılımcıyı çıkar"]').trigger('click')
  expect(wrapper.get('[aria-label="Cem: Katılımcıyı çıkar"]').attributes('disabled')).toBeDefined()
  expect(wrapper.get('header button').attributes('disabled')).toBeDefined()
  finish()
  await settleQueries(client)
  expect(calls).toBe(1)
  wrapper.unmount()
})

it('does not send remaining participants after scope changes', async () => {
  let markStarted!: () => void
  const started = new Promise<void>((resolve) => {
    markStarted = resolve
  })
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  const calls: string[] = []
  server.use(
    http.post('http://localhost/v1/meetings/m/participants', async ({ request }) => {
      const body = (await request.json()) as { user_id: string }
      calls.push(body.user_id)
      markStarted()
      await pending
      return HttpResponse.json({ meeting_id: 'm', user_id: body.user_id }, { status: 201 })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  const scope = useScopeStore()
  scope.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(MeetingPeople, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  await wrapper.get('button').trigger('click')
  await wrapper.vm.$nextTick()
  for (const box of document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) box.click()
  await wrapper.vm.$nextTick()
  ;[...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Uygula'))!.click()
  await started
  scope.commit({ programId: 'other', departmentId: null, lens: 'admin' })
  finish()
  await settleQueries(client)
  expect(calls).toEqual(['b'])
  expect(wrapper.emitted('refresh')).toBeUndefined()
  wrapper.unmount()
})
it('renders each real team role without grouping participants', () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const value = {
    ...meeting,
    participants: [
      {
        account_id: 'b',
        full_name: 'Bora',
        teams: [
          { department_id: 'd', department_name: 'Birim', role: 'coordinator' as const },
          { department_id: 'e', department_name: 'Diğer', role: 'member' as const },
        ],
      },
      { account_id: 'c', full_name: 'Cem', teams: [] },
    ],
  }
  const wrapper = mount(MeetingPeople, {
    props: { meeting: value },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  expect(wrapper.findAll('.meeting-person-row')).toHaveLength(2)
  expect(wrapper.findAll('.meeting-person-row__role').map((role) => role.text())).toEqual([
    'Birim · Koordinatör',
    'Diğer · Üye',
  ])
  wrapper.unmount()
})
