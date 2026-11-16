// W176 O3 senaryo 5 + 3 (BE-005/137/139/141, KESİN 29): görev kısa kodu 03 satırında ve panelde,
// K1 onay satırında "gönderildi ‹an›" + "n dosya"; koordinatör gerekçeyle iade eder → sunucu
// `last_return` yazar → üye Ü1 özetinde iade gerekçesi görünür (gerekçesiz iadede varsayılan not).
// Sunucu v0.23 gibi davranır: kod `<katalog kodu>-<no>`, kodsuz birimde `null` → istemci `#<no>`.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  click,
  COORD,
  idle,
  MEMBER,
  resetReports,
  teardown,
  until,
  useReportsBackend,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  seed()
  await boot({ ...COORD, path: '/' })
  await until(() => $('[data-home="k1"] [data-region="approvals"]'), 'ısınma K1')
  teardown()
  await boot({ ...MEMBER, path: '/' })
  await until(() => $('[data-home="u1"] [data-cell="returned"]'), 'ısınma Ü1')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  seed()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

/** w1 (Ayşe, Mekanik): onayda, 2 dosya, gönderim anı; w3 (Yazılım): kodsuz birim → `#1`. */
function seed(): void {
  const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!
  Object.assign(w1, {
    status: 'onaya_sunuldu',
    file_count: 2,
    submitted_at: '2026-11-10T08:00:00Z',
    submitted_by: { account_id: 'acc-member', full_name: 'Ayşe Demir' },
  })
}

const cellNote = (key: string) => $(`[data-cell="${key}"] .rh-cap`)?.textContent?.trim() ?? null

describe('kod ve gönderim bilgisi (sunucu alanlarından)', () => {
  it('K1 onay satırı: kod MEK-1, "gönderildi ‹an›" ve "2 dosya" satırdan; dosya listesi istenmez', async () => {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => $('[data-region="approvals"] [data-row]'), 'onay satırı')
    await idle(app.queryClient)
    const row = $('[data-region="approvals"] [data-row]')!
    expect(row.querySelector('[data-task-code]')?.textContent).toBe('MEK-1')
    expect(row.querySelector('[data-parts="sent"]')?.textContent).toMatch(/gönderildi 10\.11/)
    expect(row.querySelector('[data-parts="files"]')?.textContent).toMatch(/2/)
    // BE-137: görev başına dosya listesi YASAK (satırdan).
    expect(backend.sent('GET', '/v1/work-items/w1/files')).toHaveLength(0)
  })

  it('03 satırı ve panel: kodlu birimde MEK-1; kodsuz birimde #<sıra>', async () => {
    backend.db.catalog.find((c) => c.department_id === 'd2')!.code = undefined as never
    const app = await boot({ ...COORD, path: '/gorevler?gorev=w1' })
    await until(() => $('[data-testid="detail-kicker"]'), 'panel')
    expect($('[data-testid="detail-kicker"]')!.textContent).toContain('MEK-1')
    expect($('[data-work-item="w1"]')!.textContent).toContain('MEK-1')
    await idle(app.queryClient)
    teardown()
    // Yönetici merceği başka birimin görevini görür: kodsuz Yazılım (d2) görevi `#1`.
    const admin = await boot({
      email: 'yonetici@example.test',
      scope: { programId: 'p1', lens: 'admin' },
      path: '/gorevler?gorev=w3',
    })
    await until(() => $('[data-testid="detail-kicker"]'), 'panel w3')
    expect($('[data-testid="detail-kicker"]')!.textContent).toContain('#1')
    expect($('[data-testid="detail-kicker"]')!.textContent).not.toContain('YAZ-')
    await idle(admin.queryClient)
  })
})

describe('iade gerekçesi → üye Ü1 (K1 → Ü1 türevi)', () => {
  async function returnAsCoordinator(reason: string | null): Promise<void> {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => $('[data-region="approvals"] [data-action="return"]'), 'iade düğmesi')
    await click('[data-region="approvals"] [data-action="return"]')
    if (reason !== null) {
      const input = await until(
        () => $('[data-testid="k1-return-input"]') as HTMLTextAreaElement | null,
        'gerekçe alanı',
      )
      input.value = reason
      input.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      await until(() => $('[data-testid="k1-return-input"]'), 'gerekçe alanı')
    }
    await click('[data-testid="k1-return-submit"]')
    await until(() => !$('[data-region="approvals"] [data-row]'), 'satır düştü')
    await idle(app.queryClient)
    teardown()
  }

  it('gerekçeli iade: Ü1 iade hücresinin notu gerekçedir; kayıt last_return', async () => {
    await returnAsCoordinator('imzalı liste eksik')
    const transitions = backend.sent('POST', '/v1/work-items/w1/transitions')
    expect(transitions.at(-1)?.body).toEqual({ to: 'iade_edildi', reason: 'imzalı liste eksik' })
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => cellNote('returned')?.includes('imzalı liste eksik'), 'iade gerekçesi')
    expect(cellNote('returned')).toBe('imzalı liste eksik')
    await idle(app.queryClient)
  })

  it('gerekçesiz iade: gövdede reason yok; Ü1 varsayılan not gösterir, gerekçe uydurulmaz', async () => {
    await returnAsCoordinator(null)
    expect(backend.sent('POST', '/v1/work-items/w1/transitions').at(-1)?.body).toEqual({
      to: 'iade_edildi',
    })
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => $('[data-cell="returned"] [data-value]')?.textContent?.trim() === '1', 'iade')
    await idle(app.queryClient)
    expect(cellNote('returned')).not.toContain('imzalı')
    expect($$('[data-cell="returned"]')).toHaveLength(1)
  })
})
