import { afterEach, describe, expect, it } from 'vitest'

import { until } from '@/shared/http/__tests__/settle'

import { kpiCards } from '../model/kpi'
import { mountWith, resetAll } from '../__tests__/harness'
import KpiCard from './KpiCard.vue'

afterEach(resetAll)

const [completion, open, overdue, pending] = kpiCards({
  total: 79,
  completed: 39,
  open: 40,
  overdue: 15,
  pending: 3,
})

describe('KPI kartı (E-01-03…07)', () => {
  it('etiket, sayı, not ve çubuk; kart 03 Görevler bağlantısı (durum süzgeciyle)', async () => {
    const { wrapper, router } = await mountWith(KpiCard, null, { card: completion })
    const link = wrapper.get('a.t-card.rp-cardbtn')
    expect(link.attributes('href')).toBe('/gorevler?durum=tamamlandi')
    expect(link.text()).toContain('Tamamlanma')
    expect(wrapper.get('[data-kpi-value]').text()).toBe('%49')
    expect(wrapper.get('[data-kpi-note]').text()).toBe('79 görevin 39’u bitti')
    expect(wrapper.get('[data-kpi-bar]').attributes('style')).toContain('--home-kpi-fill: 49%')
    expect(link.classes()).toContain('home-kpi--accent')
    await link.trigger('click')
    // Koşul tabanlı: gezinme tamamlanınca (rota sonrası kancası) hedefte.
    await until(
      () => router.currentRoute.value.fullPath !== '/',
      (notify) => router.afterEach(notify),
    )
    expect(router.currentRoute.value.fullPath).toBe('/gorevler?durum=tamamlandi')
  })

  it('"Açık görev" süzgeçsiz; "Gecikmede" sayısı --danger; "Onay bekleyen" notu çizilmez', async () => {
    const a = await mountWith(KpiCard, null, { card: open })
    expect(a.wrapper.get('a').attributes('href')).toBe('/gorevler')
    const b = await mountWith(KpiCard, null, { card: overdue })
    expect(b.wrapper.get('a').attributes('href')).toBe('/gorevler?durum=geciken')
    expect(b.wrapper.get('[data-kpi-value]').classes()).toContain('home-kpi__value--danger')
    const c = await mountWith(KpiCard, null, { card: pending })
    expect(c.wrapper.get('a').attributes('href')).toBe('/gorevler?durum=onaya_sunuldu')
    expect(c.wrapper.find('[data-kpi-note]').exists()).toBe(false)
  })
})
