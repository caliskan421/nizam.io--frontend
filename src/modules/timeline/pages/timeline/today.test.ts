import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { useInstanceStore } from '@/shared/instance/store'

import { dayIn, FALLBACK_TIME_ZONE, TODAY_REFRESH_MS, useTodayIso } from './today'

afterEach(() => vi.useRealTimers())

describe('bugün (E-03C-17): kurulum saat dilimindeki takvim günü', () => {
  it('gün sınırı saat dilimine göre kayar', () => {
    const instant = new Date('2026-10-21T22:30:00Z')
    expect(dayIn(instant, 'Europe/Istanbul')).toBe('2026-10-22')
    expect(dayIn(instant, 'UTC')).toBe('2026-10-21')
    expect(dayIn(instant, 'America/Los_Angeles')).toBe('2026-10-21')
  })

  it('geçersiz dilim adı varsayılana düşer', () => {
    const instant = new Date('2026-10-21T22:30:00Z')
    expect(dayIn(instant, 'Yok/Zaman')).toBe(dayIn(instant, FALLBACK_TIME_ZONE))
  })

  it('profil dilimi kullanılır; gün dönümünde dakikalık tazelenir (sahte saat)', () => {
    vi.useFakeTimers({ now: new Date('2026-10-21T20:59:30Z') })
    const pinia = createPinia()
    setActivePinia(pinia)
    useInstanceStore().profile = {
      api_version: '1',
      brand_color: '#000',
      display_name: 'x',
      minimum_mobile_version: '0.0.0',
      timezone: 'Europe/Istanbul',
    }
    let today!: ReturnType<typeof useTodayIso>
    const app = createApp(
      defineComponent({
        setup() {
          today = useTodayIso()
          return () => null
        },
      }),
    )
    app.use(pinia)
    app.mount(document.createElement('div'))
    expect(today.value).toBe('2026-10-21')
    vi.advanceTimersByTime(TODAY_REFRESH_MS)
    expect(today.value).toBe('2026-10-22')
    app.unmount()
  })
})
