// W160 · O3 senaryo 3 (devam): odak dönüşü (KESİN 27) — her pencere × her kapanış yolu (Esc, ✕,
// eylem sonrası söküm) × 1440 ve 390. Odak gövdeye düşmez: tetikleyiciye ya da (menü öğesi sökülmüşse)
// yazma alanına döner. Gerçek tıklama (işaretçi odaklar), gerçek router/AppShell/oturum.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  boot,
  COORD,
  GROUP,
  idle,
  menuItem,
  messageEls,
  narrowViewport,
  pressEscape,
  resetChats,
  rowOf,
  teardown,
  tool,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  withText,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
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

const composer = () => $('[data-chat-composer-input]')
const closeButton = () => $('[role="dialog"] button[aria-label="Kapat"]')
const attach = () => $('.chat-composer__btn[aria-label="Ekle"]')
const dialogGone = () => until(() => !$('[role="dialog"]') && !$('[data-testid="chat-dialogs"]'), 'pencere kapandı')

type Close = 'esc' | 'x' | 'cancel'

async function closeBy(how: Close): Promise<void> {
  if (how === 'esc') pressEscape()
  else if (how === 'x') await userClick(closeButton)
  else await userClick(() => withText('[role="dialog"] footer button, [role="dialog"] .t-modal__foot button', 'Vazgeç'))
  await dialogGone()
}

/** Odak gövdede değil; `expected` verilmişse tam o öğede. */
function focusKept(expected: () => HTMLElement | null): void {
  const active = document.activeElement
  expect(active).not.toBe(document.body)
  expect(active).toBe(expected())
}

const WIDTHS = [
  ['1440', () => undefined],
  ['390', narrowViewport],
] as const

describe.each(WIDTHS)('odak dönüşü — %s px', (_name, setup) => {
  it.each(['esc', 'x', 'cancel'] as const)('grup bilgisi (başlık düğmesi) — %s → odak düğmede', async (how) => {
    setup()
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    const trigger = $('.chat-thread__who')!
    await userClick(() => trigger)
    await until(() => $('[data-testid="dlg-group-info"]'), 'grup bilgisi')
    if (how === 'cancel') {
      // Grup bilgisinde ayrı "Vazgeç" yok: ✕ ile aynı yol; Esc ve ✕ yeterli.
      await closeBy('x')
    } else await closeBy(how)
    focusKept(() => trigger)
    await idle(app.queryClient)
  })

  it.each(['esc', 'x', 'cancel'] as const)('yeni grup (liste düğmesi) — %s → odak düğmede', async (how) => {
    setup()
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => $('[data-testid="chat-new"]'), 'liste')
    const trigger = $('[data-testid="chat-new"]')!
    await userClick(() => trigger)
    await until(() => $('[data-testid="dlg-new-chat"]'), 'yeni konuşma')
    await closeBy(how)
    await until(() => document.activeElement === trigger, 'odak düğmede')
    focusKept(() => $('[data-testid="chat-new"]'))
    await idle(app.queryClient)
  })

  it.each(['esc', 'x', 'cancel'] as const)('anket (Ekle menüsü) — %s → odak gövdede değil (Ekle ya da yazma alanı)', async (how) => {
    setup()
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(attach)
    await userClick(() => menuItem('Anket'))
    await until(() => $('#chat-poll'), 'anket')
    await closeBy(how)
    await until(() => document.activeElement !== document.body, 'odak gövdede değil')
    expect([attach(), composer()]).toContain(document.activeElement)
    await idle(app.queryClient)
  })

  it.each(['esc', 'x', 'cancel'] as const)('mesajdan görev (mesaj menüsü) — %s → odak gövdede değil', async (how) => {
    setup()
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(() => tool(rowOf(60)!, 'Diğer'))
    await userClick(() => menuItem('Göreve dönüştür'))
    await until(() => $('#chat-task'), 'görev penceresi')
    await closeBy(how)
    await until(() => document.activeElement !== document.body, 'odak gövdede değil')
    expect(document.activeElement).not.toBe(document.body)
    await idle(app.queryClient)
  })

  it('eylem sonrası söküm: anket gönderimi pencereyi kapatır, odak gövdeye düşmez', async () => {
    setup()
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(attach)
    await userClick(() => menuItem('Anket'))
    await until(() => $('#chat-poll'), 'anket')
    const form = $('#chat-poll')!
    for (const [selector, value] of [
      ['[name="question"]', 'Hangi gün?'],
      ['[aria-label="Seçenek 1"]', 'Salı'],
      ['[aria-label="Seçenek 2"]', 'Çarşamba'],
    ] as const) {
      const el = form.querySelector<HTMLInputElement>(selector)!
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await userClick('[data-testid="dlg-submit"]')
    await dialogGone()
    await until(() => document.activeElement !== document.body, 'odak gövdede değil')
    expect(document.activeElement).not.toBe(document.body)
    await idle(app.queryClient)
  })
})
