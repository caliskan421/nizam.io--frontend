import { afterEach, describe, expect, it } from 'vitest'

import { kpiCards } from '../model/kpi'
import { mountWith, resetAll } from '../__tests__/harness'
import KpiStrip from './KpiStrip.vue'

afterEach(resetAll)

const cards = kpiCards({ total: 3, completed: 1, open: 2, overdue: 1, pending: 0 })
const error = { messageKey: 'errors.organization.authority_unavailable', requestId: 'req-9' }

describe('KPI şeridi bölgesi', () => {
  it('dört kart, "Görev özeti" bölgesi; tam kümede etiket yok', async () => {
    const { wrapper } = await mountWith(KpiStrip, null, { cards })
    const region = wrapper.get('section[aria-label="Görev özeti"]')
    expect(region.findAll('a.home-kpi')).toHaveLength(4)
    expect(region.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.find('[data-kpi-partial]').exists()).toBe(false)
  })

  it('imleç bitmemiş → "yüklenen kayıtlar içinde"', async () => {
    const { wrapper } = await mountWith(KpiStrip, null, { cards, partial: true })
    expect(wrapper.get('[data-kpi-partial]').text()).toBe('Sayılar yüklenen kayıtlar içinde')
  })

  it('yükleniyor → dört iskelet, sayı yok', async () => {
    const { wrapper } = await mountWith(KpiStrip, null, { cards: null, loading: true })
    expect(wrapper.findAll('[data-kpi-skeleton]')).toHaveLength(4)
    expect(wrapper.get('section').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('[data-kpi-value]').exists()).toBe(false)
  })

  it('hata → bölge içi hata + "Yeniden dene" (retry olayı); kart yok', async () => {
    const { wrapper } = await mountWith(KpiStrip, null, { cards: null, error })
    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Görev özeti yüklenemedi')
    expect(alert.text()).toContain('req-9')
    await alert.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('kapsam eksik → seçim notu', async () => {
    const { wrapper } = await mountWith(KpiStrip, null, { cards: null, select: true })
    expect(wrapper.text()).toContain('Kapsam seçin')
    expect(wrapper.find('[data-kpi-skeleton]').exists()).toBe(false)
  })
})
