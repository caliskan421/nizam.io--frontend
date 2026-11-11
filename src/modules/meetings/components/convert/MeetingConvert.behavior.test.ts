import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { DOMWrapper, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingNote } from '../../model/types'
import MeetingConvert from './MeetingConvert.vue'

const actor = vi.hoisted(() => ({ admin: true }))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({
      accountId: 'a',
      companyAdmin: actor.admin,
      rows: [{ programId: 'p', departmentId: 'd', role: 'coordinator' }],
    })),
  }),
}))
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
const note = {
  note_id: 'n',
  meeting_id: 'm',
  author_account_id: 'a',
  author_name: 'Ada',
  author_role: 'coordinator',
  content: 'Karar',
  converted_to_work_item_id: null,
  edit_revision: 1,
} as MeetingNote
function setup(admin: boolean) {
  actor.admin = admin
  const pinia = createPinia()
  setActivePinia(pinia)
  const scope = useScopeStore()
  scope.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0, staleTime: Infinity } },
  })
  client.setQueryData(queryKeys.meetings.detail(scope.snapshot, 'm'), {
    meeting_id: 'm',
    program_id: 'p',
    title: 'Toplantı',
    invite_mode: 'coordinatorship',
    owner_department_id: 'd',
    departments: [{ department_id: 'd' }],
    created_by_account_id: 'a',
    members_included: false,
    viewer_role: 'coordinator',
    participants: [],
  })
  client.setQueryData(queryKeys.departments.all(scope.snapshot), {
    departments: [
      { department_id: 'd', display_name: 'Bağlı' },
      { department_id: 'x', display_name: 'Diğer' },
    ],
  })
  const wrapper = mount(MeetingConvert, {
    props: { note },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
  return { wrapper, client, scope }
}
const input = (selector: string) =>
  new DOMWrapper(document.querySelector<HTMLInputElement>(selector))
it('limits coordinator targets to managed linked departments', async () => {
  const { wrapper, client } = setup(false)
  await wrapper.vm.$nextTick()
  expect([...document.querySelectorAll('select option')].map((x) => x.textContent)).toEqual([
    'Seçiniz',
    'Bağlı',
  ])
  wrapper.unmount()
  client.clear()
})
it('omits a blank title, sends the chosen target and invalidates program work', async () => {
  let body: Record<string, unknown> | undefined
  server.use(
    http.post('http://localhost/v1/meeting-notes/n/convert-to-task', async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({})
    }),
  )
  const { wrapper, client, scope } = setup(true)
  const work = queryKeys.workItems.list(scope.snapshot, {})
  client.setQueryData(work, { before: true })
  await wrapper.vm.$nextTick()
  await input('input:not([type="date"])').setValue('')
  await input('select').setValue('x')
  const dates = document.querySelectorAll('input[type="date"]')
  await new DOMWrapper(dates[0] as HTMLInputElement).setValue('2099-01-01')
  await new DOMWrapper(dates[1] as HTMLInputElement).setValue('2099-01-02')
  await input('form').trigger('submit')
  await settleQueries(client)
  expect(body).toEqual({ department_id: 'x', start_date: '2099-01-01', end_date: '2099-01-02' })
  expect(client.getQueryState(work)?.isInvalidated).toBe(true)
  expect(wrapper.emitted('saved')).toHaveLength(1)
  wrapper.unmount()
  client.clear()
})
it('refreshes notes and closes on note_converted', async () => {
  server.use(
    http.post('http://localhost/v1/meeting-notes/n/convert-to-task', () =>
      HttpResponse.json(
        { code: 'collaboration.note_converted', message: 'secret', fields: [] },
        { status: 409 },
      ),
    ),
  )
  const { wrapper, client, scope } = setup(true)
  const key = queryKeys.meetings.noteList(scope.snapshot, 'm')
  client.setQueryData(key, { pages: [], pageParams: [] })
  await wrapper.vm.$nextTick()
  await input('select').setValue('d')
  const dates = document.querySelectorAll('input[type="date"]')
  await new DOMWrapper(dates[0] as HTMLInputElement).setValue('2099-01-01')
  await new DOMWrapper(dates[1] as HTMLInputElement).setValue('2099-01-02')
  await input('form').trigger('submit')
  await settleQueries(client)
  expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  expect(wrapper.emitted('close')).toHaveLength(1)
  wrapper.unmount()
  client.clear()
})
for (const path of ['escape', 'close', 'cancel'] as const) {
  it(`restores focus after ${path}`, async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const { wrapper, client } = setup(true)
    await wrapper.vm.$nextTick()
    const dialog = [...document.querySelectorAll('[role="dialog"]')].at(-1)!
    if (path === 'escape') await new DOMWrapper(dialog).trigger('keydown', { key: 'Escape' })
    if (path === 'close')
      await new DOMWrapper(dialog.querySelector('[aria-label="Kapat"]')!).trigger('click')
    if (path === 'cancel') {
      const cancel = [...dialog.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Vazgeç'),
      )!
      await new DOMWrapper(cancel).trigger('click')
    }
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
    client.clear()
  })
}
