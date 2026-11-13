import { afterEach, describe, expect, it } from 'vitest'

import { mountWith, resetAll, settle, stat } from '../__tests__/harness'
import CoordinatorshipCard from './CoordinatorshipCard.vue'

afterEach(resetAll)

const STAT = stat('d1', 'Altyapı ve tesisat', {
  coordinators: [
    { account_id: 'l1', full_name: 'Abdullah Ateş' },
    { account_id: 'l2', full_name: 'Ali Avcı' },
  ],
  total_tasks: 14,
  completed_tasks: 9,
  in_progress_tasks: 3,
  not_started_tasks: 1,
  overdue_tasks: 3,
  completion_rate: 64.29,
  member_count: 3,
})

describe('koordinatörlük kartı (E-01-28…38)', () => {
  it('ad, koordinatör adları, görev toplamı, yüzde ve durum satırı (onayda/iade artığı, BE-078)', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, { stat: STAT })
    expect(wrapper.get('a.rp-title').text()).toBe('Altyapı ve tesisat')
    expect(wrapper.get('[data-testid="lead"]').text()).toBe('Abdullah Ateş, Ali Avcı')
    expect(wrapper.get('[data-testid="total"]').text()).toBe('14')
    expect(wrapper.get('[data-testid="pct"]').text()).toBe('%64 bitti')
    // artık = 14 − 1 − 3 − 9 = 1 → "onayda/iade" (etiket "onayda" değil)
    expect(wrapper.get('[data-testid="status-line"]').text()).toBe(
      '1 başlamadı · 3 devam · 1 onayda/iade · 9 bitti',
    )
    expect(wrapper.get('[data-testid="status-line"]').text()).not.toMatch(/\bonayda\b(?!\/)/)
  })

  it('çubuk dört dilim; genişlik tek dinamik bağ olan özel özellikte', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, { stat: STAT })
    const slices = wrapper.findAll('[data-testid="bar"] > span')
    expect(slices.map((s) => s.classes().find((c) => c.startsWith('home-seg--')))).toEqual([
      'home-seg--todo',
      'home-seg--doing',
      'home-seg--review',
      'home-seg--done',
    ])
    const width = (i: number) =>
      Number.parseFloat(
        /--home-seg-w:\s*([\d.]+)%/.exec(slices[i]!.attributes('style') ?? '')?.[1] ?? 'NaN',
      )
    expect(width(0)).toBeCloseTo((1 / 14) * 100, 1)
    expect(width(3)).toBeCloseTo((9 / 14) * 100, 1)
    expect([0, 1, 2, 3].reduce((sum, i) => sum + width(i), 0)).toBeCloseTo(100, 1)
  })

  it('avatar yığını = koordinatörler + "+N üye" (BE-079); ipucu ve erişilebilir ad tam ad', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, { stat: STAT })
    const avatars = wrapper.findAll('.rp-av')
    expect(avatars.map((a) => a.text())).toEqual(['AA', 'AA'])
    expect(avatars[0]!.attributes('data-tip')).toBe('Abdullah Ateş')
    expect(avatars[0]!.attributes('aria-label')).toBe('Abdullah Ateş')
    expect(avatars[0]!.attributes('tabindex')).toBe('0')
    expect(wrapper.get('[data-testid="more"]').text()).toBe('+3 üye')
  })

  it('koordinatörsüz kart: "Koordinatör atanmamış"; üyesiz kartta "+N" yok', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, {
      stat: stat('d2', 'İdari işler', { coordinators: [], member_count: 0 }),
    })
    expect(wrapper.get('[data-testid="lead"]').text()).toBe('Koordinatör atanmamış')
    expect(wrapper.find('.rp-av').exists()).toBe(false)
    expect(wrapper.find('[data-testid="more"]').exists()).toBe(false)
  })

  it('sayılar: geciken (danger), kullanıcı = üye + koordinatör, arşiv statik "—" (BE-072)', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, { stat: STAT })
    expect(wrapper.get('[data-stat="late"]').text()).toContain('3')
    expect(wrapper.get('[data-stat="late"] .rp-num').classes()).toContain('rp-danger-text')
    expect(wrapper.get('[data-stat="users"]').text()).toContain('5')
    expect(wrapper.get('[data-testid="archive"]').text()).toBe('—')
    const calm = await mountWith(CoordinatorshipCard, null, {
      stat: stat('d3', 'Sakin', { overdue_tasks: 0 }),
    })
    expect(calm.wrapper.get('[data-stat="late"] .rp-num').classes()).not.toContain('rp-danger-text')
  })

  it('"Son yükleme" satırı yok (BE-025); `last_activity_at` yükleme sayılmaz', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, {
      stat: stat('d4', 'Sakin', { last_activity_at: '2026-11-10T10:00:00Z' }),
    })
    expect(wrapper.text()).not.toContain('Son yükleme')
    expect(wrapper.text()).not.toContain('bugün')
  })

  it('bağlantılar: ad → 08b, geciken → 03 süzgeci, kullanıcı → 08b üyeler, arşiv → 07 klasörü', async () => {
    const { wrapper, router } = await mountWith(CoordinatorshipCard, null, { stat: STAT })
    expect(wrapper.get('a.rp-title').attributes('href')).toBe('/koordinatorlukler/d1')
    expect(wrapper.get('[data-stat="late"]').attributes('href')).toBe(
      '/gorevler?koordinatorluk=d1&durum=geciken',
    )
    expect(wrapper.get('[data-stat="users"]').attributes('href')).toBe(
      '/koordinatorlukler/d1?sekme=uyeler',
    )
    expect(wrapper.get('[data-stat="archive"]').attributes('href')).toBe('/arsiv/d1')
    await wrapper.get('[data-stat="late"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('work.tasks')
    expect(router.currentRoute.value.query).toEqual({ koordinatorluk: 'd1', durum: 'geciken' })
  })

  it('erişilebilir adlar kart adını taşır', async () => {
    const { wrapper } = await mountWith(CoordinatorshipCard, null, { stat: STAT })
    expect(wrapper.get('[data-stat="late"]').attributes('aria-label')).toBe(
      'Altyapı ve tesisat: geciken görevler',
    )
    expect(wrapper.get('article').attributes('aria-labelledby')).toBe(
      wrapper.get('a.rp-title').attributes('id'),
    )
  })
})
