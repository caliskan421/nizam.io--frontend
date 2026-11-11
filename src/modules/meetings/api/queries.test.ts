import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, ref, type MaybeRefOrGetter } from 'vue'
import type { MeetingFilters } from '../model/types'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'
import { useMeetings } from './queries'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

function mountList(filters: MaybeRefOrGetter<MeetingFilters>) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result!: ReturnType<typeof useMeetings>
  const app = createApp(
    defineComponent({
      setup() {
        result = useMeetings(filters)
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
  await result.loadAll()
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

it.each(['session', 'owner'] as const)('stops loading pages after %s changes', async (change) => {
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve
  })
  let requests = 0
  server.use(
    http.get('http://localhost/v1/meetings', async ({ request }) => {
      requests += 1
      if (new URL(request.url).searchParams.has('cursor')) {
        started()
        await gate
      }
      return HttpResponse.json({ items: [], next_cursor: 'next' })
    }),
  )
  const { app, client, result } = mountList({})
  await result.query.suspense()
  const loading = result.loadAll()
  await requestStarted
  if (change === 'session') authSession.clear()
  else app.unmount()
  release()
  await loading.catch(() => undefined)
  expect(requests).toBe(2)
  if (change === 'session') app.unmount()
  client.clear()
})

it('stops on a repeated cursor even when the page is empty', async () => {
  let requests = 0
  server.use(
    http.get('http://localhost/v1/meetings', () => {
      requests += 1
      return HttpResponse.json({ items: [], next_cursor: 'same' })
    }),
  )
  const { app, client, result } = mountList({})
  await result.query.suspense()
  await expect(result.loadAll()).rejects.toThrow('Tekrarlanan toplantı imleci')
  expect(requests).toBe(2)
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
