import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TasksStatusBar from './TasksStatusBar.vue'

const counts = {
  tumu: 7,
  baslanmadi: 1,
  devam_ediyor: 2,
  geciken: 3,
  onaya_sunuldu: 1,
  iade_edildi: 1,
  tamamlandi: 2,
}

function mountBar(props: Record<string, unknown> = {}) {
  return mount(TasksStatusBar, {
    props: {
      tab: 'tumu',
      counts,
      requests: false,
      requestCount: 2,
      showRequests: true,
      complete: true,
      ...props,
    },
  })
}

describe('durum sekmeleri (E-03-07…09)', () => {
  it('Tümü + 5 durum (Geri gönderildi dahil) + Geciken, sayaçlı', () => {
    const tabs = mountBar().get('[aria-label="Kayıtlı görünümler"]').findAll('button')
    expect(tabs.map((t) => t.text())).toEqual([
      'Tümü (7)',
      'Başlamadı (1)',
      'Devam ediyor (2)',
      'Geciken (3)',
      'Onay bekleyen (1)',
      'Geri gönderildi (1)',
      'Tamamlanan (2)',
    ])
    expect(tabs[0]!.attributes('aria-pressed')).toBe('true')
  })

  it('sekme seçimi ve talep aç/kapa yayılır', async () => {
    const bar = mountBar({ requests: true })
    const tabs = bar.get('[aria-label="Kayıtlı görünümler"]').findAll('button')
    await tabs[5]!.trigger('click')
    expect(bar.emitted('update:tab')).toEqual([['iade_edildi']])
    const toggle = bar.get('[aria-label="Tarih talebi filtresi"]').get('button')
    expect(toggle.text()).toBe('Tarih talebi (2)')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    await toggle.trigger('click')
    expect(bar.emitted('update:requests')).toEqual([[false]])
  })

  it('talep süzgeci verisi olmayanda (üye) gizli', () => {
    expect(
      mountBar({ showRequests: false }).find('[aria-label="Tarih talebi filtresi"]').exists(),
    ).toBe(false)
  })

  it('"yüklenen kayıtlar içinde" etiketi yalnız imleç bitmediyse (§10)', () => {
    expect(mountBar().find('[data-testid="tabs-partial"]').exists()).toBe(false)
    expect(mountBar({ complete: false }).get('[data-testid="tabs-partial"]').text()).toBe(
      'yüklenen kayıtlar içinde',
    )
  })
})
