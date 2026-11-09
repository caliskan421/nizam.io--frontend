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

let reset = vi.fn()
let url: ReturnType<typeof useUsersUrl> | undefined
const probe = defineComponent({
  setup() {
    url = useUsersUrl(reset)
    return () => h('div')
  },
})

describe('useUsersUrl', () => {
  it('süzgeç replace, panel push; kapsam değişince q/rol korunur, diğerleri düşer + onReset', async () => {
    reset = vi.fn()
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

  it('kapsamın ilk çözümü (program yok → program) değişim sayılmaz: derin bağlantı korunur', async () => {
    reset = vi.fn()
    const { router, store } = await mountWith(
      probe,
      {},
      {
        path: '/kullanicilar?koordinatorluk=d1&secili=u1',
        selection: { programId: null, lens: null, departmentId: null },
      },
    )
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    await settle()
    expect(reset).not.toHaveBeenCalled()
    expect(router.currentRoute.value.query).toEqual({ koordinatorluk: 'd1', secili: 'u1' })
  })
})
