import { expect, it } from 'vitest'
import Component from './MeetingForm.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(['initialFocus', 'meeting'].sort())
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['close', 'saved', 'selectPeople'].sort())
})

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { afterAll, beforeAll, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'

vi.mock('@/modules/work/public', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/work/public')>()),
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
    data: ref({ people: [], partial: false, truncated: false }),
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
