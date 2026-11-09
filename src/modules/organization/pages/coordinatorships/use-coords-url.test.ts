import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { mountWith, settle, unmountAll } from '../../components/coordinatorships/__tests__/mount'
import { useCoordsUrl } from './use-coords-url'

afterEach(() => unmountAll())

function probe(onReset = vi.fn()) {
  let api: ReturnType<typeof useCoordsUrl> | undefined
  const component = defineComponent({
    setup() {
      api = useCoordsUrl(onReset)
      return () => null
    },
  })
  return { component, api: () => api!, onReset }
}

describe('useCoordsUrl', () => {
  it('durum URL’den; güncelleme geçmişe kayıt eklemeden yazar', async () => {
    const p = probe()
    const { router } = await mountWith(p.component, { path: '/koordinatorlukler?q=a' })
    expect(p.api().state.value).toEqual({ search: 'a', direction: 'artan' })
    const push = vi.spyOn(router, 'push')
    const replace = vi.spyOn(router, 'replace')
    await p.api().update({ direction: 'azalan' })
    expect(router.currentRoute.value.fullPath).toBe('/koordinatorlukler?q=a&sirala=ad:azalan')
    expect(replace).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it('kapsam değişince onReset; q korunur, sirala ve bilinmeyenler düşer', async () => {
    const p = probe()
    const { router, store } = await mountWith(p.component, {
      path: '/koordinatorlukler?q=a&sirala=ad:azalan&gorunum=liste&x=1',
    })
    store.setProgram('p2')
    await settle()
    expect(p.onReset).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({ q: 'a' })
  })
})
