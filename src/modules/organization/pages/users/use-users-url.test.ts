import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { resetHarness, server } from '../../__tests__/harness'
import { mountWith, settle, unmountAll } from '../../components/users/__tests__/users-harness'
import { useUsersUrl } from './use-users-url'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

describe('useUsersUrl', () => {
  it('süzgeç replace, panel push; kapsam değişince q/rol korunur, diğerleri düşer + onReset', async () => {
    const reset = vi.fn()
    let url: ReturnType<typeof useUsersUrl> | undefined
    const probe = defineComponent({
      setup() {
        url = useUsersUrl(reset)
        return () => h('div')
      },
    })
    const { router, store } = await mountWith(
      probe,
      {},
      {
        path: '/kullanicilar?rol=uye&q=ay&koordinatorluk=d1',
      },
    )
    expect(url!.state.value).toEqual({ tab: 'uye', search: 'ay', department: 'd1', selected: null })

    const length = window.history.length
    await url!.update({ selected: 'u1' }, 'push')
    expect(router.currentRoute.value.query).toEqual({
      rol: 'uye',
      q: 'ay',
      koordinatorluk: 'd1',
      secili: 'u1',
    })
    expect(window.history.length).toBeGreaterThanOrEqual(length)

    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle()
    expect(reset).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({ rol: 'uye', q: 'ay' })
  })
})
