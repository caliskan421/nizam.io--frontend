import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { authSession } from '@/shared/http'
import MeetingDetailPage from './MeetingDetailPage.vue'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  submit: vi.fn(),
  refetch: vi.fn(),
  members: false,
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { meetingId: 'm' }, query: { zaman: 'gecmis', notlar: 'benim' } }),
  useRouter: () => ({ push: mocks.push }),
}))
// TASLAK (KESİN 16): `MeetingReportButton` (reports/W138) bu dosyada saplamayla değiştirilir;
// gerçek düğme `reports/components/MeetingReportButton.test.ts`'tedir.
vi.mock('@/modules/reports/public', () => ({
  MeetingReportButton: {
    props: ['meeting'],
    template: '<span data-testid="meeting-report" :data-meeting="meeting.meeting_id" />',
  },
}))
vi.mock('./detail/use-departments', () => ({ useDepartments: () => ref([]) }))
vi.mock('../api/queries', () => ({
  useMeeting: () => ({
    data: ref({
      meeting_id: 'm',
      program_id: 'p',
      title: 'Toplantı',
      meeting_date: '2026-10-21T11:00:00Z',
      invite_mode: mocks.members ? 'coordinatorship' : 'person',
      owner_department_id: 'd',
      departments: [],
      created_by_account_id: 'a',
      members_included: mocks.members,
      participants: [],
      agenda: [],
      viewer_role: 'admin',
    }),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
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
  template: `<div><h2 data-testid="meeting-notes-title" tabindex="-1">Notlar</h2><button @click="$emit('convert', { note_id: 'n', content: 'Not' })">Dönüştür</button></div>`,
}
const Convert = { template: `<button @click="$emit('close')">Kapat</button>` }
const Form = {
  props: ['initialFocus', 'editSection'],
  template: `<div data-test="form" :data-focus="initialFocus" :data-section="editSection"><button @click="$emit('close')">Formu kapat</button></div>`,
}
function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const scope = useScopeStore()
  scope.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const wrapper = mount(MeetingDetailPage, {
    attachTo: document.body,
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: {
        MeetingAgenda: true,
        MeetingNotes: Notes,
        MeetingPeople: true,
        MeetingSide: {
          template: `<button data-test="departments" @click="$emit('edit')">Değiştir</button>`,
        },
        MeetingForm: Form,
        MeetingConvert: Convert,
      },
    },
  })
  return { wrapper, scope }
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.members = false
})
it('focuses the header menu and restores its trigger on Escape', async () => {
  const { wrapper } = setup()
  const trigger = wrapper.get('[aria-label="Diğer işlemler: tarihi ileri al, sil"]')
  await trigger.trigger('click')
  const action = wrapper.get('[role="menuitem"]')
  expect(document.activeElement).toBe(action.element)
  await action.trigger('keydown.esc')
  expect(document.activeElement).toBe(trigger.element)
  wrapper.unmount()
})
it('binds the report button into the header, left of the edit action (W138)', () => {
  const { wrapper } = setup()
  const report = wrapper.get('[data-testid="meeting-report"]')
  expect(report.attributes('data-meeting')).toBe('m')
  const header = wrapper.get('.meeting-detail__header')
  expect(report.element.parentElement).toBe(header.element)
  const edit = wrapper.findAll('button').find((b) => b.text() === 'Düzenle')!
  expect(report.element.compareDocumentPosition(edit.element)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
  wrapper.unmount()
})
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
it('focuses the notes heading when the conversion trigger was removed', async () => {
  const { wrapper } = setup()
  const button = wrapper.findAll('button').find((b) => b.text() === 'Dönüştür')!
  ;(button.element as HTMLButtonElement).focus()
  await button.trigger('click')
  button.element.remove()
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Kapat')!
    .trigger('click')
  expect(document.activeElement).toBe(wrapper.get('[data-testid="meeting-notes-title"]').element)
  wrapper.unmount()
})
it('requests date focus only from the reschedule menu action', async () => {
  const { wrapper } = setup()
  await wrapper.get('[aria-label="Diğer işlemler: tarihi ileri al, sil"]').trigger('click')
  await wrapper.get('[role="menuitem"]').trigger('click')
  expect(wrapper.get('[data-test="form"]').attributes('data-focus')).toBe('date')
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Formu kapat')!
    .trigger('click')
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Düzenle')!
    .trigger('click')
  expect(wrapper.get('[data-test="form"]').attributes('data-focus')).toBeUndefined()
  wrapper.unmount()
})
it('returns focus to the edit trigger after the form closes', async () => {
  const { wrapper } = setup()
  const button = wrapper.findAll('button').find((b) => b.text() === 'Düzenle')!
  ;(button.element as HTMLButtonElement).focus()
  await button.trigger('click')
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Formu kapat')!
    .trigger('click')
  expect(document.activeElement).toBe(button.element)
  wrapper.unmount()
})
it('closes an open form when the session changes', async () => {
  const { wrapper } = setup()
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Düzenle')!
    .trigger('click')
  authSession.clear()
  await wrapper.vm.$nextTick()
  expect(wrapper.find('[data-test="form"]').exists()).toBe(false)
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
  expect(mocks.push).toHaveBeenCalledWith({
    name: 'collaboration.meetings',
    query: { zaman: 'gecmis' },
  })
  wrapper.unmount()
})

it('declares the page independently of its body', () => {
  expect(Object.keys(MeetingDetailPage.props ?? {})).toEqual([])
  expect(MeetingDetailPage.emits ?? []).toEqual([])
})

it('opens the department editor from the side card', async () => {
  const { wrapper } = setup()
  await wrapper.get('[data-test="departments"]').trigger('click')
  expect(wrapper.get('[data-test="form"]').attributes('data-section')).toBe('departments')
  wrapper.unmount()
})

it('places people and side information together beside agenda and notes', () => {
  const { wrapper } = setup()
  const side = wrapper.get('.meeting-detail__body > .meeting-side')
  expect(side.find('meeting-people-stub').exists()).toBe(true)
  expect(side.find('[data-test="departments"]').exists()).toBe(true)
  expect(wrapper.get('.meeting-detail__content').find('meeting-people-stub').exists()).toBe(false)
  wrapper.unmount()
})

it('shows membership as a status in the real detail header', () => {
  mocks.members = true
  const { wrapper } = setup()
  expect(wrapper.text()).toContain('Üyeler dahil')
  expect(wrapper.text()).not.toContain('Tüm üyelere de davet gönder')
  wrapper.unmount()
})
