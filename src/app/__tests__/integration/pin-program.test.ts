// WP3 · İş 2 (f): program kısa ad ve rengi (BE-001, PROGRAM-K46) 07'de değişince kenar menüsü
// avatarı (kapsam kartı + program menüsü) ve diğer program ayrışması birlikte güncellenir; temizleme
// (üç hâlli güncelleme: `null`) türetilen gösterime döner. Üretim kök + router + kabuk + sahte backend.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  click,
  createBackend,
  fill,
  idle,
  seedWorld,
  switchScope,
  teardown,
  until,
} from './harness'
import { ADMIN_ADMIN } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/programlar' })
  await until(() => $('[data-testid="pg-list"] [data-testid="pg-edit"]'), 'ısınma')
  await click('[data-program="p1"] [data-testid="pg-edit"]')
  await until(() => $('[data-testid="pg-short-name"]'), 'ısınma formu')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const scopeAvatar = () => $('aside .side-card[aria-label^="Program:"] .side-pav')
const avatarText = () => scopeAvatar()?.textContent?.trim() ?? null
const toneOf = () =>
  [...(scopeAvatar()?.classList ?? [])].find((c) => c.startsWith('side-pav--'))?.slice(10) ?? null

async function editProgram(shortName: string, color: string): Promise<void> {
  await click('[data-program="p1"] [data-testid="pg-edit"]')
  await until(
    () => ($('[data-testid="pg-short-name"]') as HTMLInputElement | null) !== null,
    'form yüklendi',
  )
  await fill('[data-testid="pg-short-name"] input, input[data-testid="pg-short-name"]', shortName)
  await fill('select[data-testid="pg-color"], [data-testid="pg-color"] select', color)
  await click('[data-testid="pg-form-submit"]')
  await until(() => !$('[role="dialog"]'), 'form kapanır')
}

describe('(f) program kısa ad / renk → kenar menüsü avatarı (BE-001)', () => {
  it('türetilmiş gösterim → kısa ad “TF” + altın renk → temizle: türetilene dönüş', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/programlar' })
    await until(() => avatarText() !== null, 'kapsam avatarı')
    const derived = { text: avatarText(), tone: toneOf() }
    expect(derived.text).toBeTruthy()

    await editProgram('TF', 'gold')
    await until(() => avatarText() === 'TF', 'kısa ad avatarda')
    await until(() => toneOf() === 'gold', 'renk avatarda')
    const [patch] = backend.sent('PATCH', '/v1/programs/p1')
    expect(patch!.body).toMatchObject({ short_name: 'TF', color: 'gold' })
    await idle(app.queryClient)
    expect(backend.db.programs.find((p) => p.program_id === 'p1')).toMatchObject({
      short_name: 'TF',
      color: 'gold',
    })

    // Program menüsü de aynı değeri gösterir (kapsam kartından açılan liste).
    await click('aside button.side-card[aria-label^="Program:"]')
    await until(() => $('[role="menuitem"], [role="menuitemradio"]'), 'program menüsü')
    const items = $$('[role="menuitem"], [role="menuitemradio"]')
    const mine = items.find((el) => el.textContent?.includes('Teknofest 2026'))
    expect(mine?.querySelector('.side-pav')?.textContent?.trim()).toBe('TF')
    // Diğer program (kimliksiz) türetilmiş kalır ve “TF” ile çakışmaz.
    const other = items.find((el) => el.textContent?.includes('Teknofest 2027'))
    expect(other?.querySelector('.side-pav')?.textContent?.trim()).not.toBe('TF')
    ;($('[role="menuitem"], [role="menuitemradio"]') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    // Temizle: boş kısa ad + “renk yok” → `null` gönderilir, avatar türetilene döner.
    await editProgram('', '')
    const patches = backend.sent('PATCH', '/v1/programs/p1')
    expect(patches).toHaveLength(2)
    expect(patches[1]!.body).toMatchObject({ short_name: null, color: null })
    await until(() => avatarText() === derived.text, 'türetilmiş avatar geri geldi')
    expect(toneOf()).toBe(derived.tone)
    void switchScope
  })
})
