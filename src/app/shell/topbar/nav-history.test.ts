import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { createRouter, createWebHistory, type Router } from 'vue-router'

import { navAvailability, useNavHistory } from './nav-history'

const Empty = { render: () => null }

function webRouter(): Router {
  return createRouter({
    history: createWebHistory(),
    routes: ['/', '/a', '/b'].map((path) => ({ path, component: Empty })),
  })
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('geri / ileri (E-00-33/34)', () => {
  it('geçmiş kaydından: yalnız uygulama içi önceki/sonraki konum sayılır', () => {
    expect(navAvailability(null)).toEqual({ canBack: false, canForward: false })
    expect(navAvailability({})).toEqual({ canBack: false, canForward: false })
    expect(navAvailability({ back: '/a', forward: null })).toEqual({
      canBack: true,
      canForward: false,
    })
    expect(navAvailability({ back: null, forward: '/b' })).toEqual({
      canBack: false,
      canForward: true,
    })
  })

  it('ilk açılışta ikisi kapalı; gezinmeden sonra geri; geri sonrası ileri; yeni gezinme ileriyi kapatır', async () => {
    const router = webRouter()
    await router.push('/')
    await router.isReady()
    const scope = effectScope()
    const nav = scope.run(() => useNavHistory(router))!
    expect([nav.canBack.value, nav.canForward.value]).toEqual([false, false])

    await router.push('/a')
    expect([nav.canBack.value, nav.canForward.value]).toEqual([true, false])

    nav.back()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    await vi.waitFor(() => expect(nav.canForward.value).toBe(true))
    expect(nav.canBack.value).toBe(false)

    nav.forward()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/a'))
    await vi.waitFor(() => expect(nav.canForward.value).toBe(false))

    nav.back()
    await vi.waitFor(() => expect(nav.canForward.value).toBe(true))
    await router.push('/b')
    expect([nav.canBack.value, nav.canForward.value]).toEqual([true, false])
    scope.stop()
  })

  it('kapalıyken geri/ileri çağrısı gezinmez', async () => {
    const router = webRouter()
    await router.push('/')
    const back = vi.spyOn(router, 'back')
    const forward = vi.spyOn(router, 'forward')
    const scope = effectScope()
    const nav = scope.run(() => useNavHistory(router))!
    nav.back()
    nav.forward()
    expect(back).not.toHaveBeenCalled()
    expect(forward).not.toHaveBeenCalled()
    scope.stop()
  })
})
