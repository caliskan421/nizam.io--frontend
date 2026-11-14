// W163 · O4 KUSUR 6: departmansız programda "Programa departman katılmamış" kapısı Mesajlar'ı
// KAPATMAZ (sohbet program kapsamlıdır; otomatik "Genel" grubu departmansız da vardır, P54);
// kapı diğer ekranlarda (ör. /gorevler) kalır.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  backend as chatBackend,
  boot,
  idle,
  resetChats,
  rowEls,
  teardown,
  until,
  useChatBackend,
  watchStreams,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const NO_DEPARTMENT = '[data-open-state="state.no-department"]'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  await boot({ ...ADMIN, path: '/mesajlar' })
  await until(() => rowEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetChats()
  watchStreams()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  chatBackend.db.links = chatBackend.db.links.filter((l) => l.program_id !== 'p1')
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('departmansız program (KUSUR 6)', () => {
  it('/mesajlar açılır: sohbet listesi çizilir, durum ekranı yok', async () => {
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length > 0, 'sohbet listesi')
    await idle(app.queryClient)
    expect($(NO_DEPARTMENT)).toBeNull()
  })

  it('/gorevler kapıda kalır', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler' })
    await until(() => $(NO_DEPARTMENT), 'K7 durumu')
    await idle(app.queryClient)
    expect(rowEls()).toHaveLength(0)
  })
})
