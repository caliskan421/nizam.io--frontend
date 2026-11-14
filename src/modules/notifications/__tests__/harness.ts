// Bildirim testleri: GERÇEK API istemcisi + MSW sahte backend + gerçek Pinia + TanStack Query.
// Oturum `authSession.establish` ile açılır (oturum deposu `isAuthenticated` okur).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

import { authSession } from '@/shared/http'
import { settleQueries } from '@/shared/http/__tests__/settle'

export const ORIGIN = 'http://localhost'
export const server = setupServer()
export { http, settleQueries }

export interface Recorded {
  method: string
  path: string
  query: URLSearchParams
  headers: Headers
  body: string
}
export const requests: Recorded[] = []

server.events.on('request:end', () => undefined)
server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url)
  requests.push({
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    headers: new Headers(request.headers),
    body: '',
  })
})

export const sent = (method: string, path: string) =>
  requests.filter((r) => r.method === method && r.path === path)

export const json = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status })
export const noContent = () => new HttpResponse(null, { status: 204 })
export const errorEnvelope = (code: string, status: number) =>
  HttpResponse.json({ code, message: 'sunucu iletisi', request_id: 'r', fields: [] }, { status })

export function signIn(): void {
  authSession.establish({
    token: 'tok-1',
    account_id: 'acc-1',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    force_password_change: false,
  } as never)
}

export interface Mounted<T> {
  result: T
  client: QueryClient
  wrapper: VueWrapper
}

export function mountSetup<T>(setup: () => T, client?: QueryClient): Mounted<T> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const queryClient =
    client ?? new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = setup()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] } },
  )
  return { result, client: queryClient, wrapper }
}

export function resetAll(): void {
  server.resetHandlers()
  requests.length = 0
}
