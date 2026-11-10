// WP3 · İş 2 (b): 03 `kisi` süzgeci (BE-038) ↔ 05b kişisel takip ↔ 05 kullanıcı paneli, AYNI kişide
// aynı sayıları söyler; bir yazmadan (durum geçişi, "Görev ata") sonra üçü birlikte güncel kalır.
// Üretim router + kabuk + durumlu sahte backend (`countProgramWorkItems` ve `listProgramWorkItems`
// `assignee_account_id` süzgeciyle; v0.15).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  click,
  createBackend,
  fill,
  idle,
  PEOPLE,
  seedTimeline,
  teardown,
  until,
} from './harness'
import { ADMIN_ADMIN } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const AYSE = PEOPLE.member.account_id
const COUNTS = '/v1/program/work-items/counts'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seed()
  await boot({ ...ADMIN_ADMIN, path: `/gorevler?kisi=${AYSE}&gorev=w1` })
  await until(() => $('[data-testid="wf-status-trigger"]'), 'ısınma 03')
  teardown()
  await boot({ ...ADMIN_ADMIN, path: `/kullanicilar/${AYSE}` })
  await until(() => $('[data-testid="personal-tracking"]'), 'ısınma 05b')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seed()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

/** Ayşe: w1 (Mekanik, geciken) + w3 (Yazılım, zamanında). Cem w4. Kerem w2. */
function seed(): void {
  seedTimeline(backend.db)
  backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on = '2026-11-05'
}

const tab = (label: string): number | null => {
  const b = $$('.tasks-tabs .rp-seg button').find((x) => x.textContent?.includes(label))
  const t = b?.querySelector('.rp-count')?.textContent
  return t ? Number(t.replace(/[()]/g, '')) : null
}
const num = (text: string | null | undefined, re: RegExp): number | null => {
  const m = re.exec(text ?? '')
  return m ? Number(m[1]) : null
}
/** 05b üst kartları: Açık görev / Gecikmede / Onay bekleyen. */
const card = (key: string): number | null => {
  const text = $(`[data-testid="personal-tracking"] [data-card="${key}"] [data-card-value]`)
  return text?.textContent ? Number(text.textContent) : null
}
const tracking = () => ({ open: card('acik'), late: card('geciken'), review: card('onayda') })
/** 05 panel özeti: açık / geciken / onayda. */
const panelSummary = () => {
  const text = $('[data-testid="user-panel"]')?.textContent
  return {
    open: num(text, /açık(\d+)/),
    late: num(text, /geciken(\d+)/),
    review: num(text, /onayda(\d+)/),
  }
}

async function read03() {
  await until(() => tab('Tümü') !== null, '03 sayaçları')
  return { open: tab('Tümü'), late: tab('Geciken'), review: tab('Onay bekleyen') }
}

describe('(b) aynı kişi, üç yüzey, aynı sayılar', () => {
  it('Ayşe: 03 ?kisi süzgeci, 05b ve 05 paneli açık 2 / geciken 1 / onayda 0', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: `/gorevler?kisi=${AYSE}` })
    await until(() => $$('[data-work-item]').length === 2, '03 süzülmüş liste')
    expect(
      $$('[data-work-item]')
        .map((r) => r.dataset.workItem)
        .sort(),
    ).toEqual(['w1', 'w3'])
    const s03 = await read03()
    // Süzgeç SUNUCUDA: hem liste hem sayaç ucu aynı tekrarlı parametreyle gider.
    const counts = backend.sent('GET', COUNTS).filter((r) => r.query.has('assignee_account_id'))
    expect(counts.at(-1)!.query.getAll('assignee_account_id')).toEqual([AYSE])
    expect(
      backend.sent('GET', '/v1/program/work-items').at(-1)!.query.getAll('assignee_account_id'),
    ).toEqual([AYSE])
    // Süzgeç sayacı yalnız onun görevleri: sunucu toplamı süzgeçsiz 4, süzgeçli 2.
    expect(s03).toEqual({ open: 2, late: 1, review: 0 })

    await app.router.push(`/kullanicilar/${AYSE}`)
    await until(() => tracking().open !== null, '05b kartları')
    await idle(app.queryClient)
    expect(tracking()).toEqual(s03)
    await app.router.push(`/kullanicilar?secili=${AYSE}`)
    await until(() => panelSummary().open !== null, '05 panel özeti')
    await idle(app.queryClient)
    expect(panelSummary()).toEqual(s03)
  })

  it('03’te w1 tamamlanır: 05b ve 05 paneli bayat kalmaz (açık 1 / geciken 0)', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: `/gorevler?kisi=${AYSE}&gorev=w1` })
    await until(() => tab('Geciken') === 1, '03 geciken')
    await click('[data-testid="wf-status-trigger"]')
    await click('[data-to="tamamlandi"]')
    await until(() => tab('Geciken') === 0, '03 geciken 0')
    await idle(app.queryClient)
    expect(await read03()).toEqual({ open: 2, late: 0, review: 0 }) // Tümü tamamlananı da sayar
    expect(tab('Tamamlanan')).toBe(1)

    await app.router.push(`/kullanicilar/${AYSE}`)
    await until(() => tracking().open !== null, '05b kartları')
    await idle(app.queryClient)
    expect(tracking()).toEqual({ open: 1, late: 0, review: 0 })
    await app.router.push(`/kullanicilar?secili=${AYSE}`)
    await until(() => panelSummary().open !== null, '05 panel özeti')
    await idle(app.queryClient)
    expect(panelSummary()).toEqual({ open: 1, late: 0, review: 0 })
  })

  it('05b "Görev ata": yeni görev kişinin 03 süzgecinde, 05b ve 05’te aynı anda +1 görünür', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: `/kullanicilar/${AYSE}` })
    await until(() => tracking().open === 2, '05b kartları')
    await click('[data-assign]:not([disabled])')
    // İki birimli kişi: önce hedef birim seçilir (tek birimde doğrudan 03’e gidilir).
    await fill('[data-assign-form] select[name="departmentId"]', 'd1')
    await click('[data-assign-submit]')
    await until(() => app.router.currentRoute.value.name === 'work.tasks', '03 rotası')
    await until(() => $('[role="dialog"] [name="title"]'), 'form')
    await fill('[role="dialog"] [name="title"]', 'Hidrolik sızdırmazlık')
    await fill('[role="dialog"] select[name="departmentId"]', 'd1')
    await fill('[role="dialog"] [name="startOn"]', '2026-11-12')
    await fill('[role="dialog"] [name="endOn"]', '2026-11-30')
    await click('[data-testid="wf-submit"]')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
    await idle(app.queryClient)
    const created = backend.db.items.find((i) => i.title === 'Hidrolik sızdırmazlık')
    expect(created?.assignee_account_ids).toEqual([AYSE])

    await app.router.push(`/gorevler?kisi=${AYSE}`)
    await until(() => tab('Tümü') === 3, '03 süzgeçli Tümü 3')
    await app.router.push(`/kullanicilar/${AYSE}`)
    await until(() => tracking().open === 3, '05b açık 3')
    await app.router.push(`/kullanicilar?secili=${AYSE}`)
    await until(() => panelSummary().open === 3, '05 açık 3')
    await idle(app.queryClient)
    expect(panelSummary()).toEqual({ open: 3, late: 1, review: 0 })
  })
})
