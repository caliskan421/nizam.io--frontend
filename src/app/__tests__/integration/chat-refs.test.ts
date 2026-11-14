// W160 · O3 (W156 notu): görev çipi — özet `getChatRefSummary` (çip metni, P60 kilit yok); TIK'ta
// `getWorkItem` yoklaması (görevin kendi birimiyle): başarıda 03 `?gorev=`, 403/404'te çipin yanında
// "Bu göreve erişiminiz yok" ve gezinme YOK; silinmiş görev "artık yok" çipi (istek yok).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  boot,
  chatOf,
  COORD,
  GROUP,
  idle,
  MEMBER,
  messageEls,
  PEOPLE,
  resetChats,
  sent,
  teardown,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  WHO,
} from './chat-support'
import { addMessage } from './fake-chat'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
  await until(() => messageEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetChats()
  watchStreams()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const chip = (title: string) =>
  $$('.chat-tref').find((el) => el.textContent?.includes(title)) ?? null

/** Üç görev kartı: w1 (Ayşe'ye atanmış), w4 (Cem'e atanmış → Ayşe için 403), w-silinmis (yok). */
function shareTasks(): void {
  const title = (id: string) => backend.db.items.find((i) => i.work_item_id === id)!.title
  const refs = [
    { kind: 'task' as const, target_id: 'w1', ref_id: 'r-w1' },
    { kind: 'task' as const, target_id: 'w4', ref_id: 'r-w4' },
    { kind: 'task' as const, target_id: 'w-silinmis', ref_id: 'r-gone' },
  ]
  addMessage(chatOf(GROUP), WHO.coord, `Bakın #${title('w1')} ve #${title('w4')}`, { refs })
}

describe('görev çipi (W156 notu)', () => {
  it('özet çip metnini verir; tık → getWorkItem (görevin kendi birimi) → 03 ?gorev=', async () => {
    shareTasks()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!.title
    await until(() => chip(w1), 'çip')
    expect(sent('GET', '/v1/work-items/w1')).toHaveLength(0)
    await userClick(() => chip(w1))
    await until(() => app.router.currentRoute.value.path === '/gorevler', '03')
    expect(app.router.currentRoute.value.query.gorev).toBe('w1')
    const calls = sent('GET', '/v1/work-items/w1')
    expect(calls).toHaveLength(1)
    expect(calls[0]!.headers.get('X-Nizamio-Department')).toBe('d1')
    await idle(app.queryClient)
  })

  it('403 (başkasına atanmış görev): "Bu göreve erişiminiz yok" çipin yanında; gezinme yok', async () => {
    shareTasks()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    const w4 = backend.db.items.find((i) => i.work_item_id === 'w4')!.title
    await until(() => chip(w4), 'çip')
    await userClick(() => chip(w4))
    await until(() => $('.chat-bub__note'), 'erişim notu')
    expect($('.chat-bub__note')!.textContent).toContain('Bu göreve erişiminiz yok')
    expect($('.chat-bub__note')!.getAttribute('role')).toBe('status')
    expect(app.router.currentRoute.value.path).toBe(`/mesajlar/${GROUP}`)
    expect(sent('GET', '/v1/work-items/w4')).toHaveLength(1)
    await idle(app.queryClient)
  })

  it('silinmiş/erişilemeyen görev: özet available:false → "artık yok" çipi; tıklanamaz, istek yok', async () => {
    const refs = [{ kind: 'task' as const, target_id: 'w-silinmis', ref_id: 'r-gone' }]
    addMessage(chatOf(GROUP), WHO.coord, 'Eski görev', { refs })
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => $('.chat-tref--gone'), 'artık yok çipi')
    expect($('.chat-tref--gone')!.tagName).toBe('SPAN')
    expect(sent('GET', '/v1/work-items/w-silinmis')).toHaveLength(0)
    await idle(app.queryClient)
    expect(PEOPLE.member.account_id).toBeTruthy()
  })

  it('koordinatör (K) aynı çipi açabilir: kendi birimi d1 görevi', async () => {
    shareTasks()
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!.title
    await until(() => chip(w1), 'çip')
    await userClick(() => chip(w1))
    await until(() => app.router.currentRoute.value.path === '/gorevler', '03')
    await idle(app.queryClient)
  })
})
