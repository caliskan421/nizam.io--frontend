import { QueryClient, QueryObserver, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingDetail } from '../../model/types'
import MeetingAgenda from './MeetingAgenda.vue'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
let queryClient: QueryClient

const actor = vi.hoisted(() => ({ admin: true }))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: actor.admin, rows: [] })),
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
  viewer_role: 'member',
  participants: [{ account_id: 'a', full_name: 'Ada Yılmaz' }],
  agenda: [
    {
      agenda_item_id: 'i',
      meeting_id: 'm',
      title: 'Karar',
      is_checked: true,
      checked_by_account_id: 'a',
      checked_at: '2026-10-21T11:00:00Z',
      created_at: '2026-10-21T10:00:00Z',
      sort_order: 1,
    },
  ],
} as MeetingDetail
function setup(admin: boolean) {
  actor.admin = admin
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  queryClient = client
  return mount(MeetingAgenda, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
}
it('shows progress and resolves the checker from participants', () => {
  const wrapper = setup(true)
  expect(wrapper.text()).toContain('1 / 1')
  expect(wrapper.text()).toContain('Ada Y.')
  expect(wrapper.find('progress').attributes('value')).toBe('1')
  wrapper.unmount()
})
it('keeps agenda read only for a member', () => {
  const wrapper = setup(false)
  expect(wrapper.get('input[type="checkbox"]').attributes('disabled')).toBeDefined()
  expect(wrapper.find('form').exists()).toBe(false)
  wrapper.unmount()
})
it('returns focus to the menu trigger on Escape', async () => {
  const wrapper = setup(true)
  const trigger = wrapper.get('button[aria-label="Karar işlemleri"]')
  await trigger.trigger('click')
  expect(trigger.attributes('aria-expanded')).toBe('true')
  await wrapper.get('[role="menu"]').trigger('keydown.esc')
  expect(trigger.attributes('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(trigger.element)
  wrapper.unmount()
})

it.each([403, 422])(
  'keeps the native checkbox unchanged after an MSW %s response',
  async (status) => {
    let requests = 0
    server.use(
      http.patch('http://localhost/v1/meeting-agenda/i', () => {
        requests += 1
        return HttpResponse.json(
          {
            code: 'collaboration.not_authorized',
            message: 'gösterilmez',
            request_id: 'r',
            fields: [],
          },
          { status },
        )
      }),
    )
    const wrapper = setup(true)
    const checkbox = wrapper.get('input[type="checkbox"]')
    await checkbox.setValue(false)
    await settleQueries(queryClient)
    expect(requests).toBe(1)
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    wrapper.unmount()
  },
)
it('clears the draft and menu when the meeting changes', async () => {
  const wrapper = setup(true)
  await wrapper.get('input[placeholder]').setValue('Taslak')
  await wrapper.get('button[aria-label="Karar işlemleri"]').trigger('click')
  await wrapper.setProps({ meeting: { ...meeting, meeting_id: 'other' } })
  expect((wrapper.get('input[placeholder]').element as HTMLInputElement).value).toBe('')
  expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  wrapper.unmount()
})

it('does not retry an unknown add outcome and rereads the detail', async () => {
  let requests = 0
  server.use(
    http.post('http://localhost/v1/meetings/m/agenda', () => {
      requests += 1
      return HttpResponse.error()
    }),
  )
  const wrapper = setup(true)
  let reads = 0
  const observer = new QueryObserver(queryClient, {
    queryKey: queryKeys.meetings.detail(useScopeStore().snapshot, 'm'),
    queryFn: () => {
      reads += 1
      return Promise.resolve(meeting)
    },
    retry: false,
  })
  const unsubscribe = observer.subscribe(() => undefined)
  await observer.refetch()
  reads = 0
  await wrapper.get('input[placeholder]').setValue('Yeni madde')
  await wrapper.get('form').trigger('submit')
  await settleQueries(queryClient)
  expect(requests).toBe(1)
  expect(reads).toBeGreaterThan(0)
  expect((wrapper.get('input[placeholder]').element as HTMLInputElement).value).toBe('Yeni madde')
  unsubscribe()
  wrapper.unmount()
})
