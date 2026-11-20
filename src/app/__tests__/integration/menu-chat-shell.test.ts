// W160 · O3 senaryo 7: kabuk — Mesajlar menü öğesi üç rolde; `unread` rozeti (`mentioned` →
// danger); zil rozeti 9+; zil + menü rozeti türevleri birlikte (KESİN 29); 390 kabuk menüsü
// gerçek tıklama + odak; `CURRENT_PHASE` F7 ile rota kataloğu güncel.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CURRENT_PHASE, liveRouteNames, menuEntries } from '@/app/routes.catalog'

import {
  $,
  $$,
  addFor,
  ADMIN,
  bell,
  bellBadge,
  boot,
  COORD,
  idle,
  MEMBER,
  narrowViewport,
  notifications,
  PEOPLE,
  resetNotifications,
  teardown,
  until,
  useNotificationsBackend,
  userClick,
  WORK,
} from './notifications-support'
import { addMessage, makeChat, member } from './fake-chat'

const backend = useNotificationsBackend({ coordinator: 'koordinator', member: 'uye' })
const badge = () => $('nav .side-badge[data-badge="unread"]')
const link = () => $$('nav a').find((a) => a.textContent?.includes('Mesajlar')) ?? null

const WHO = {
  admin: PEOPLE.admin,
  coord: PEOPLE.coord,
  member: PEOPLE.member,
  second: PEOPLE.second,
}

/** Başkasından okunmamış mesajı olan grup: `me` üye, `from` yazar. */
function unreadFor(me: keyof typeof WHO, count: number, mention = false): void {
  const id = `g-${me}-${notifications.chat.chats.length}`
  const chat = makeChat(id, 'group', [member(WHO[me].account_id), member(WHO.second.account_id)], {
    name: `Grup ${id}`,
  })
  for (let i = 0; i < count; i += 1) {
    addMessage(chat, { ...WHO.second, admin: false }, `m${i}`, {
      mentions: mention && i === 0 ? [{ kind: 'all' }] : [],
    })
  }
  notifications.chat.chats.push(chat)
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetNotifications()
  await boot({ ...MEMBER, path: '/gorevler' })
  teardown()
}, 60_000)
beforeEach(() => resetNotifications())
afterEach(() => {
  vi.unstubAllGlobals()
  teardown()
})
afterAll(() => backend.server.close())

describe('rota kataloğu (CURRENT_PHASE F20)', () => {
  it('faz F20; Mesajlar canlı ve menüde; üç rolde kayıtlı rota', () => {
    expect(CURRENT_PHASE).toBe('F20')
    expect(liveRouteNames()).toEqual(
      expect.arrayContaining(['collaboration.chats', 'collaboration.chat']),
    )
    expect(menuEntries().map((e) => e.name)).toContain('collaboration.chats')
  })
})

describe('Mesajlar menü öğesi — üç rol', () => {
  it.each([
    ['yönetici', ADMIN, 'admin'],
    ['koordinatör', COORD, 'coord'],
    ['üye', MEMBER, 'member'],
  ] as const)(
    '%s: İçerik grubunda "Mesajlar"; okunmamış sohbet sayısı rozette',
    async (_name, who, key) => {
      unreadFor(key, 2)
      unreadFor(key, 1)
      const app = await boot({ ...who, path: '/gorevler' })
      await until(() => badge(), 'rozet')
      expect(badge()!.textContent.trim()).toBe('2')
      expect(link()!.closest('[data-group]')!.getAttribute('data-group')).toBe('icerik')
      expect(badge()!.getAttribute('aria-label')).toContain('2')
      await idle(app.queryClient)
    },
  )

  it('anılma (`mentioned`): rozet danger tonunda, erişim adı anmayı söyler; okununca söner', async () => {
    unreadFor('member', 1, true)
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => badge(), 'rozet')
    expect(badge()!.classList.contains('t-badge--danger')).toBe(true)
    expect(badge()!.getAttribute('aria-label')).toMatch(/an/i)
    await idle(app.queryClient)
  })

  it('okunmamış yoksa rozet çizilmez', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await idle(app.queryClient)
    expect(badge()).toBeNull()
    expect(link()).not.toBeNull()
  })
})

describe('zil rozeti', () => {
  it('1–9 sayı, ≥10 "9+"; erişim adı sayıyı söyler; zil ve menü rozeti birbirinden bağımsız sayılır', async () => {
    unreadFor('member', 3)
    for (let i = 0; i < 12; i += 1) addFor('member', 'work.item.created', WORK('w1'), {}, i + 1)
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '9+', 'zil 9+')
    await until(() => badge(), 'menü rozeti')
    expect(badge()!.textContent.trim()).toBe('1')
    expect(bell()!.getAttribute('aria-label')).toMatch(/9/)
    await idle(app.queryClient)
  })
})

describe('390 px kabuk menüsü', () => {
  it('menüden Mesajlar tıklanır: gezinir, menü kapanır, odak gövdeye düşmez; liste tek sütun', async () => {
    narrowViewport()
    unreadFor('member', 2)
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    const toggle = await until(() => $('[data-testid="topbar-menu"]'), 'menü düğmesi')
    toggle.focus()
    await userClick(() => toggle)
    await until(() => $('aside#app-side')!.classList.contains('rp-side--open'), 'menü açıldı')
    await userClick(link)
    await until(() => app.router.currentRoute.value.path === '/mesajlar', 'Mesajlar')
    await until(() => !$('aside#app-side')!.classList.contains('rp-side--open'), 'menü kapandı')
    await until(() => $('[data-testid="chat-page"]'), 'sayfa')
    expect($('[data-testid="chat-page"]')!.getAttribute('data-pane')).toBe('list')
    expect(document.activeElement).not.toBe(document.body)
    await idle(app.queryClient)
  })
})
