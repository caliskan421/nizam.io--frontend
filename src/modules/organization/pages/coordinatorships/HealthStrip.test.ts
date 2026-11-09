import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HealthStrip from './HealthStrip.vue'

const SUMMARY = { noLead: 2, noMembers: 1, noTasks: 2, noTaskNames: ['Fuar', 'Çevre'], quiet: 3 }

function strip(props: Record<string, unknown> = {}) {
  return mount(HealthStrip, {
    props: { summary: SUMMARY, loading: false, error: null, retrying: false, ...props },
  })
}

describe('yapı sağlığı şeridi (E-08-07…11)', () => {
  it('4 kutu: sayı + etiket; adlar ve uyarlanmış notlar', () => {
    const w = strip()
    expect(w.get('section').attributes('aria-label')).toBe('Yapı sağlığı')
    const boxes = w.findAll('.rp-health')
    expect(boxes.map((b) => b.attributes('data-health'))).toEqual([
      'no-lead',
      'no-members',
      'no-tasks',
      'quiet',
    ])
    expect(boxes.map((b) => b.get('[data-testid="health-n"]').text())).toEqual(['2', '1', '2', '3'])
    expect(boxes[2]!.get('[data-testid="health-note"]').text()).toBe('Fuar, Çevre')
    expect(boxes[3]!.get('[data-testid="health-note"]').text()).not.toMatch(/dosya/i)
    expect(boxes[3]!.classes()).toContain('coords-health--danger')
  })

  it('koordinatörsüz kutunun not satırı render edilmez (E-08-08)', () => {
    const w = strip()
    expect(w.get('[data-health="no-lead"]').find('[data-testid="health-note"]').exists()).toBe(
      false,
    )
  })

  it('kutular gezinmez (bağlantı/düğme yok)', () => {
    const w = strip()
    expect(w.findAll('.coords-health a, .coords-health button')).toHaveLength(0)
  })

  it('yükleniyor → iskelet; hata → bölge içi "Yeniden dene"', async () => {
    expect(strip({ summary: null, loading: true }).findAll('.coords-skel')).toHaveLength(4)
    const w = strip({
      summary: null,
      error: { messageKey: 'errors.platform.internal', requestId: 'r1' },
    })
    expect(w.find('section').exists()).toBe(false)
    const retry = w.findAll('button').find((b) => /Yeniden dene/.test(b.text()))!
    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })
})
