// withEffects: "sonuç bilinmiyor" retry ve onay devamları da gerçek başarıda AYNI efekti, İLK
// gönderimin yakalanmış vars/kapsamıyla bir kez uygular (W185b retry düzeltmesi).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import type { MutationOutcome, ProtectedMutation } from '@/shared/http/mutation'
import { isDetached, markDetached } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import { withEffects } from './effects'

type V = { id: string }
type Out = MutationOutcome<V, string, unknown>
const err = { code: 'x' } as never

function setup(first: Out, effects: Parameters<typeof withEffects<V, string>>[1]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const base = { submit: vi.fn(() => Promise.resolve(first)) } as unknown as ProtectedMutation<
    V,
    string,
    unknown
  >
  let wrapped!: ProtectedMutation<V, string, unknown>
  const wrapper = mount(
    defineComponent({
      setup() {
        wrapped = withEffects(base, effects)
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]] } },
  )
  return { wrapped, wrapper }
}
const unknown = (retry: (() => Promise<Out>) | null): Out => ({
  kind: 'unknown_outcome',
  error: err,
  reason: 'network',
  draft: { id: 'a' },
  idempotencyKey: 'k',
  firstSentAt: 0,
  retry,
})

describe('withEffects — retry/confirm devamları', () => {
  it('unknown → unknown → success: efekt YALNIZ gerçek başarıda, bir kez, ilk vars/kapsamla', async () => {
    const onSuccess = vi.fn()
    const done: Out = { kind: 'success', data: 'gerçek', status: 201 } as Out
    const second = unknown(() => Promise.resolve(done))
    const { wrapped } = setup(
      unknown(() => Promise.resolve(second)),
      { onSuccess },
    )
    const first = await wrapped.submit({ id: 'a' })
    expect(onSuccess).not.toHaveBeenCalled()
    if (first.kind !== 'unknown_outcome') throw new Error('beklenmeyen')
    const again = await first.retry!()
    expect(again.kind).toBe('unknown_outcome')
    expect(onSuccess).not.toHaveBeenCalled()
    if (again.kind !== 'unknown_outcome') throw new Error('beklenmeyen')
    expect(await again.retry!()).toBe(done)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    const fx = onSuccess.mock.calls[0]![0]
    expect(fx.vars).toEqual({ id: 'a' })
    expect(fx.data).toBe('gerçek')
    expect(fx.scope).toMatchObject({ programId: 'p1' })
  })

  it('gönderim sonrası değişen giriş, tekrarın yakalanmış değişkenlerini değiştirmez', async () => {
    const onSuccess = vi.fn()
    const done = { kind: 'success', data: 'x', status: 200 } as Out
    const { wrapped } = setup(
      unknown(() => Promise.resolve(done)),
      { onSuccess },
    )
    const vars = { id: 'ilk' }
    const pending = wrapped.submit(vars)
    vars.id = 'sonra'
    const out = await pending
    if (out.kind !== 'unknown_outcome') throw new Error('beklenmeyen')
    await out.retry!()
    expect(onSuccess.mock.calls[0]![0].vars.id).toBe('ilk')
  })

  it('retry sırasında kapsam değişse de efekt İLK gönderimin yakalanmış kapsamıyla uygulanır', async () => {
    const onSuccess = vi.fn()
    const done = { kind: 'success', data: 'x', status: 200 } as Out
    const { wrapped } = setup(
      unknown(() => Promise.resolve(done)),
      { onSuccess },
    )
    const first = await wrapped.submit({ id: 'a' })
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    if (first.kind !== 'unknown_outcome') throw new Error('beklenmeyen')
    await first.retry!()
    expect(onSuccess.mock.calls[0]![0].scope.programId).toBe('p1')
  })

  it('retry başarısız (failed) olursa onFailure uygulanır, onSuccess değil', async () => {
    const onSuccess = vi.fn()
    const onFailure = vi.fn()
    const failed = { kind: 'failed', error: { code: 'messaging.x' }, status: 422 } as unknown as Out
    const { wrapped } = setup(
      unknown(() => Promise.resolve(failed)),
      { onSuccess, onFailure },
    )
    const first = await wrapped.submit({ id: 'a' })
    if (first.kind !== 'unknown_outcome') throw new Error('beklenmeyen')
    await first.retry!()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'messaging.x', vars: { id: 'a' } }),
    )
  })

  it('confirm devamı da gerçek başarıda efekti uygular; retry:null (süresi dolmuş) olduğu gibi kalır', async () => {
    const onSuccess = vi.fn()
    const done = { kind: 'success', data: 'c', status: 200 } as Out
    const confirm = {
      kind: 'confirmation_required',
      error: err,
      taskTitles: [],
      confirm: () => Promise.resolve(done),
    } as Out
    const { wrapped } = setup(confirm, { onSuccess })
    const out = await wrapped.submit({ id: 'a' })
    if (out.kind !== 'confirmation_required') throw new Error('beklenmeyen')
    await out.confirm()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    const expired = setup(unknown(null), { onSuccess }).wrapped
    expect(((await expired.submit({ id: 'a' })) as { retry: unknown }).retry).toBeNull()
  })

  it('sahipsiz (detached) işareti sarılmış sonuçta korunur; sahip sökülünce alive() false', async () => {
    const alive: boolean[] = []
    const detached = markDetached(
      unknown(() => Promise.resolve({ kind: 'success', data: 'd', status: 200 } as Out)),
    )
    const { wrapped, wrapper } = setup(detached, { onSuccess: (fx) => void alive.push(fx.alive()) })
    const first = await wrapped.submit({ id: 'a' })
    expect(isDetached(first)).toBe(true)
    wrapper.unmount()
    if (first.kind !== 'unknown_outcome') throw new Error('beklenmeyen')
    await first.retry!()
    expect(alive).toEqual([false])
  })
})
