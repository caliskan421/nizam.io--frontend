import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { requests, resetHarness, server } from '../../__tests__/harness'
import { daysAgo, NOW, stat, view } from './__tests__/fixtures'
import {
  ADMIN,
  mountWith,
  settle,
  standingHandlers,
  type StandingFixture,
  unmountAll,
} from './__tests__/mount'
import CoordinatorshipCard from './CoordinatorshipCard.vue'
import CoordinatorshipGrid from './CoordinatorshipGrid.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

async function card(item = view('d1', 'Mekanik sistemler', 'MEK'), fixture = ADMIN) {
  server.use(...standingHandlers(fixture))
  return mountWith(CoordinatorshipCard, { props: { item } })
}

describe('kart içeriği (E-08-27…37)', () => {
  it('kod rozeti, ad bağlantısı, açıklama, sayılar; seçim kutusu yok', async () => {
    const item = view('d1', 'Mekanik sistemler', 'MEK', stat('d1', { description: 'Saha işleri' }))
    const { wrapper } = await card(item)
    expect(wrapper.get('[data-testid="code"]').text()).toBe('MEK')
    expect(wrapper.get('a.rp-title').attributes('href')).toBe('/koordinatorlukler/d1')
    expect(wrapper.get('[data-testid="description"]').text()).toBe('Saha işleri')
    expect(wrapper.get('[data-testid="members"]').text()).toBe('4')
    expect(wrapper.get('[data-testid="tasks"]').text()).toBe('6')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('kodsuz birimde baş harfler; açıklamasız birimde alt satır yok (E-08-28, E-08-30)', async () => {
    const { wrapper } = await card(view('d2', 'idari işler', null))
    expect(wrapper.get('[data-testid="code"]').text()).toBe('İİ')
    expect(wrapper.find('[data-testid="description"]').exists()).toBe(false)
  })

  it('üye/görev sayıları 08b sekmelerine gider; arşiv hücresi devre dışı (E-08-34…36)', async () => {
    const { wrapper } = await card()
    const links = wrapper.findAll('.rp-ccard__stats a').map((a) => a.attributes('href'))
    expect(links).toEqual([
      '/koordinatorlukler/d1?sekme=uyeler',
      '/koordinatorlukler/d1?sekme=gorevler',
    ])
    const archive = wrapper.get('[data-testid="archive"]')
    expect(archive.attributes('aria-disabled')).toBe('true')
    expect(archive.attributes('title')).toMatch(/F5/)
    expect(archive.text()).toContain('—')
  })

  it('çoklu koordinatör: en çok 3 avatar, ipucu tam ad, "‹ilk› +n" (E-08-32)', async () => {
    const people = ['Ayşe Demir', 'Burak Can', 'Cem Er', 'Duru Ak'].map((full_name, i) => ({
      account_id: `a${i}`,
      full_name,
    }))
    const { wrapper } = await card(view('d1', 'B', 'B1', stat('d1', { coordinators: people })))
    const avatars = wrapper.findAll('.rp-avstack .rp-av')
    expect(avatars).toHaveLength(3)
    expect(avatars[0]!.attributes('data-tip')).toBe('Ayşe Demir')
    expect(avatars[0]!.attributes('aria-label')).toBe('Ayşe Demir')
    expect(avatars[0]!.attributes('tabindex')).toBe('0')
    expect(wrapper.get('[data-testid="lead-line"]').text()).toBe('Ayşe Demir +3')
  })

  it('rapor satırı yoksa sayılar "—", nötr bayrak, atama düğmesi yok', async () => {
    const { wrapper } = await card(view('d1', 'B', 'B1', null))
    expect(wrapper.get('[data-testid="members"]').text()).toBe('—')
    expect(wrapper.get('[data-testid="tasks"]').text()).toBe('—')
    expect(wrapper.get('[data-testid="flag"]').attributes('data-flag')).toBe('unknown')
    expect(wrapper.find('.coords-assign').exists()).toBe(false)
  })
})

describe('durum bayrağı (E-08-37)', () => {
  it.each([
    [stat('d1', { coordinators: [], last_activity_at: null }), 'no-lead', 'Koordinatör atanmamış'],
    [
      stat('d1', { last_activity_at: daysAgo(31) }),
      'quiet',
      'Sessiz · son görev hareketi 31 gün önce',
    ],
    [stat('d1', { last_activity_at: daysAgo(2) }), 'active', 'Son görev hareketi 2 gün önce'],
  ])('%#: öncelik koordinatörsüz > sessiz > normal', async (s, kind, text) => {
    const { wrapper } = await card(view('d1', 'B', 'B1', s))
    const flag = wrapper.get('[data-testid="flag"]')
    expect(flag.attributes('data-flag')).toBe(kind)
    expect(flag.text()).toBe(text)
    expect(flag.text()).not.toMatch(/dosya/i)
  })
})

describe('"Koordinatör ata" (E-08-33)', () => {
  const noLead = view('d9', 'Fuar', null, stat('d9', { coordinators: [] }))

  it('yalnız koordinatörsüz kartta; tık → assignCoordinator(id), istek yok', async () => {
    const { wrapper } = await card(noLead)
    const before = requests.length
    await wrapper.get('.coords-assign').trigger('click')
    expect(wrapper.emitted('assignCoordinator')).toEqual([['d9']])
    expect(requests.length).toBe(before)
  })

  it('koordinatörlü kartta yok', async () => {
    const { wrapper } = await card()
    expect(wrapper.find('.coords-assign').exists()).toBe(false)
  })

  it('yönetici olmayanda gizli (K1; olgu company_admin)', async () => {
    const coordinator: StandingFixture = {
      companyAdmin: false,
      rows: [{ department_id: 'd9', role: 'koordinator' }],
    }
    const { wrapper } = await card(noLead, coordinator)
    expect(wrapper.find('.coords-assign').exists()).toBe(false)
  })
})

describe('ızgara', () => {
  it('düz ızgara: grup başlığı yok, olaylar yukarı taşınır', async () => {
    server.use(...standingHandlers(ADMIN))
    const items = [view('d1', 'A', 'AA'), view('d2', 'B', null, stat('d2', { coordinators: [] }))]
    const { wrapper } = await mountWith(CoordinatorshipGrid, { props: { items } })
    expect(wrapper.findAll('article.rp-ccard')).toHaveLength(2)
    expect(wrapper.find('[aria-expanded][class*="group"]').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Tümünü seç|Buraya ekle/)
    await wrapper.get('.coords-assign').trigger('click')
    expect(wrapper.emitted('assignCoordinator')).toEqual([['d2']])
    await settle()
  })
})
