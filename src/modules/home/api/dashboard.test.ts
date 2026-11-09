import { defineComponent, h, ref, type Ref } from 'vue'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'

import { queryKeys } from '@/shared/http/query-keys'
import { SessionChangedError } from '@/shared/session/query-session'

import {
  ADMIN_SCOPE,
  dashboard,
  dashboardHandler,
  DASHBOARD,
  http,
  json,
  mountWith,
  ORIGIN,
  resetAll,
  sent,
  server,
  settle,
} from '../__tests__/harness'
import { DASHBOARD_STALE_MS, useDashboard } from './dashboard'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

let result: ReturnType<typeof useDashboard> | undefined
const probe = (enabled: Ref<boolean>) =>
  defineComponent({
    setup() {
      result = useDashboard(enabled)
      return () => h('div')
    },
  })

describe('useDashboard (reportDashboard, S2)', () => {
  it('tek istek, program başlığı; departman başlığı yok; anahtar ortak fabrikadan', async () => {
    server.use(dashboardHandler(dashboard({ total_tasks: 7 })))
    const { queryClient, store } = await mountWith(probe(ref(true)), ADMIN_SCOPE)
    const [request, ...rest] = sent(DASHBOARD)
    expect(rest).toHaveLength(0)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(result!.data.value?.total_tasks).toBe(7)
    const cached = queryClient.getQueryCache().find({
      queryKey: queryKeys.report.dashboard(store.snapshot),
      exact: true,
    })
    expect(Reflect.get(cached!.options, 'staleTime')).toBe(DASHBOARD_STALE_MS)
  })

  it('etkin değilken ya da program yokken istek atılmaz', async () => {
    server.use(dashboardHandler())
    const off = ref(false)
    await mountWith(probe(off), ADMIN_SCOPE)
    await mountWith(probe(ref(true)), null)
    await settle()
    expect(sent(DASHBOARD)).toHaveLength(0)
    off.value = true
    await settle()
    expect(sent(DASHBOARD)).toHaveLength(1)
  })

  it('W82c okuyucu kapısı: istek uçuştayken oturum değişirse yanıt önbelleğe yazılmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}${DASHBOARD}`, async () => {
        await gate
        return json(dashboard({ total_tasks: 7 }))
      }),
    )
    const pending = mountWith(probe(ref(true)), ADMIN_SCOPE)
    await vi.waitFor(() => expect(sent(DASHBOARD)).toHaveLength(1))
    authSession.clear()
    release()
    const { queryClient, store } = await pending
    await settle()
    const cached = queryClient.getQueryState(queryKeys.report.dashboard(store.snapshot))
    expect(cached?.data).toBeUndefined()
    expect(cached?.error).toBeInstanceOf(SessionChangedError)
    expect(sent(DASHBOARD)).toHaveLength(1)
  })
})
