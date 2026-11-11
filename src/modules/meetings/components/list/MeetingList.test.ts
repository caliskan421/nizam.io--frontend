import { expect, it } from 'vitest'
import Component from './MeetingList.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(['items', 'complete'].sort())
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['create', 'openDeleted', 'select'].sort())
})

import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { i18n } from '@/shared/i18n'
import { settleQueries } from '@/shared/http/__tests__/settle'
import type { Meeting } from '../../model/types'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

it('renders summary and owner first without fetching meeting details', async () => {
  const paths: string[] = []
  server.use(
    http.get('http://localhost/v1/*', ({ request }) => {
      paths.push(new URL(request.url).pathname)
      return HttpResponse.json({
        departments: [{ department_id: 'owner', display_name: 'Sahip', code: 'SH' }],
      })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const item = {
    meeting_id: 'm',
    title: 'Planlama',
    meeting_date: '2026-11-11T12:00:00Z',
    owner_department_id: 'owner',
    departments: [
      { department_id: 'other', department_name: 'Diğer Birim' },
      { department_id: 'owner', department_name: 'Sahip' },
    ],
    summary: { agenda_checked: 2, agenda_total: 4, note_count: 3, participant_count: 5 },
  } as Meeting
  const wrapper = mount(Component, {
    props: { items: [item], complete: true },
    global: { plugins: [pinia, i18n, [VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  expect(wrapper.text()).toContain('2 / 4')
  expect(wrapper.text()).toContain('Sahip + 1 koordinatörlük')
  expect(wrapper.findAll('.meeting-code').map((code) => code.text())).toEqual(['SH', 'DB'])
  expect(wrapper.find('a').attributes('href')).toBe('/toplantilar/m')
  expect(wrapper.text()).not.toMatch(/Canlı|Bekliyor/)
  expect(paths).toEqual(['/v1/program/departments'])
  wrapper.unmount()
  client.clear()
})
