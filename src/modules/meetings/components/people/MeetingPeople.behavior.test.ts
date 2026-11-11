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
