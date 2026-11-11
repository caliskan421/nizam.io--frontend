import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import { useConfirm } from '@/shared/ui/confirm'
import MeetingDetailPage from './MeetingDetailPage.vue'

const mocks = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { meetingId: 'm' }, query: { zaman: 'gecmis', notlar: 'benim' } }),
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('./detail/use-departments', () => ({ useDepartments: () => ref([]) }))
vi.mock('../api/queries', () => ({
  useMeeting: () => ({
    data: ref({
      meeting_id: 'm',
      program_id: 'p',
      title: 'Toplantı',
      meeting_date: '2026-10-21T11:00:00Z',
      invite_mode: 'person',
      owner_department_id: 'd',
      departments: [],
      created_by_account_id: 'a',
      members_included: false,
      participants: [],
      agenda: [],
      viewer_role: 'admin',
    }),
    isPending: ref(false),
    isError: ref(false),
    refetch: vi.fn(),
  }),
}))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: true, rows: [] })),
  }),
}))
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
it('confirms a real DELETE and treats a 404 race as a return to the filtered list', async () => {
  let calls = 0
  server.use(
    http.delete('http://localhost/v1/meetings/m', () => {
      calls += 1
      return HttpResponse.json(
        {
          code: 'collaboration.meeting_not_found',
          message: 'sunucu mesajı',
          request_id: 'r',
          fields: [],
        },
        { status: 404 },
      )
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(MeetingDetailPage, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient: client }]],
      stubs: {
        MeetingAgenda: true,
        MeetingNotes: true,
        MeetingPeople: true,
        MeetingSide: true,
        MeetingForm: true,
        MeetingConvert: true,
      },
    },
  })
  await wrapper.get('[aria-label="Diğer işlemler: tarihi ileri al, sil"]').trigger('click')
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Sil')!
    .trigger('click')
  const confirm = useConfirm()
  expect(confirm.current.value?.options.title).toBe('Toplantı silinsin mi?')
  expect(calls).toBe(0)
  await confirm.accept(confirm.current.value!.id)
  await settleQueries(client)
  expect(calls).toBe(1)
  expect(mocks.push).toHaveBeenCalledWith({
    name: 'collaboration.meetings',
    query: { zaman: 'gecmis' },
  })
  wrapper.unmount()
  client.clear()
})
