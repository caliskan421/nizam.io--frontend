// W127 · O3 senaryo 8: odak ve ARIA (KESİN 27). Sıralama menüsü, yükleme penceresi ve önizleme
// panelinin her kapanış yolunda (Esc, ✕/vazgeç, seçim) odak tetikleyiciye döner, gövdeye düşmez;
// liste yokken `aria-controls` verilmez.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  ADMIN,
  boot,
  COORD,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv' })
  await until(() => $('.archive-sort__btn'), 'ısınma')
  teardown()
  await boot({ ...COORD, path: '/arsiv/d1?gorev=w1' })
  await until(() => $('[data-file-id="f1"]'), 'ısınma 07')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const escape = (target: Element | null) =>
  target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
const focused = () => document.activeElement

describe('06 sıralama menüsü', () => {
  it('Esc ve seçim: odak tetikleyiciye döner; aria-controls yalnız açıkken', async () => {
    await boot({ ...ADMIN, path: '/arsiv' })
    const trigger = () => $('.archive-sort__btn')
    await until(trigger, 'sırala düğmesi')
    expect(trigger()!.getAttribute('aria-controls')).toBeNull()
    await userClick(trigger)
    await until(() => $('#archive-sort-menu'), 'menü')
    expect(trigger()!.getAttribute('aria-controls')).toBe('archive-sort-menu')
    escape($('#archive-sort-menu'))
    await until(() => !$('#archive-sort-menu'), 'menü kapandı')
    await until(() => focused() === trigger(), 'Esc odak')
    expect(trigger()!.getAttribute('aria-controls')).toBeNull()

    await userClick(trigger)
    await until(() => $('#archive-sort-menu'), 'menü')
    await userClick(() => $('[data-sort="adAzalan"]'))
    await until(() => !$('#archive-sort-menu'), 'menü kapandı')
    await until(() => focused() === trigger(), 'seçim odak')
  })
})

describe('yükleme penceresi', () => {
  it.each(['esc', 'vazgeç'] as const)('%s: odak "Dosya yükle" düğmesine döner', async (how) => {
    await boot({ ...COORD, path: '/arsiv/d1?gorev=w1' })
    const trigger = () => $('[data-testid="folder-upload"]')
    await userClick(trigger)
    await until(() => $('[data-testid="upload-task"]'), 'pencere')
    if (how === 'esc') escape($('[role="dialog"]'))
    else await userClick(() => $('[data-testid="upload-cancel"]'))
    await until(() => !$('[data-testid="upload-task"]'), 'kapandı')
    await until(() => focused() === trigger(), `${how} odak`)
  })

  it('06 sayfasında (yönetici, klasör seçili değil) "Dosya yükle" devre dışıdır; pencere açılmaz', async () => {
    await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-action="upload"]'), 'düğme')
    expect(($('[data-action="upload"]') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('önizleme paneli', () => {
  it.each(['✕', 'Esc'] as const)('%s: odak açan dosya kartına döner', async (how) => {
    await boot({ ...COORD, path: '/arsiv/d1?gorev=w1' })
    const card = () => $('[data-file-id="f1"]')
    await userClick(card)
    await until(() => $('[data-testid="file-preview"]'), 'panel')
    if (how === 'Esc') escape($('[data-testid="file-preview"]'))
    else await userClick(() => $('[data-testid="preview-close"]'))
    await until(() => !$('[data-testid="file-preview"]'), 'panel kapandı')
    await until(() => focused() === card(), `${how} odak karta`)
  })

  it('sonraki dosya düğmesi: odak gövdeye düşmez', async () => {
    await boot({ ...COORD, path: '/arsiv/d1?gorev=w1' })
    await userClick(() => $('[data-file-id="f1"]'))
    await until(() => $('[data-testid="file-preview"]'), 'panel')
    await userClick(() => $('[data-testid="preview-next"]'))
    await until(() => $('[data-testid="preview-name"]')?.textContent?.includes('foto.png'), 'f2')
    expect(focused()).not.toBe(document.body)
    await userClick(() => $('[data-testid="preview-next"]'))
    expect(focused()).not.toBe(document.body)
  })
})
