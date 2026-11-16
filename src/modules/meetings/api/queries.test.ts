import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, ref, type MaybeRefOrGetter } from 'vue'
import type { MeetingFilters } from '../model/types'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { useMeetings } from './queries'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

function mountList(
  filters: MaybeRefOrGetter<MeetingFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result!: ReturnType<typeof useMeetings>
  const app = createApp(
    defineComponent({
      setup() {
        result = useMeetings(filters, enabled)
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { app, client, result }
}

it('keeps filters on subsequent pages and resets cursor when filters change', async () => {
  const urls: URL[] = []
  server.use(
    http.get('http://localhost/v1/meetings', ({ request }) => {
      const url = new URL(request.url)
      urls.push(url)
      return HttpResponse.json({
        items: [],
        next_cursor: url.searchParams.has('cursor') ? '' : 'next',
      })
    }),
  )
  const filters = ref({ from: '2026-01-01' })
  const { app, client, result } = mountList(filters)
  await result.query.suspense()
  await result.query.fetchNextPage()
  expect(urls[1]?.searchParams.get('cursor')).toBe('next')
  expect(urls[1]?.searchParams.get('from')).toBe('2026-01-01')
  filters.value = { from: '2026-02-01' }
  await import('vue').then(({ nextTick }) => nextTick())
  await result.query.suspense()
  expect(urls.at(-1)?.searchParams.get('from')).toBe('2026-02-01')
  expect(urls.at(-1)?.searchParams.has('cursor')).toBe(false)
  app.unmount()
  client.clear()
})

it('does not mix a delayed old filter response into the new filter', async () => {
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const requested = new Promise<void>((resolve) => {
    started = resolve
  })
  server.use(
    http.get('http://localhost/v1/meetings', async ({ request }) => {
      const from = new URL(request.url).searchParams.get('from')
      if (from === '2026-01-01') {
        started()
        await gate
      }
      return HttpResponse.json({ items: [{ meeting_id: from }], next_cursor: '' })
    }),
  )
  const filters = ref({ from: '2026-01-01' })
  const { app, client, result } = mountList(filters)
  await requested
  filters.value = { from: '2026-02-01' }
  await import('vue').then(({ nextTick }) => nextTick())
  await result.query.suspense()
  release()
  const { settleQueries } = await import('@/shared/http/__tests__/settle')
  await settleQueries(client)
  expect(result.items.value.map((item) => item.meeting_id)).toEqual(['2026-02-01'])
  app.unmount()
  client.clear()
})

it('does not mix a delayed old program response into the new program', async () => {
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const requested = new Promise<void>((resolve) => {
    started = resolve
  })
  server.use(
    http.get('http://localhost/v1/meetings', async ({ request }) => {
      const program = request.headers.get('X-Nizamio-Program')
      if (program === 'p') {
        started()
        await gate
      }
      return HttpResponse.json({ items: [{ meeting_id: program }], next_cursor: '' })
    }),
  )
  const { app, client, result } = mountList({})
  await requested
  useScopeStore().commit({ programId: 'p2', departmentId: null, lens: 'admin' })
  await import('vue').then(({ nextTick }) => nextTick())
  await result.query.suspense()
  release()
  const { settleQueries } = await import('@/shared/http/__tests__/settle')
  await settleQueries(client)
  expect(result.items.value.map((item) => item.meeting_id)).toEqual(['p2'])
  app.unmount()
  client.clear()
})

it('does not request until enabled and uses the current filter', async () => {
  const urls: URL[] = []
  server.use(
    http.get('http://localhost/v1/meetings', ({ request }) => {
      urls.push(new URL(request.url))
      return HttpResponse.json({ items: [], next_cursor: '' })
    }),
  )
  const enabled = ref(false)
  const filters = ref({ from: '2026-02-02', to: '2026-01-01' })
  const { app, client, result } = mountList(filters, enabled)
  await import('vue').then(({ nextTick }) => nextTick())
  expect(urls).toHaveLength(0)
  filters.value = { from: '2026-01-01', to: '2026-02-02' }
  enabled.value = true
  await import('vue').then(({ nextTick }) => nextTick())
  await result.query.suspense()
  expect(urls).toHaveLength(1)
  expect(urls[0]?.searchParams.get('from')).toBe('2026-01-01')
  expect(urls[0]?.searchParams.get('to')).toBe('2026-02-02')
  app.unmount()
  client.clear()
})

it('sends the server tab and sort, exposes tab_counts and total, and restarts the cursor on tab change', async () => {
  const urls: URL[] = []
  server.use(
    http.get('http://localhost/v1/meetings', ({ request }) => {
      const url = new URL(request.url)
      urls.push(url)
      const past = url.searchParams.get('when') === 'past'
      return HttpResponse.json({
        items: [{ meeting_id: past ? 'old' : 'new' }],
        next_cursor: url.searchParams.has('cursor') ? '' : 'c1',
        total: past ? 7 : 3,
        tab_counts: { upcoming: 3, past: 7, deleted: null },
      })
    }),
  )
  const filters = ref<MeetingFilters>({ when: 'upcoming', sort: 'meeting_date_asc' })
  const { app, client, result } = mountList(filters)
  await result.query.suspense()
  await result.query.fetchNextPage()
  expect(urls[0]?.searchParams.get('when')).toBe('upcoming')
  expect(urls[0]?.searchParams.get('sort')).toBe('meeting_date_asc')
  expect(urls[1]?.searchParams.get('cursor')).toBe('c1')
  expect(result.query.data.value?.pages[0]?.tab_counts).toEqual({
    upcoming: 3,
    past: 7,
    deleted: null,
  })
  filters.value = { when: 'past' }
  await import('vue').then(({ nextTick }) => nextTick())
  await result.query.suspense()
  expect(urls.at(-1)?.searchParams.get('when')).toBe('past')
  expect(urls.at(-1)?.searchParams.has('cursor')).toBe(false)
  expect(result.query.data.value?.pages[0]?.total).toBe(7)
  expect(result.items.value.map((item) => item.meeting_id)).toEqual(['old'])
  app.unmount()
  client.clear()
})
