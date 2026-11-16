// W176 O3 senaryo 5 (kırıcı fark `MyDepartment.coordinators`/`department_code`, BE-141/BE-005):
// Ü1 "Koordinatörlüklerim" kartı üye hesabında `me/departments` satırından kod ve koordinatör adı
// gösterir; koordinatörü olmayan birimde satır gizli (ad uydurulmaz); kodsuz birimde ad kısaltması.
// Sunucu v0.23 gibi davranır (koordinatör listesi üyelik satırlarından, kapsam süzmesi sunucuda).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  idle,
  MEMBER,
  PEOPLE,
  resetReports,
  teardown,
  until,
  useReportsBackend,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...MEMBER, path: '/' })
  await until(() => $('[data-home="u1"] [data-region="units"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetReports())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const unitRows = () => $$('[data-region="units"] [data-row]')
const rowOf = (code: string) =>
  unitRows().find((r) => r.querySelector('[data-unit-code]')?.textContent?.trim() === code)

describe('Ü1 koordinatörlüklerim (me/departments v0.23 alanları)', () => {
  it('kod ve koordinatör adları sunucudan: Mekanik (MEK) iki koordinatör; Yazılım (YAZ) tek koordinatör', async () => {
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => unitRows().length === 2, 'iki birim')
    await idle(app.queryClient)
    const mek = rowOf('MEK')!
    expect(mek.textContent).toContain('Mekanik')
    const names = mek.querySelector('[data-parts="coordinator"]')?.textContent ?? ''
    expect(names).toMatch(/^Koordinatörler: /)
    expect(names).toContain(PEOPLE.coord.full_name)
    expect(names).toContain(PEOPLE.admin.full_name)
    expect(rowOf('YAZ')!.querySelector('[data-parts="coordinator"]')?.textContent).toBe(
      `Koordinatör: ${PEOPLE.free.full_name}`,
    )
    expect(backend.sent('GET', '/v1/me/departments').length).toBeGreaterThan(0)
  })

  it('koordinatörsüz birimde koordinatör satırı gizli (ad uydurulmaz); kod katalogdan', async () => {
    backend.db.memberships = backend.db.memberships.filter(
      (m) => !(m.department_id === 'd2' && m.team === 'coordinator'),
    )
    backend.db.catalog.find((c) => c.department_id === 'd2')!.code = 'YZL'
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => unitRows().length === 2, 'iki birim')
    await idle(app.queryClient)
    const yaz = rowOf('YZL')!
    expect(yaz.textContent).toContain('Yazılım')
    expect(yaz.querySelector('[data-parts="coordinator"]')).toBeNull()
    expect(rowOf('MEK')!.querySelector('[data-parts="coordinator"]')).not.toBeNull()
  })
})
