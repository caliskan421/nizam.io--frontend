import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'
import type { Standing } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'

import type { Calendar, Milestone } from '../model/calendar'
import CalendarPage from './CalendarPage.vue'

const server = setupServer()
const origin = 'http://localhost'
const standing = ref<Standing>()
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({ standing, status: ref('ready') }),
}))

let wrapper: VueWrapper | undefined
let client: QueryClient | undefined

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-19T22:00:00Z'))
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  client?.clear()
  client = undefined
  server.resetHandlers()
  vi.useRealTimers()
})
afterAll(() => server.close())

function empty(from: string, to: string): Calendar {
  return {
    range: { from, to },
    timezone: 'Europe/Istanbul',
    meetings: [],
    meetings_truncated: false,
    tasks: [],
    tasks_truncated: false,
    date_requests: [],
    date_requests_truncated: false,
    season: { milestones: [] },
    table_records: [],
    table_records_truncated: false,
  }
}
const emptyPage = { render: () => null }
async function render(admin = false) {
  const pinia = createPinia()
  const scope = useScopeStore(pinia)
  standing.value = {
    accountId: 'user',
    fullName: 'Deneme',
    email: 'deneme@example.test',
    companyAdmin: admin,
    rows: [
      {
        programId: 'p1',
        programName: 'Bir',
        departmentId: 'd1',
        displayName: 'Ekip',
        role: 'member',
      },
      {
        programId: 'p2',
        programName: 'İki',
        departmentId: 'd1',
        displayName: 'Ekip',
        role: 'member',
      },
    ],
  }
  scope.commit({
    programId: 'p1',
    departmentId: admin ? null : 'd1',
    lens: admin ? 'admin' : 'member',
  })
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/takvim', name: 'calendar', component: CalendarPage },
      { path: '/toplantilar/:meetingId', name: 'collaboration.meeting', component: emptyPage },
      { path: '/tablolar/:tableId', name: 'tables.detail', component: emptyPage },
      { path: '/gorevler', name: 'work.tasks', component: emptyPage },
    ],
  })
  await router.push('/takvim')
  wrapper = mount(CalendarPage, {
    attachTo: document.body,
    global: { plugins: [i18n, router, pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  return { router, scope, view: wrapper }
}

function respond(request: Request, add?: (body: Calendar) => void) {
  const url = new URL(request.url)
  const body = empty(url.searchParams.get('from')!, url.searchParams.get('to')!)
  add?.(body)
  return HttpResponse.json(body)
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const button = (root: ParentNode, name: string) =>
  [...root.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === name || item.getAttribute('aria-label') === name,
  )!
const day = (view: VueWrapper, label: string) =>
  view
    .findAll<HTMLButtonElement>('.calendar-cell')
    .find((item) => item.attributes('aria-label')?.startsWith(label))!

it('S2 ayı ve hızlı bakışı okur, kurulum gününü kullanır, süzer ve gerçek ayrıntı bağlantıları verir', async () => {
  const requested: string[] = []
  server.use(
    http.get(origin + '/v1/calendar', ({ request }) => {
      const url = new URL(request.url)
      expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      requested.push(url.searchParams.get('from')!)
      return respond(request, (body) => {
        body.meetings = [
          {
            id: 'm1',
            title: 'Planlama',
            departments: [],
            agenda_count: 2,
            participant_count: 3,
            live: true,
            starts_at: '2026-11-19T22:30:00Z',
            local_date: '2026-11-20',
            local_time: '01:30',
          },
        ]
        body.table_records = [
          {
            table_id: 't1',
            table_name: 'Vardiya',
            row_id: 'r1',
            row_label: 'Akşam',
            column_id: 'c1',
            column_name: 'Tarih',
            on: '2026-11-20',
            space: 'personal',
            fields: [
              { column_id: 'c2', name: 'Ekip', type: 'person_reference', value: 'hidden-id' },
            ],
          },
        ]
        body.tasks = ['w1', 'w2', 'w3'].map((id) => ({
          id,
          title: 'Görev ' + id,
          code: '',
          start_on: '2026-11-19',
          end_on: '2026-11-20',
          status: 'devam_ediyor',
          priority: '',
          late_days: 0,
          overdue: false,
          assignee_count: 0,
          assignees: [],
          department: { id: 'd1', code: '', name: 'Ekip' },
        }))
        body.season.milestones = [{ id: 's1', on: '2026-11-20', name: 'Kurulum' }]
        body.date_requests_truncated = true
      })
    }),
  )
  const { view } = await render()
  await vi.waitFor(() => expect(view.find('.calendar-grid').exists()).toBe(true))
  expect(requested).toEqual(expect.arrayContaining(['2026-10-26', '2026-11-13']))
  expect(view.text()).toContain('bazı kayıtlar')
  expect(view.text()).not.toContain('Tarih talepleri')
  expect(view.text()).not.toContain('Kilometre taşlarını yönet')
  await vi.waitFor(() =>
    expect(view.findAll('.calendar-quick__tags .calendar-kind').map((tag) => tag.text())).toEqual([
      '1 toplantı',
      '1 tablo kaydı',
      '3 görev',
      '1 kilometre taşı',
    ]),
  )
  const entry = day(view, '20 Kasım')
  expect(entry.attributes('aria-current')).toBe('date')
  await entry.trigger('click')
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('01:30'))
  expect(dialog()?.querySelector('a[href="/toplantilar/m1"]')).not.toBeNull()
  expect(dialog()?.querySelector('a[href="/tablolar/t1"]')).not.toBeNull()
  expect(dialog()?.textContent).not.toContain('hidden-id')
  expect(
    Array.from(dialog()!.querySelectorAll('.calendar-day__counts .calendar-kind'), (tag) =>
      tag.textContent?.trim(),
    ),
  ).toEqual(['1 toplantı', '1 tablo kaydı', '3 görev', '1 kilometre taşı'])
  button(dialog()!, 'Kapat').click()
  await vi.waitFor(() => expect(dialog()).toBeNull())
  button(view.element, 'Toplantılar').click()
  await vi.waitFor(() => expect(day(view, '20 Kasım').text()).not.toContain('Planlama'))
  button(view.element, 'Sonraki ay').click()
  await vi.waitFor(() => expect(view.text()).toContain('Aralık 2026'))
})

it('kapsam değişince eski gün kapanır ve geç eski sonuç yeni programı doldurmaz', async () => {
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  let block = false
  let oldPending = false
  server.use(
    http.get(origin + '/v1/calendar', async ({ request }) => {
      const old = request.headers.get('X-Nizamio-Program') === 'p1'
      if (old && block) {
        oldPending = true
        await hold
      }
      return respond(request, (body) => {
        body.season.milestones = [
          { id: 's1', name: old ? 'Eski program taşı' : 'Yeni program taşı', on: '2026-11-20' },
        ]
      })
    }),
  )
  const { view, scope } = await render()
  await vi.waitFor(() => expect(view.text()).toContain('Eski program taşı'))
  await day(view, '20 Kasım').trigger('click')
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('Eski program taşı'))
  block = true
  const refreshing = client!.invalidateQueries()
  await vi.waitFor(() => expect(oldPending).toBe(true))
  scope.commit({ programId: 'p2', departmentId: 'd1', lens: 'member' })
  await vi.waitFor(() => expect(dialog()).toBeNull())
  release()
  await refreshing
  await vi.waitFor(() => expect(view.text()).toContain('Yeni program taşı'))
  expect(view.text()).not.toContain('Eski program taşı')
})

it('şirket yöneticisi programın kilometre taşını oluşturur, günceller ve onayla siler', async () => {
  let items: Milestone[] = []
  const reads: string[] = []
  const changes: string[] = []
  const url = origin + '/v1/programs/p1/milestones'
  server.use(
    http.get(origin + '/v1/calendar', ({ request }) =>
      respond(request, (body) => {
        body.season.milestones = items
      }),
    ),
    http.get(url, ({ request }) => {
      reads.push(request.method)
      return HttpResponse.json({ milestones: items })
    }),
    http.post(url, async ({ request }) => {
      changes.push('create')
      expect(request.headers.get('X-Requested-With')).toBeTruthy()
      expect(request.headers.get('X-Nizamio-Program')).toBeNull()
      const { name, on } = (await request.json()) as { name: string; on: string }
      items = [{ id: 'milestone', program_id: 'p1', created_at: '', updated_at: '', name, on }]
      return HttpResponse.json(items[0], { status: 201 })
    }),
    http.patch(url + '/milestone', async ({ request }) => {
      changes.push('update')
      const body = (await request.json()) as { name: string }
      expect(body).toEqual({ name: 'Açılış' })
      items = [{ ...items[0]!, ...body }]
      return HttpResponse.json(items[0])
    }),
    http.delete(url + '/milestone', () => {
      changes.push('delete')
      items = []
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const { view } = await render(true)
  expect(reads).toHaveLength(0)
  button(view.element, 'Kilometre taşlarını yönet').click()
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('Henüz kilometre taşı yok.'))
  button(dialog()!, 'Kilometre taşı ekle').click()
  async function submitName(name: string) {
    await vi.waitFor(() => expect(dialog()?.querySelector('input')).not.toBeNull())
    const input = dialog()!.querySelector<HTMLInputElement>('input')!
    input.value = name
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.waitFor(() =>
      expect(dialog()?.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(
        false,
      ),
    )
    dialog()!
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Kilometre taşı kaydedildi.'))
  }
  await submitName('Kurulum')
  await vi.waitFor(() => expect(view.text()).toContain('Kurulum'))
  button(dialog()!, 'Kurulum düzenle').click()
  await submitName('Açılış')
  await vi.waitFor(() => expect(view.text()).toContain('Açılış'))
  button(dialog()!, 'Açılış sil').click()
  expect(changes).toEqual(['create', 'update'])
  await vi.waitFor(() =>
    expect(dialog()?.querySelector('[aria-label="Silme onayı"]')).not.toBeNull(),
  )
  button(dialog()!.querySelector('[aria-label="Silme onayı"]')!, 'Sil').click()
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('Kilometre taşı silindi.'))
  expect(changes).toEqual(['create', 'update', 'delete'])
  expect(view.text()).not.toContain('Açılış')
})

it('oluşturma sonucu belirsizse formu kapatır, taze listeyi okur ve otomatik tekrar etmez', async () => {
  let writes = 0
  let reads = 0
  const url = origin + '/v1/programs/p1/milestones'
  server.use(
    http.get(origin + '/v1/calendar', ({ request }) => respond(request)),
    http.get(url, () => {
      reads += 1
      return HttpResponse.json({
        milestones: writes
          ? [
              {
                id: 'm',
                program_id: 'p1',
                name: 'Kurulum',
                on: '2026-11-20',
                created_at: '',
                updated_at: '',
              },
            ]
          : [],
      })
    }),
    http.post(url, () => {
      writes += 1
      return HttpResponse.error()
    }),
  )
  const { view } = await render(true)
  button(view.element, 'Kilometre taşlarını yönet').click()
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('Henüz kilometre taşı yok.'))
  button(dialog()!, 'Kilometre taşı ekle').click()
  await vi.waitFor(() => expect(dialog()?.querySelector('input')).not.toBeNull())
  const input = dialog()!.querySelector<HTMLInputElement>('input')!
  input.value = 'Kurulum'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  dialog()!
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('İşlem sonucu doğrulanamadı.'))
  await vi.waitFor(() => expect(dialog()?.textContent).toContain('Kurulum'))
  expect(dialog()?.querySelector('form')).toBeNull()
  expect(writes).toBe(1)
  expect(reads).toBe(2)
})

it('bir aralık erişim reddi alırsa diğer aralığın bayat kayıtlarını da gizler', async () => {
  let denied = false
  server.use(
    http.get(origin + '/v1/calendar', ({ request }) => {
      if (denied && new URL(request.url).searchParams.get('from') === '2026-11-13') {
        return HttpResponse.json({ code: 'platform.forbidden' }, { status: 403 })
      }
      return respond(request, (body) => {
        body.season.milestones = [{ id: 's1', name: 'Önceki kayıt', on: '2026-11-20' }]
      })
    }),
  )
  const { view } = await render(true)
  await vi.waitFor(() => expect(view.text()).toContain('Önceki kayıt'))
  await day(view, '20 Kasım').trigger('click')
  await vi.waitFor(() => expect(dialog()).not.toBeNull())
  denied = true
  await client!.invalidateQueries()
  await vi.waitFor(() => expect(view.text()).toContain('Takvim açılamadı'))
  expect(view.text()).not.toContain('Önceki kayıt')
  expect(dialog()).toBeNull()
  expect(button(view.element, 'Kilometre taşlarını yönet')).toBeUndefined()
})
