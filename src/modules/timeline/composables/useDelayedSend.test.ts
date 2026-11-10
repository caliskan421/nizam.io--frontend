import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { authSession } from '@/shared/http'
import type { ActionContext } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import { ADMIN_SCOPE } from '../__tests__/harness'
import { DELAYED_SEND_MS, useDelayedSend } from './useDelayedSend'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  useScopeStore().commit(ADMIN_SCOPE)
})
afterEach(() => {
  vi.useRealTimers()
  if (authSession.snapshot.accountId) authSession.clear()
})

type Send = (payload: string, context: ActionContext) => Promise<void>

function setup(send = vi.fn<Send>(() => Promise.resolve())) {
  let api!: ReturnType<typeof useDelayedSend<string>>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useDelayedSend<string>({ send })
        return () => h('div')
      },
    }),
    { global: { plugins: [] } },
  )
  return { api, send, wrapper }
}

describe('useDelayedSend — 5 sn gecikmeli gönderim', () => {
  it('süre dolana dek istek yok; sonunda TEK gönderim (yakalanan bağlamla)', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    expect(api.pending.value).toMatchObject({ key: 'w1', totalMs: DELAYED_SEND_MS, visible: true })
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS - 1)
    expect(send).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('a', {
      scope: expect.objectContaining({ programId: 'p1', lens: 'admin' }),
      generation: authSession.generation,
    })
    expect(api.pending.value).toBeNull()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('kalan süre geri sayar', async () => {
    const { api } = setup()
    api.schedule('w1', 'a')
    await vi.advanceTimersByTimeAsync(2000)
    expect(api.pending.value?.remainingMs).toBe(3000)
  })

  it('İptal et süre içinde isteği hiç göndermez', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    await vi.advanceTimersByTimeAsync(4000)
    expect(api.cancel()).toBe(true)
    expect(api.pending.value).toBeNull()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(send).not.toHaveBeenCalled()
    expect(api.cancel()).toBe(false)
  })

  it('✕ (dismiss) yalnız gizler — gönderim sürer', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    api.dismiss()
    expect(api.pending.value?.visible).toBe(false)
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('aynı anahtarda yeni bırakma değiştirir ve süreyi yeniden başlatır (tek istek)', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    await vi.advanceTimersByTimeAsync(3000)
    api.schedule('w1', 'b')
    expect(api.pending.value?.visible).toBe(true)
    await vi.advanceTimersByTimeAsync(3000)
    expect(send).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toBe('b')
  })

  it('başka anahtar öncekinin iptal penceresini KESMEZ: her görev kendi süresinde, tek istekle gider', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    await vi.advanceTimersByTimeAsync(1000)
    api.schedule('w2', 'b')
    await vi.advanceTimersByTimeAsync(3999)
    expect(send).not.toHaveBeenCalled() // w1: 4999 ms geçti, pencere sürüyor
    await vi.advanceTimersByTimeAsync(1)
    expect(send.mock.calls.map((c) => c[0])).toEqual(['a'])
    await vi.advanceTimersByTimeAsync(1000)
    expect(send.mock.calls.map((c) => c[0])).toEqual(['a', 'b'])
    await vi.advanceTimersByTimeAsync(20_000)
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('iki görevde de süre dolmadan iptal → sıfır yazma; her biri ayrı iptal edilir', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    await vi.advanceTimersByTimeAsync(1000)
    api.schedule('w2', 'b')
    expect(api.pending.value?.key).toBe('w2') // bildirim en son değişikliği gösterir
    expect(api.cancel()).toBe(true) // "İptal et" gösterileni iptal eder
    expect(api.pending.value?.key).toBe('w1') // önceki hâlâ iptal edilebilir
    expect(api.cancel()).toBe(true)
    expect(api.pending.value).toBeNull()
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS * 2)
    expect(send).not.toHaveBeenCalled()
  })

  it('anahtarla iptal ve bekleyeni anahtarla görme', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    api.schedule('w2', 'b')
    expect(api.peek('w1')?.payload).toBe('a')
    expect(api.cancel('w1')).toBe(true)
    expect(api.peek('w1')).toBeNull()
    expect(api.cancel('w1')).toBe(false)
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS)
    expect(send.mock.calls.map((c) => c[0])).toEqual(['b'])
  })

  it('✕ yalnız gösterilen bildirimi gizler; önceki görevin bildirimi görünür kalır', () => {
    const { api } = setup()
    api.schedule('w1', 'a')
    api.schedule('w2', 'b')
    api.dismiss()
    expect(api.pending.value).toMatchObject({ key: 'w1', visible: true })
  })

  it('kapsam değişimi tüm bekleyenleri iptal eder', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    api.schedule('w2', 'b')
    useScopeStore().setLens('coordinator')
    await nextTick()
    expect(api.pending.value).toBeNull()
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS * 2)
    expect(send).not.toHaveBeenCalled()
  })

  it('kapsam değişimi bekleyen gönderimi iptal eder', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    useScopeStore().setLens('coordinator')
    await nextTick()
    expect(api.pending.value).toBeNull()
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS * 2)
    expect(send).not.toHaveBeenCalled()
  })

  it('oturum değişimi (çıkış) bekleyen gönderimi iptal eder', async () => {
    const { api, send } = setup()
    api.schedule('w1', 'a')
    authSession.clear()
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS * 2)
    expect(api.pending.value).toBeNull()
    expect(send).not.toHaveBeenCalled()
  })

  it('sahip sökülünce bekleyen gönderim iptal; sonra yeni gönderim planlanmaz', async () => {
    const { api, send, wrapper } = setup()
    api.schedule('w1', 'a')
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS * 2)
    expect(send).not.toHaveBeenCalled()
    api.schedule('w1', 'late')
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS * 2)
    expect(send).not.toHaveBeenCalled()
    expect(api.pending.value).toBeNull()
  })

  it('flush bağlam bayatsa göndermez, taze ise hemen gönderir', async () => {
    const a = setup()
    a.api.schedule('w1', 'a')
    await a.api.flush()
    expect(a.send).toHaveBeenCalledTimes(1)
    const b = setup()
    b.api.schedule('w1', 'b')
    useScopeStore().setLens('member')
    await b.api.flush()
    expect(b.send).not.toHaveBeenCalled()
  })
})
