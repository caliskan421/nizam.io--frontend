// W160 · O3 senaryo 5: bildirim paneli — zil sayaç → aç (liste; sekmeler; Daha eski) → satır tıkla
// → okundu + gezinme (work_item → 03 `?gorev=`; kapsamda yoksa liste + "Bu görev bu kapsamda
// bulunamadı"; meeting → 09b; program_transfer → 01; membership → gezinme yok) → sayaç + liste
// geçersizleme (KESİN 29) → "Tümünü okundu say" → 404 satır kalkar → kapsam/oturum değişiminde
// kapanır. Gerçek router/AppShell/oturum + durumlu sahte sunucu.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  addFor,
  bell,
  bellBadge,
  boot,
  idle,
  MEMBER,
  meetingNotFound,
  openPanel,
  panel,
  panelRows,
  resetNotifications,
  sent,
  switchScope,
  teardown,
  toasts,
  until,
  useNotificationsBackend,
  userClick,
  WORK,
  ADMIN,
  notifications,
  PEOPLE,
} from './notifications-support'

const backend = useNotificationsBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetNotifications()
  addFor('member', 'work.item.created', WORK('w1'))
  await boot({ ...MEMBER, path: '/gorevler' })
  await until(() => bell(), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetNotifications())
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('zil ve liste', () => {
  it('sayaç rozeti (1–9 sayı, ≥10 "9+"); okunamazsa gizli; aç → grup başlıkları + sekmeler', async () => {
    for (let i = 0; i < 3; i += 1) addFor('member', 'work.item.created', WORK('w1'), {}, 5 + i)
    addFor('member', 'work.item.transitioned', WORK('w1'), { is_read: true }, 60 * 24 * 3)
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '3', 'rozet 3')
    expect(bell()!.getAttribute('aria-label')).toContain('3')
    await openPanel()
    expect(panelRows()).toHaveLength(4)
    expect($$('.nb-grp').map((h) => h.textContent)).toEqual(['Bugün', 'Daha eski'])
    // Sekme: okunmamışlar yalnız `is_read=false`.
    await userClick(
      () => $$('[role="tab"]').find((t) => t.textContent?.includes('Okunmamış')) ?? null,
    )
    expect(panelRows()).toHaveLength(3)
    await idle(app.queryClient)
  })

  it('≥10 okunmamış → "9+"', async () => {
    for (let i = 0; i < 11; i += 1) addFor('member', 'work.item.created', WORK('w1'), {}, i + 1)
    await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '9+', 'rozet 9+')
  })

  it('Daha eski bildirimler: ilk sayfa 30, devamı imleçle; sunucu sırası korunur', async () => {
    for (let i = 0; i < 35; i += 1) addFor('member', 'work.item.created', WORK(`w${i}`), {}, i + 1)
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '9+', 'rozet')
    await openPanel()
    expect(panelRows()).toHaveLength(30)
    expect(sent('GET', '/v1/notifications')[0]!.query.get('limit')).toBe('30')
    await userClick('[data-testid="notification-older"]')
    await until(() => panelRows().length === 35, 'ikinci sayfa')
    expect(sent('GET', '/v1/notifications').at(-1)!.query.get('cursor')).toBe('30')
    expect($('[data-testid="notification-older"]')).toBeNull()
    await idle(app.queryClient)
  })

  it('boş liste: boş durum; sayaç yok', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await idle(app.queryClient)
    await openPanel()
    expect(panelRows()).toHaveLength(0)
    expect(panel()!.textContent).toMatch(/bildirim/i)
    expect(bellBadge()).toBeNull()
    await idle(app.queryClient)
  })
})

const mainButton = (i: number) => panelRows()[i]?.querySelector<HTMLElement>('.nb-it__main') ?? null
const unreadDots = () => $$('.nb-un', panel() ?? document.body)
const reads = () =>
  backend.requests.filter(
    (r) => r.method === 'POST' && /^\/v1\/notifications\/n\d+\/read$/.test(r.path),
  )

describe('satır tıkla → okundu + gezinme', () => {
  it('work_item: okundu POST, sayaç ve liste yeniden okunur (KESİN 29); 03 `?gorev=` açılır; panel kapanır', async () => {
    addFor('member', 'work.item.created', WORK('w3'))
    addFor('member', 'work.item.assignment_changed', WORK('w1'))
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '2', 'rozet 2')
    await idle(app.queryClient)
    await openPanel()
    const counts = sent('GET', '/v1/notifications/unread-count').length
    const lists = sent('GET', '/v1/notifications').length
    await userClick(() => mainButton(0))
    await until(() => app.router.currentRoute.value.query.gorev === 'w1', '03 ?gorev=w1')
    await until(() => !panel(), 'panel kapandı')
    await until(() => bellBadge() === null || bellBadge() === '1', 'rozet düştü')
    await idle(app.queryClient)
    expect(reads()).toHaveLength(1)
    expect(sent('GET', '/v1/notifications/unread-count').length).toBeGreaterThan(counts)
    expect(bellBadge()).toBe('1')
    expect(app.router.currentRoute.value.path).toBe('/gorevler')
    // Panel kapalıyken liste yalnız bayatlar; yeniden açılınca okunur ve okunan satırın noktası yok.
    await openPanel()
    await idle(app.queryClient)
    expect(sent('GET', '/v1/notifications').length).toBeGreaterThan(lists)
    expect(unreadDots()).toHaveLength(1)
    expect(panelRows()[0]!.getAttribute('data-unread')).toBe('false')
  })

  it('work_item kapsamda yoksa: 03 liste açılır, panel açılmaz, TEK ortak bildirim "Bu görev bu kapsamda bulunamadı"', async () => {
    addFor('member', 'work.item.created', WORK('w-yok'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    await userClick(() => mainButton(0))
    await until(() => app.router.currentRoute.value.path === '/gorevler', '03')
    await until(() => toasts().includes('Bu görev bu kapsamda bulunamadı'), 'bildirim')
    await idle(app.queryClient)
    expect($('[data-testid="tasks-page"]')).not.toBeNull()
    expect($('.wd-actions')).toBeNull()
    expect(toasts().match(/bulunamadı/g)).toHaveLength(1)
  })

  it('meeting → 09b (`/toplantilar/:id`); 404 → 09b bulunamadı durumu; satır okundu', async () => {
    meetingNotFound()
    addFor('member', 'collaboration.meeting.created', { kind: 'meeting', id: 'm9' })
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '1', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    await userClick(() => mainButton(0))
    await until(() => app.router.currentRoute.value.path === '/toplantilar/m9', '09b')
    await idle(app.queryClient)
    expect(reads()).toHaveLength(1)
  })

  it('program_transfer → 01 (ana sayfa)', async () => {
    addFor('member', 'program.transfer.completed', { kind: 'program_transfer', id: 'tr1' })
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    await userClick(() => mainButton(0))
    await until(() => app.router.currentRoute.value.path === '/', '01')
    await idle(app.queryClient)
    expect(reads()).toHaveLength(1)
  })

  it('membership: gezinme yok (yalnız okundu); panel açık kalır', async () => {
    addFor('member', 'organization.membership.assigned', { kind: 'membership', id: 'mb1' })
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '1', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    const path = app.router.currentRoute.value.fullPath
    await userClick(() => mainButton(0))
    await until(() => reads().length === 1, 'okundu')
    await until(() => unreadDots().length === 0, 'nokta kalktı')
    expect(app.router.currentRoute.value.fullPath).toBe(path)
    expect(panel()).not.toBeNull()
    await until(() => bellBadge() === null, 'rozet kalktı')
  })

  it('"Okundu say" düğmesi yalnız satırı okur, gezinmez', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    await userClick(() => panelRows()[0]!.querySelector('.nb-hov button'))
    await until(() => bellBadge() === null, 'rozet kalktı')
    expect(app.router.currentRoute.value.path).toBe('/mesajlar')
    expect(reads()).toHaveLength(1)
  })
})

describe('tümünü okundu ve 404', () => {
  it('"Tümünü okundu say": POST read-all; noktalar, sekme sayacı ve zil rozeti düşer; ikinci tık devre dışı', async () => {
    for (let i = 0; i < 4; i += 1) addFor('member', 'work.item.created', WORK('w1'), {}, i + 1)
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '4', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    expect(unreadDots()).toHaveLength(4)
    await userClick('[data-testid="notification-mark-all"]')
    await until(() => unreadDots().length === 0, 'noktalar kalktı')
    await until(() => bellBadge() === null, 'rozet kalktı')
    await idle(app.queryClient)
    expect(sent('POST', '/v1/notifications/read-all')).toHaveLength(1)
    expect(($('[data-testid="notification-mark-all"]') as HTMLButtonElement).disabled).toBe(true)
    expect(toasts()).toContain('4')
  })

  it('404: satır başkasının/silinmiş → sessiz; liste ve sayaç yeniden okunur, satır düşer', async () => {
    addFor('member', 'organization.membership.assigned', { kind: 'membership', id: 'mb1' })
    addFor('member', 'work.item.created', WORK('w1'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '2', 'rozet')
    await idle(app.queryClient)
    await openPanel()
    expect(panelRows()).toHaveLength(2)
    // Sunucuda satır silindi (ör. başka cihazdan); istemcinin listesi bayat.
    const mine = notifications.state.rows.get(PEOPLE.member.account_id)!
    notifications.state.rows.set(
      PEOPLE.member.account_id,
      mine.filter((n) => n.id !== 'n1'),
    )
    await userClick(() => panelRows()[1]!.querySelector('.nb-hov button'))
    await until(() => panelRows().length === 1, 'satır düştü')
    await idle(app.queryClient)
    expect(toasts()).toBe('')
    await until(() => bellBadge() === '1', 'rozet 1')
  })
})

describe('kapanış', () => {
  it('kapsam (program) değişince panel kapanır; Esc kapatır ve odak zile döner', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await idle(app.queryClient)
    await openPanel()
    await switchScope('Program', 'Teknofest 2027')
    await until(() => !panel(), 'panel kapandı')
    await openPanel()
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await until(() => !panel(), 'Esc ile kapandı')
    expect(document.activeElement).toBe(bell())
    await idle(app.queryClient)
  })

  it('oturum kapanınca panel kapanır', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await idle(app.queryClient)
    await openPanel()
    await app.session.logout()
    await until(() => !panel(), 'panel kapandı')
  })
})

describe('panel açıkken onay penceresi', () => {
  it('ConfirmDialog etkileşimi dış tık sayılmaz: panel açık kalır; onay kapanınca yine açık', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await idle(app.queryClient)
    await openPanel()
    const { defineComponent, h } = await import('vue')
    const { mount } = await import('@vue/test-utils')
    const { VueQueryPlugin } = await import('@tanstack/vue-query')
    const { i18n } = await import('@/shared/i18n')
    const { useConfirm } = await import('@/shared/ui/confirm')
    let ask!: () => Promise<unknown>
    const probe = mount(
      defineComponent({
        setup() {
          const { confirmWrite } = useConfirm()
          ask = () =>
            confirmWrite({ title: 'Onay', confirmLabel: 'Tamam', tone: 'primary' }, () =>
              Promise.resolve({ kind: 'success', data: null, status: 204 } as never),
            )
          return () => h('div')
        },
      }),
      {
        global: {
          plugins: [
            app.pinia,
            [VueQueryPlugin, { queryClient: app.queryClient }],
            app.router,
            i18n,
          ],
        },
      },
    )
    const answer = ask()
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay penceresi')
    // Onay penceresine işaretçi basışı (dış tık kuralı): panel kapanmamalı.
    $('[data-testid="confirm-dialog"]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await userClick('[data-testid="confirm-accept"]')
    await answer
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapandı')
    expect(panel()).not.toBeNull()
    probe.unmount()
  })
})
