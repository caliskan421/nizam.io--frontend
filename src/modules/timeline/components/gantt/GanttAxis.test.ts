import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import GanttAxis from './GanttAxis.vue'

const RANGE = { start: '2026-11-02', end: '2026-12-06' }
const mountAxis = (scale: 'gun' | 'hafta' | 'ay', today = '2026-11-10', range = RANGE) =>
  mount(GanttAxis, { props: { scale, range, today } })
const texts = (w: ReturnType<typeof mountAxis>, sel: string) => w.findAll(sel).map((n) => n.text())

describe('eksen başlığı (E-03C-23…25, 27)', () => {
  it('hafta ölçeği: tam ay adı, Pazartesi gün numaraları, bugünün haftası vurgulu', () => {
    const axis = mountAxis('hafta')
    expect(texts(axis, '.gantt-axis__month')).toEqual(['Kasım', 'Aralık'])
    expect(texts(axis, '.gantt-axis__tick')).toEqual(['2', '9', '16', '23', '30'])
    const current = axis.findAll('.gantt-axis__tick.is-current')
    expect(current.map((n) => n.text())).toEqual(['9'])
  })

  it('gün ölçeği: haftalık "<gün> <Aaa>" etiketi', () => {
    expect(texts(mountAxis('gun'), '.gantt-axis__tick')).toEqual([
      '2 Kas',
      '9 Kas',
      '16 Kas',
      '23 Kas',
      '30 Kas',
    ])
  })

  it('ay ölçeği: üst satır yıl, alt satır kısa ay; Ocak yeni yılı belirtir', () => {
    const axis = mountAxis('ay', '2026-12-10', { start: '2026-11-30', end: '2027-02-10' })
    expect(texts(axis, '.gantt-axis__month')).toEqual(['2026', '2027'])
    // aralık kenarındaki kırpık parçalar (30 Kas: 2 px, Şub: 20 px) etiketsiz
    expect(texts(axis, '.gantt-axis__tick')).toEqual(['Ara', 'Oca'])
  })

  it('ocak ayı başlığında yıl yazılır (ilk hücre hariç)', () => {
    const axis = mountAxis('hafta', '2026-12-10', { start: '2026-12-14', end: '2027-01-20' })
    expect(texts(axis, '.gantt-axis__month')).toEqual(['Aralık', 'Ocak 2027'])
  })

  it('"bugün" hapı bugünün sütununda; aralık dışındaysa yok', () => {
    const axis = mountAxis('hafta')
    expect(axis.get('.gantt-axis__pill-text').text()).toBe('bugün')
    const pill = axis.get('.gantt-axis__pill')
    // bugün: 8. gün → sütun ortası 8*6+3 = 51; hap 52 geniş
    expect(Number(pill.attributes('x'))).toBe(51 - 26)
    expect(mountAxis('hafta', '2027-05-05').find('[data-gantt="today-pill"]').exists()).toBe(false)
  })

  it('K-4: bugün ay başına yakınken ay etiketi hapın altında kalmaz, sağına kayar', () => {
    // 9 Kas, hafta ölçeği: hap x 25…77, "Kasım" 5 karakter → varsayılan x (10) ile çakışır.
    const axis = mountAxis('hafta')
    const month = axis.findAll('.gantt-axis__month')[0]!
    const pill = axis.get('.gantt-axis__pill')
    const pillRight = Number(pill.attributes('x')) + Number(pill.attributes('width'))
    expect(Number(month.attributes('x'))).toBeGreaterThanOrEqual(pillRight)
    // hap etiketten uzaktaysa etiket yerinde kalır
    const far = mountAxis('hafta', '2026-11-27')
    expect(Number(far.findAll('.gantt-axis__month')[0]!.attributes('x'))).toBe(10)
  })

  it('süs katmanı: erişilebilirlik ağacından gizli, genişlik = gün sayısı × gün genişliği', () => {
    const axis = mountAxis('gun')
    expect(axis.attributes('aria-hidden')).toBe('true')
    expect(axis.attributes('width')).toBe(String(35 * 21))
  })
})
