// W185 bildirim v0.25 entegrasyon testlerinin ortak kurulumu (kanca kurucusu + yardımcılar).
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import {
  $$,
  addFor,
  bell,
  boot,
  MEMBER,
  panelRows,
  resetNotifications,
  seedNotificationChats,
  teardown,
  until,
  useNotificationsBackend,
  WORK,
} from './notifications-support'

/** Sahte sunucuyu açar, ısınma yapar, her testten önce dünyayı sıfırlar; ilk testten dönen `backend`. */
export function installV025Hooks(roles: Parameters<typeof useNotificationsBackend>[0]) {
  const backend = useNotificationsBackend(roles)
  beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
  beforeAll(async () => {
    resetNotifications()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    addFor('member', 'work.item.created', WORK('w1'))
    await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bell(), 'ısınma')
    teardown()
  }, 60_000)
  beforeEach(() => {
    resetNotifications()
    seedNotificationChats()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  })
  afterEach(() => {
    vi.useRealTimers()
    teardown()
  })
  afterAll(() => backend.server.close())
  return backend
}

export const main = (i: number) =>
  panelRows()[i]?.querySelector<HTMLElement>('.nb-it__main') ?? null
export const tab = (name: string) => () =>
  $$('[role="tab"]').find((t) => t.textContent?.includes(name)) ?? null
export const rowText = (i: number) => panelRows()[i]?.textContent ?? ''
export const inRow = (i: number, testid: string) => () =>
  panelRows()[i]?.querySelector<HTMLElement>(`[data-testid="${testid}"]`) ?? null
export const chatMsg = (seq: number) => ({
  message_id: `msg-${seq}`,
  seq,
  chat_kind: 'group' as const,
})
