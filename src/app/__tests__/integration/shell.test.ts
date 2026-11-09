// W82a · senaryo (6) "programa departman katılmamış" (muaf rotalar açık, diğerleri durum
// ekranı), (7) derin bağlantılar (`secili`, `/kullanicilar/:id`, `/koordinatorlukler/:id?sekme=`),
// (8) iç içe `aside`/`dialog` erişilebilirlik rolleri, ARIA başvuruları ve odak dönüşü — gerçek kabuk
// (kenar menüsü + üst çubuk + `main`) içinde, ışınlanan pencerelerle.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  byText,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedWorld,
  teardown,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: '/koordinatorlukler/d1' })
  await until(() => $('[data-testid="cd-title"]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const NO_DEPARTMENT = '[data-open-state="state.no-department"]'

describe('programa departman katılmamış (senaryo 6)', () => {
  it.each([
    ['/kullanicilar', '[data-testid="users-page"]'],
    ['/koordinatorlukler', '[data-testid="coords-none"]'],
    ['/koordinatorlukler/d1', '[data-state="missing"]'],
    ['/programlar', '[data-testid="programs-page"]'],
  ])('muaf rota %s içerik çizer', async (path, content) => {
    backend.db.links = backend.db.links.filter((l) => l.program_id !== 'p1')
    const app = await boot({ ...ADMIN, path })
    await until(() => $(content), 'muaf rota içeriği')
    await idle(app.queryClient)
    expect($(NO_DEPARTMENT)).toBeNull()
  })

  it.each(['/', '/gorevler'])(
    'muaf olmayan %s durum ekranı gösterir; menü açık kalır',
    async (path) => {
      backend.db.links = backend.db.links.filter((l) => l.program_id !== 'p1')
      const app = await boot({ ...ADMIN, path })
      await until(() => $(NO_DEPARTMENT), 'K7 durumu')
      expect($('nav [data-group="yonetim"]')).not.toBeNull()
      await idle(app.queryClient)
      expect(backend.sent('GET', '/v1/program/work-items')).toHaveLength(0)
    },
  )
})

describe('derin bağlantılar (senaryo 7)', () => {
  it('/kullanicilar?secili=<id> paneli açar; listede olmayan kimlik bilgi notu', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar?secili=acc-member' })
    await until(() => $('[data-testid="user-panel"][data-account="acc-member"]'), 'panel')
    teardown()
    await boot({ ...ADMIN, path: '/kullanicilar?secili=acc-yok' })
    await until(() => $('[data-testid="users-selected-missing"]'), 'bilgi notu')
    expect($('[data-testid="user-panel"]')).toBeNull()
  })

  it('/kullanicilar/:id kişisel takibi açar; kırıntı ve başlık kişinin adı', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar/acc-member' })
    await until(() => $('[data-person-name]')?.textContent === PEOPLE.member.full_name, 'ad')
    await until(() => $('[data-units]')?.textContent?.includes('Mekanik'), 'birimler')
  })

  it.each([
    ['uyeler', 'uyeler'],
    ['gorevler', 'gorevler'],
    ['ayarlar', 'ayarlar'],
    ['arsiv', 'genel'],
    ['yok', 'genel'],
  ])('/koordinatorlukler/d1?sekme=%s → etkin panel %s', async (sekme, panel) => {
    await boot({ ...ADMIN, path: `/koordinatorlukler/d1?sekme=${sekme}` })
    const active = await until(() => $('[role="tabpanel"]'), 'sekme paneli')
    expect(active.dataset.panel).toBe(panel)
    expect($('[role="tab"][aria-selected="true"]')?.dataset.value).toBe(panel)
  })
})

/** ARIA başvuruları belgede var mı; kimlikler tekil mi; iç içe rol yok mu. */
function semantics(): string[] {
  const problems: string[] = []
  const ids = $$('[id]').map((el) => el.id)
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dup.length > 0) problems.push(`yinelenen kimlik: ${[...new Set(dup)].join(', ')}`)
  for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const el of $$(`[${attr}]`)) {
      for (const ref of el.getAttribute(attr)!.split(/\s+/)) {
        if (ref && !document.getElementById(ref)) problems.push(`${attr} → #${ref} yok`)
      }
    }
  }
  for (const nested of [
    'aside aside',
    'main main',
    '[role="dialog"] [role="dialog"]',
    '[role="row"] [role="row"]',
  ]) {
    if ($(nested)) problems.push(`iç içe: ${nested}`)
  }
  for (const dialog of $$('[role="dialog"], [role="alertdialog"]')) {
    if (dialog.closest('main, aside')) problems.push('pencere ışınlanmamış (main/aside içinde)')
  }
  return problems
}

describe('erişilebilirlik rolleri ve odak dönüşü (senaryo 8)', () => {
  it('05 + yan panel + oluşturma penceresi: rol/başvuru sorunu yok; Esc odağı tetikleyiciye döndürür', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar?secili=acc-member' })
    await until(() => $('[data-testid="user-panel"]'), 'panel')
    expect(semantics()).toEqual([])
    const trigger = byText('.users-page button', 'Kullanıcı oluştur')!
    trigger.focus()
    trigger.click()
    const dialog = await until(() => $('[role="dialog"]'), 'pencere')
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(semantics()).toEqual([])
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await until(() => !$('[role="dialog"]'), 'Esc kapatır')
    expect(document.activeElement).toBe(trigger)
  })

  it('05 çip onayı (alertdialog) vazgeç → odak çip düğmesine döner', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar?secili=acc-member' })
    const remove = await until(
      () => $('[data-testid="user-panel"] [data-chip="d1"] [data-testid="chip-remove"]'),
      'çip',
    )
    remove.focus()
    remove.click()
    const dialog = await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    expect(dialog.getAttribute('role')).toBe('alertdialog')
    expect(semantics()).toEqual([])
    await click(() => byText('button', 'Vazgeç', dialog))
    await until(() => !$('[data-testid="confirm-dialog"]'))
    expect(document.activeElement).toBe(remove)
  })

  it('08b sekmeler + Üye ekle penceresi: başvurular geçerli; vazgeç odağı "Üye ekle"ye döndürür', async () => {
    await boot({ ...ADMIN, path: '/koordinatorlukler/d1?sekme=uyeler' })
    const add = await until(() => $('[data-action="members-add"]'), 'Üye ekle')
    await until(() => $('[data-member="acc-member"]'), 'üyeler')
    expect(semantics()).toEqual([])
    add.focus()
    add.click()
    const dialog = await until(() => $('[role="dialog"]'), 'pencere')
    expect(semantics()).toEqual([])
    await click(() => byText('button', 'Vazgeç', dialog))
    await until(() => !$('[role="dialog"]'))
    expect(document.activeElement).toBe(add)
  })

  it('05b gömülü panel + kişisel takip yan alanı: iç içe aside yok', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar/acc-member?sekme=hesap' })
    await until(() => $('[data-panel="hesap"] [data-testid="user-panel"]'), 'gömülü panel')
    expect(semantics()).toEqual([])
  })

  it('08 ızgarası + kart menüsü ve /programlar: başvurular geçerli', async () => {
    const app = await boot({ ...ADMIN, path: '/koordinatorlukler' })
    await click(() => $('[data-department="d1"] .coords-menu__btn'))
    await until(() => $('[role="menu"]'), 'kart menüsü')
    expect(semantics()).toEqual([])
    await app.router.push('/programlar')
    await until(() => $('[data-testid="programs-page"] [data-program="p1"]'), 'program listesi')
    expect(semantics()).toEqual([])
  })
})
