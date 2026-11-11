import { expect, it } from 'vitest'
import { ApiError } from '@/shared/errors/api-error'
import { isMeetingAccessLoss } from './use-meeting-loss'

it('yalnız 403/404 toplantı erişim kaybını tanır', () => {
  expect(
    isMeetingAccessLoss(new ApiError({ code: 'collaboration.meeting_not_found', status: 404 })),
  ).toBe(true)
  expect(
    isMeetingAccessLoss(new ApiError({ code: 'collaboration.not_authorized', status: 403 })),
  ).toBe(true)
  expect(isMeetingAccessLoss(new ApiError({ code: 'platform.internal_error', status: 500 }))).toBe(
    false,
  )
})

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, ref } from 'vue'
import { vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { useMeetingLoss } from './use-meeting-loss'

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), push: vi.fn() }))
vi.mock('@/shared/scope/standing', () => ({ invalidateStanding: mocks.invalidate }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { zaman: 'gecmis', koordinatorluk: 'd1', notlar: 'benim' } }),
  useRouter: () => ({ push: mocks.push }),
}))

function setup(initial: unknown) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const scope = useScopeStore()
  scope.commit({ programId: 'p1', departmentId: 'd1', lens: 'coordinator' })
  const error = ref(initial)
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  const gate = { promise, resolve }
  mocks.invalidate.mockReset().mockReturnValue(gate.promise)
  mocks.push.mockReset()
  const wrapper = mount(
    defineComponent({
      setup() {
        useMeetingLoss(error, ref('m1'))
        return () => null
      },
    }),
    {
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]] },
    },
  )
  return { scope, error, gate, wrapper }
}
const loss = () => new ApiError({ code: 'collaboration.meeting_not_found', status: 404 })

it('önbellekteki ilk hatayı doğrular ve liste filtrelerini korur', async () => {
  const { gate, wrapper } = setup(loss())
  expect(mocks.invalidate).toHaveBeenCalledOnce()
  gate.resolve()
  await flushPromises()
  expect(mocks.push).toHaveBeenCalledWith({
    name: 'collaboration.meetings',
    query: { zaman: 'gecmis', koordinatorluk: 'd1' },
  })
  wrapper.unmount()
})
it('standing beklerken mercek veya departman değişirse geç gezinmez', async () => {
  const { scope, gate, wrapper } = setup(loss())
  scope.commit({ programId: 'p1', departmentId: 'd2', lens: 'member' })
  gate.resolve()
  await flushPromises()
  expect(mocks.push).not.toHaveBeenCalled()
  wrapper.unmount()
})
it('standing beklerken hata temizlenirse geç gezinmez', async () => {
  const { error, gate, wrapper } = setup(loss())
  error.value = null
  await flushPromises()
  gate.resolve()
  await flushPromises()
  expect(mocks.push).not.toHaveBeenCalled()
  wrapper.unmount()
})
