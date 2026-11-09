import { afterEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import { authSession } from '@/shared/http'

import { DEFAULT_TOAST_TIMEOUT, pushAppNotice, useToast } from './use-toast'

afterEach(() => useToast().clear())

describe('useToast', () => {
  it('kuyruk: sırayla gösterir, kapatınca sıradaki gelir', () => {
    const toast = useToast()
    const first = toast.push({ message: 'Kaydedildi' })
    toast.push({ message: 'Bağlantı kopyalandı', tone: 'neutral', timeout: 0 })
    expect(toast.current.value?.message).toBe('Kaydedildi')
    expect(toast.current.value?.timeout).toBe(DEFAULT_TOAST_TIMEOUT)
    toast.dismiss(first!)
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

  it('sahip yaşamı (Ö-07): kapsamda alınan örnek kapsam sökülünce eklemez; kapsamsız örnek hep ekler', () => {
    const scope = effectScope()
    const owned = scope.run(() => useToast())!
    expect(owned.push({ message: 'canlı' })).not.toBeNull()
    scope.stop()
    expect(owned.push({ message: 'geç sonuç' })).toBeNull()
    expect(useToast().queue.value.map((t) => t.message)).toEqual(['canlı'])
    // Kapsam dışında alınan (sahipsiz) örnek her zaman ekler.
    expect(useToast().push({ message: 'uygulama' })).not.toBeNull()
  })

  it('pushAppNotice: sahipsiz; yalnız aynı oturum neslinde gösterilir', () => {
    const generation = authSession.generation
    expect(pushAppNotice({ message: 'kısmi', tone: 'danger' }, generation)).not.toBeNull()
    expect(pushAppNotice({ message: 'eski oturum' }, generation + 1)).toBeNull()
    expect(pushAppNotice({ message: 'nesilsiz' }, null)).not.toBeNull()
    expect(useToast().queue.value.map((t) => t.message)).toEqual(['kısmi', 'nesilsiz'])
  })
})
