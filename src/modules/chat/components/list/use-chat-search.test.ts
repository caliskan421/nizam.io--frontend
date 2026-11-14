import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { mountSetup, signIn } from '../../__tests__/harness'
import { CHAT_SEARCH_DEBOUNCE_MS, CHAT_SEARCH_MAX, useChatSearch } from './use-chat-search'

beforeEach(() => {
  vi.useFakeTimers()
  signIn()
})
afterEach(() => {
  vi.useRealTimers()
  authSession.clear()
})

async function type(search: ReturnType<typeof useChatSearch>, value: string) {
  search.text.value = value
  await nextTick()
}

describe('useChatSearch (E-10-05)', () => {
  it('terim 300 ms gecikmeli gider; her tuş gecikmeyi sıfırlar', async () => {
    const { result } = mountSetup(useChatSearch)
    await type(result, 'han')
    vi.advanceTimersByTime(CHAT_SEARCH_DEBOUNCE_MS - 1)
    expect(result.term.value).toBe('')
    await type(result, 'hane')
    vi.advanceTimersByTime(CHAT_SEARCH_DEBOUNCE_MS - 1)
    expect(result.term.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(result.term.value).toBe('hane')
  })

  it("Enter (flush) gecikmeyi atlar; boşalınca terim boşalır (q'suz liste)", async () => {
    const { result } = mountSetup(useChatSearch)
    await type(result, '  ayşe ')
    result.flush()
    expect(result.term.value).toBe('ayşe')
    await type(result, '')
    vi.advanceTimersByTime(CHAT_SEARCH_DEBOUNCE_MS)
    expect(result.term.value).toBe('')
  })

  it('terim en çok 100 karakter', async () => {
    const { result } = mountSetup(useChatSearch)
    await type(result, 'a'.repeat(CHAT_SEARCH_MAX + 20))
    result.flush()
    expect(result.term.value).toHaveLength(CHAT_SEARCH_MAX)
  })

  it('terimle aynı yazım (boşluk farkı) yeni gönderim başlatmaz', async () => {
    const { result } = mountSetup(useChatSearch)
    await type(result, 'abc')
    result.flush()
    await type(result, 'abc ')
    const before = vi.getTimerCount()
    expect(before).toBe(0)
  })

  it('sahip sökülünce bekleyen gönderim iptal edilir', async () => {
    const { result, wrapper } = mountSetup(useChatSearch)
    await type(result, 'bekleyen')
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(CHAT_SEARCH_DEBOUNCE_MS * 2)
    expect(result.term.value).toBe('')
  })

  it('program değişince bekleyen gönderim iptal edilir ve kutu temizlenir', async () => {
    const { result } = mountSetup(useChatSearch)
    await type(result, 'eski program')
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    expect(result.text.value).toBe('')
    vi.advanceTimersByTime(CHAT_SEARCH_DEBOUNCE_MS * 2)
    expect(result.term.value).toBe('')
  })

  it('oturum değişince (çıkış) terim ve bekleyen gönderim temizlenir', async () => {
    const { result } = mountSetup(useChatSearch)
    await type(result, 'ayşe')
    result.flush()
    await type(result, 'ayşe yılmaz')
    authSession.clear()
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    expect(result.term.value).toBe('')
    expect(result.text.value).toBe('')
  })
})
