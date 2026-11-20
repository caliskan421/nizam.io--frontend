import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'

import {
  createFakeLifecycle,
  mountWithScope,
  sideContext,
} from '@/app/shell/side/__tests__/fake-lifecycle'

import PushPreferences from './PushPreferences.vue'

const url = 'http://localhost/v1/notifications/preferences'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
const preference = { group: 'gorev', push_muted: false } as const

it('sunucu doğrulayınca yalnız seçilen hesap-geneli push tercihini değiştirir', async () => {
  let requestHeaders: Headers | undefined
  let payload: unknown
  server.use(
    http.get(url, () => HttpResponse.json({ preferences: [preference] })),
    http.put(url, async ({ request }) => {
      requestHeaders = request.headers
      payload = await request.json()
      return HttpResponse.json({ preferences: [{ ...preference, push_muted: true }] })
    }),
  )
  const context = await sideContext()
  const { lifecycle, store } = createFakeLifecycle()
  store.setProgram('p1')
  const wrapper = mountWithScope(context, lifecycle, PushPreferences, {})
  try {
    await vi.waitFor(() =>
      expect(wrapper.get('[role=switch]').attributes('aria-checked')).toBe('true'),
    )
    await wrapper.get('[role=switch]').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.get('[role=switch]').attributes('aria-checked')).toBe('false'),
    )
    expect(wrapper.text()).toContain('Bildirim tercihi kaydedildi')
    expect(payload).toEqual({ preferences: [{ group: 'gorev', push_muted: true }] })
    expect(requestHeaders?.get('X-Requested-With')).toBeTruthy()
    expect(requestHeaders?.get('X-Nizamio-Program')).toBeNull()
  } finally {
    wrapper.unmount()
  }
})

it('başarısız yazmada eski değeri korur ve başarı göstermez', async () => {
  server.use(
    http.get(url, () => HttpResponse.json({ preferences: [preference] })),
    http.put(url, () =>
      HttpResponse.json({ code: 'notifications.input_invalid' }, { status: 422 }),
    ),
  )
  const context = await sideContext()
  const { lifecycle } = createFakeLifecycle()
  const wrapper = mountWithScope(context, lifecycle, PushPreferences, {})
  try {
    await vi.waitFor(() =>
      expect(wrapper.get('[role=switch]').attributes('aria-checked')).toBe('true'),
    )
    await wrapper.get('[role=switch]').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role=alert]').exists()).toBe(true))
    expect(wrapper.get('[role=switch]').attributes('aria-checked')).toBe('true')
    expect(wrapper.text()).not.toContain('Bildirim tercihi kaydedildi')
  } finally {
    wrapper.unmount()
  }
})

it('sonucu belirsiz tek yazmadan sonra yeniden yazmadan güncel tercihi okur', async () => {
  const requests: string[] = []
  server.use(
    http.get(url, () => {
      requests.push('GET')
      return HttpResponse.json({
        preferences: [{ ...preference, push_muted: requests.includes('PUT') }],
      })
    }),
    http.put(url, () => {
      requests.push('PUT')
      return HttpResponse.json({ code: 'platform.internal' }, { status: 500 })
    }),
  )
  const context = await sideContext()
  const { lifecycle } = createFakeLifecycle()
  const wrapper = mountWithScope(context, lifecycle, PushPreferences, {})
  try {
    await vi.waitFor(() =>
      expect(wrapper.get('[role=switch]').attributes('aria-checked')).toBe('true'),
    )
    await wrapper.get('[role=switch]').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.get('[role=switch]').attributes('aria-checked')).toBe('false'),
    )
    expect(requests).toEqual(['GET', 'PUT', 'GET'])
    expect(wrapper.find('[role=alert]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Bildirim tercihi kaydedildi')
  } finally {
    wrapper.unmount()
  }
})
