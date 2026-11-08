import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

import { formatToday, TODAY_REFRESH_MS, useToday } from './today'

// 2026-10-21 22:30 UTC: İstanbul'da (UTC+3) 22 Ekim Perşembe, New York'ta 21 Ekim Çarşamba.
const NOW = new Date('2026-10-21T22:30:00Z')

afterEach(() => {
  vi.useRealTimers()
})

describe('bugünün tarihi (E-00-36)', () => {
  it('kurulum saat dilimindeki gün; biçim "G Ay YYYY, Gün"', () => {
    expect(formatToday(NOW, 'Europe/Istanbul')).toBe('22 Ekim 2026, Perşembe')
    expect(formatToday(NOW, 'America/New_York')).toBe('21 Ekim 2026, Çarşamba')
  })

  it('geçersiz saat dilimi → tarih yok (uydurma yok)', () => {
    expect(formatToday(NOW, 'Yok/Boyle')).toBeNull()
  })

  it('useToday: istemci saat diliminden bağımsız, kurulum profilinden; profil yoksa null', () => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    const instance = useInstanceStore()
    let clock = NOW
    const scope = effectScope()
    const today = scope.run(() => useToday(() => clock))!
    expect(today.value).toBeNull()
    instance.profile = {
      display_name: 'X',
      brand_color: '#000000',
      timezone: 'Europe/Istanbul',
      api_version: 'v1',
      minimum_mobile_version: '0.0.0',
    }
    expect(today.value).toBe('22 Ekim 2026, Perşembe')
    clock = new Date('2026-10-22T21:30:00Z')
    vi.advanceTimersByTime(TODAY_REFRESH_MS)
    expect(today.value).toBe('23 Ekim 2026, Cuma')
    scope.stop()
  })
})
