import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { createTestRouter } from './__tests__/tracking-harness'
import {
  parseTrackingQuery,
  trackingQuery,
  TRACKING_DEFAULTS,
  useTrackingUrl,
} from './use-tracking-url'

describe('05b URL durumu', () => {
  it('geçersiz değer varsayılana düşer; varsayılanlar yazılmaz', () => {
    expect(
      parseTrackingQuery({ sekme: 'x', kart: 'geciken', grupla: 'durum', ay: '2026-13' }),
    ).toEqual({
      ...TRACKING_DEFAULTS,
      card: 'geciken',
      grouping: 'durum',
    })
    expect(trackingQuery(TRACKING_DEFAULTS)).toEqual({})
    expect(
      trackingQuery({ tab: 'hesap', card: 'onayda', grouping: 'durum', month: '2026-10' }),
    ).toEqual({ sekme: 'hesap', kart: 'onayda', grupla: 'durum', ay: '2026-10' })
  })

  it('güncelleme replace ile yapılır (geçmişe kayıt eklemez) ve diğer süzgeçleri korur', async () => {
    const router = createTestRouter()
    await router.push('/kullanicilar/u1?kart=geciken')
    let api!: ReturnType<typeof useTrackingUrl>
    mount(
      defineComponent({
        setup() {
          api = useTrackingUrl('u1')
          return () => null
        },
      }),
      { global: { plugins: [router] } },
    )
    const before = window.history.length
    await api.update({ month: '2026-12' })
    expect(router.currentRoute.value.fullPath).toBe('/kullanicilar/u1?kart=geciken&ay=2026-12')
    expect(api.state.value.card).toBe('geciken')
    expect(window.history.length).toBe(before)
  })
})
