import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import MeetingDetailPage from './MeetingDetailPage.vue'

const mocks = vi.hoisted(() => ({ push: vi.fn(), submit: vi.fn(), refetch: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { meetingId: 'm' } }),
  useRouter: () => ({ push: mocks.push }),
}))
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
    refetch: mocks.refetch,
  }),
}))
vi.mock('../api/meeting-writes', () => ({
  useDeleteMeeting: () => ({ submit: mocks.submit, isPending: ref(false) }),
}))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: true, rows: [] })),
  }),
}))
vi.mock('@/shared/ui/confirm', () => ({
  useConfirm: () => ({
    confirmWrite: (_options: unknown, start: (context: object) => unknown) => start({}),
  }),
  notifyOutcome: vi.fn(),
}))
const Notes = {
  template: `<button @click="$emit('convert', { note_id: 'n', content: 'Not' })">Dönüştür</button>`,
}
const Convert = { template: `<button @click="$emit('close')">Kapat</button>` }
const Form = { template: `<div data-test="form" />` }
function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const scope = useScopeStore()
  scope.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const wrapper = mount(MeetingDetailPage, {
    attachTo: document.body,
    global: {
      plugins: [pinia],
      stubs: {
        MeetingAgenda: true,
        MeetingNotes: Notes,
        MeetingPeople: true,
        MeetingSide: true,
        MeetingForm: Form,
        MeetingConvert: Convert,
      },
    },
  })
  return { wrapper, scope }
}
beforeEach(() => vi.clearAllMocks())
it('closes the conversion and returns focus to its trigger', async () => {
  const { wrapper } = setup()
  const button = wrapper.findAll('button').find((b) => b.text() === 'Dönüştür')!
  ;(button.element as HTMLButtonElement).focus()
  await button.trigger('click')
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Kapat')!
    .trigger('click')
  expect(document.activeElement).toBe(button.element)
  wrapper.unmount()
})
it('closes an open form when the program changes', async () => {
  const { wrapper, scope } = setup()
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Düzenle')!
    .trigger('click')
  expect(wrapper.find('[data-test="form"]').exists()).toBe(true)
  scope.commit({ programId: 'other', departmentId: null, lens: 'admin' })
  await wrapper.vm.$nextTick()
  expect(wrapper.find('[data-test="form"]').exists()).toBe(false)
  wrapper.unmount()
})
it('treats a concurrent meeting deletion as a return to the list', async () => {
  mocks.submit.mockResolvedValue({
    kind: 'failed',
    error: { code: 'collaboration.meeting_not_found' },
  })
  const { wrapper } = setup()
  await wrapper.get('[aria-label="Diğer işlemler: tarihi ileri al, sil"]').trigger('click')
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Sil')!
    .trigger('click')
  expect(mocks.push).toHaveBeenCalledWith({ name: 'collaboration.meetings' })
  wrapper.unmount()
})

it('declares the page independently of its body', () => {
  expect(Object.keys(MeetingDetailPage.props ?? {})).toEqual([])
  expect(MeetingDetailPage.emits ?? []).toEqual([])
})
