import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingDetail } from '../../model/types'
import MeetingNotes from './MeetingNotes.vue'

const actor = vi.hoisted(() => ({ admin: false, role: 'member', replace: vi.fn() }))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({
      accountId: 'a',
      companyAdmin: actor.admin,
      rows: [{ programId: 'p', departmentId: 'd', role: actor.role }],
    })),
  }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: actor.replace }),
}))
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
const note = {
  note_id: 'n',
  meeting_id: 'm',
  author_account_id: 'a',
  author_name: 'Ada',
  author_role: 'member',
  content: 'Karar',
  converted_to_work_item_id: 'w',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  edit_revision: 1,
}
const meeting = {
  meeting_id: 'm',
  program_id: 'p',
  invite_mode: 'coordinatorship',
  owner_department_id: 'd',
  departments: [{ department_id: 'd', department_name: 'Birim' }],
  created_by_account_id: 'a',
  members_included: true,
  viewer_role: 'member',
  participants: [{ account_id: 'a' }],
  notes: { items: [note], next_cursor: '' },
} as MeetingDetail
function setup(admin: boolean, role: string) {
  actor.admin = admin
  actor.role = role
  const pinia = createPinia()
  setActivePinia(pinia)
  const scope = useScopeStore()
  scope.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0, staleTime: Infinity } },
  })
  client.setQueryData(queryKeys.meetings.detail(scope.snapshot, 'm'), meeting)
  const wrapper = mount(MeetingNotes, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  return { wrapper, client }
}
for (const [admin, role, canDelete, canEdit] of [
  [false, 'member', false, false],
  [false, 'coordinator', true, false],
  [true, 'member', true, false],
] as const) {
  it(`converted member note respects ${admin ? 'admin' : role} permissions`, async () => {
    const { wrapper, client } = setup(admin, role)
    expect(wrapper.text()).toContain('Göreve dönüştü')
    expect(wrapper.text().includes('yazarı artık düzenleyemez')).toBe(!admin && role === 'member')
    const trigger = wrapper.find('button[aria-label^="Not işlemleri"]')
    expect(trigger.exists()).toBe(canDelete)
    if (canDelete) {
      await trigger.trigger('click')
      expect(wrapper.text().includes('Düzenle')).toBe(canEdit)
      expect(wrapper.text()).toContain('Sil')
      await wrapper.get('[role="menu"]').trigger('keydown.esc')
      expect(document.activeElement).toBe(trigger.element)
    }
    wrapper.unmount()
    client.clear()
  })
}
it('filters the loaded notes and submits a note with an idempotency key', async () => {
  let key = ''
  server.use(
    http.post('http://localhost/v1/meetings/m/notes', ({ request }) => {
      key = request.headers.get('Idempotency-Key') ?? ''
      return HttpResponse.json(note)
    }),
  )
  const { wrapper, client } = setup(false, 'member')
  await wrapper.get('textarea[aria-label="Not yaz"]').setValue('Yeni not')
  await wrapper.get('form').trigger('submit')
  await settleQueries(client)
  expect(key).not.toBe('')
  await wrapper.get('button[aria-pressed="false"]').trigger('click')
  expect(wrapper.text()).toContain('Karar')
  wrapper.unmount()
  client.clear()
})

it('marks loaded counts as partial and writes the filter into the URL', async () => {
  meeting.notes.next_cursor = 'next'
  const { wrapper, client } = setup(false, 'member')
  expect(wrapper.text()).toContain('Tümü 1+')
  expect(wrapper.text()).toContain('Daha fazla not göster')
  await wrapper.get('button[aria-pressed="false"]').trigger('click')
  expect(actor.replace).toHaveBeenCalledWith({ query: { notlar: 'gorev' } })
  wrapper.unmount()
  client.clear()
  meeting.notes.next_cursor = ''
})
