import { afterEach, describe, expect, it } from 'vitest'

import { DEFAULT_TOAST_TIMEOUT, useToast } from './use-toast'

afterEach(() => useToast().clear())

describe('useToast', () => {
  it('kuyruk: sırayla gösterir, kapatınca sıradaki gelir', () => {
    const toast = useToast()
    const first = toast.push({ message: 'Kaydedildi' })
    toast.push({ message: 'Bağlantı kopyalandı', tone: 'neutral', timeout: 0 })
    expect(toast.current.value?.message).toBe('Kaydedildi')
    expect(toast.current.value?.timeout).toBe(DEFAULT_TOAST_TIMEOUT)
    toast.dismiss(first)
    expect(toast.current.value?.message).toBe('Bağlantı kopyalandı')
    expect(toast.current.value?.timeout).toBe(0)
  })

  it('art arda aynı metin ve ton tekrar eklenmez; farklı ton eklenir', () => {
    const toast = useToast()
    const a = toast.push({ message: 'Sonuç bilinmiyor', tone: 'danger' })
    expect(toast.push({ message: 'Sonuç bilinmiyor', tone: 'danger' })).toBe(a)
    toast.push({ message: 'Sonuç bilinmiyor' })
    expect(toast.queue.value).toHaveLength(2)
  })

  it('tek örnek: farklı çağrılar aynı kuyruğu görür', () => {
    useToast().push({ message: 'x' })
    expect(useToast().current.value?.message).toBe('x')
    useToast().clear()
    expect(useToast().current.value).toBeNull()
  })
})
