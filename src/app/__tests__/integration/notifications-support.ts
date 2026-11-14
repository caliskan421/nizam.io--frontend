// W160 · O3: bildirim entegrasyon testlerinin ortak kurulumu (W82a harness'i + durumlu sahte
// bildirim sunucusu; sohbet sunucusu da bağlanır: kabuk Mesajlar rozeti ve zil birlikte sınanır).
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'

import { createBackend, seedWorld, until, $, $$, click } from './harness'
import { createChatState, type ChatState } from './fake-chat'
import { chatHandlers } from './fake-chat-server'
import {
  createNotificationsState,
  notificationHandlers,
  notify,
  type NotificationsState,
} from './fake-notifications'
import { PEOPLE } from './world'

export {
  $,
  $$,
  boot,
  byText,
  click,
  fill,
  idle,
  switchScope,
  teardown,
  toasts,
  until,
  PEOPLE,
} from './harness'
export { ORIGIN } from './fake-org'
export { notify, VAPID_KEY } from './fake-notifications'

export const ADMIN = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'admin' as const },
}
export const COORD = {
  email: PEOPLE.coord.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
}
export const MEMBER = {
  email: PEOPLE.member.email,
  scope: { programId: 'p1', lens: 'member' as const, departmentId: 'd1' },
}

export type Roles = Parameters<typeof createBackend>[0]
export const notifications: { state: NotificationsState; chat: ChatState } = {
  state: createNotificationsState(),
  chat: createChatState(),
}
export let backend!: ReturnType<typeof createBackend>

export function useNotificationsBackend(roles: Roles) {
  backend = createBackend(roles)
  return backend
}

/** Dünya: ortak veri + boş bildirim/sohbet sunucuları (testler satır ekler). */
export function seedNotificationsWorld(): void {
  seedWorld(backend.db)
  notifications.state = createNotificationsState()
  notifications.chat = createChatState()
  backend.server.use(
    ...notificationHandlers(backend.db, notifications.state),
    ...chatHandlers(backend.db, notifications.chat),
  )
}

/** Her testten önce: sunucu sıfırlanır, dünya yeniden kurulur. */
export function resetNotifications(): void {
  backend.reset()
  seedNotificationsWorld()
}

export const sent = (method: string, path: string) => backend.sent(method, path)

/** Hesaba bildirim ekler (kısayol: `to('member', …)`). */
export function addFor(
  who: keyof typeof PEOPLE,
  type: string,
  subject: { kind: string; id: string },
  patch: Parameters<typeof notify>[4] = {},
  ageMin = 5,
) {
  return notify(notifications.state, PEOPLE[who].account_id, type, subject, patch, ageMin)
}

export const WORK = (id: string) => ({ kind: 'work_item', id })

/** Gerçek tıklama: işaretçi önce odaklar (`HTMLElement.click()` odaklamaz; KESİN 27). */
export async function userClick(target: string | (() => HTMLElement | null)): Promise<HTMLElement> {
  const probe = typeof target === 'string' ? () => $(target) : target
  const el = await until(probe, `tıklanacak öğe ${String(target)}`)
  el.focus()
  return click(() => el)
}

// --- Zil ve panel -----------------------------------------------------------------------------

export const bell = () => $('[data-testid="topbar-bell"]')
export const bellBadge = () => $('.topbar-bell__badge')?.textContent?.trim() ?? null
export const panel = () => $('[data-testid="notification-panel"]')
export const panelRows = () => $$('[data-testid="notification-row"]', panel() ?? document.body)

/** Zili açar ve liste yüklenene dek bekler. */
export async function openPanel(): Promise<HTMLElement> {
  await userClick(bell)
  await until(panel, 'panel')
  await until(() => !$('[data-testid="notification-loading"]'), 'liste yüklendi')
  return panel()!
}

/** Hedefi olmayan 09b için asgari toplantı yanıtı (404: bulunamadı durumu). */
export function meetingNotFound(): void {
  backend.server.use(
    http.get('http://localhost/v1/meetings/:id', () =>
      HttpResponse.json(
        { code: 'collaboration.meeting_not_found', message: 'x', request_id: 'r', fields: [] },
        { status: 404 },
      ),
    ),
  )
}

/** 390 px: yalnız `max-width` sorguları eşleşir. */
export function narrowViewport(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
  }))
}
