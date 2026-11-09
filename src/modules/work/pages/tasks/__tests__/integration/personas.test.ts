// W48 madde 6 — yetki görünürlüğü uçtan uca (capabilities; P1): dört kişilik için duman testi
// GERÇEK sayfa + panel + sekmeler + yeni görev formu ile. Rol dizeleri yalnız burada (K1 lint).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { trTasksPage } from '@/shared/i18n/tr/work'

import { server, workItem } from '../../../../model/__tests__/harness'
import type { StandingFixture } from '../page-harness'
import {
  backendHandlers,
  body,
  fakeWork,
  ME,
  mountApp,
  panelTab,
  settle,
  unmountApps,
  type AppContext,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => unmountApps())
afterAll(() => server.close())

const MEMBERS = [
  { account_id: ME, full_name: 'Ayşe', membership_id: 'm1', role: 'uye', status: 'active' },
  { account_id: 'acc-2', full_name: 'Bora', membership_id: 'm2', role: 'uye', status: 'active' },
]

interface Persona {
  standing: StandingFixture
  lens: 'admin' | 'coordinator' | 'member'
  assigned: boolean
}

const ADMIN: Persona = {
  standing: { companyAdmin: true, rows: [] },
  lens: 'admin',
  assigned: false,
}
const COORDINATOR: Persona = {
  standing: { companyAdmin: false, rows: [{ department_id: 'd1', role: 'koordinator' }] },
  lens: 'coordinator',
  assigned: false,
}
const MEMBER = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }
const ASSIGNED: Persona = { standing: MEMBER, lens: 'member', assigned: true }
const UNASSIGNED: Persona = { standing: MEMBER, lens: 'member', assigned: false }

async function open(persona: Persona): Promise<AppContext> {
  const assignee = persona.assigned ? ME : 'acc-2'
  const item = workItem({
    work_item_id: 'w1',
    department_id: 'd1',
    status: 'devam_ediyor',
    assignees: [{ account_id: assignee, full_name: 'Atanan' }],
    assignee_account_ids: [assignee],
  })
  server.use(...backendHandlers(persona.standing, fakeWork([item], MEMBERS)))
  const departmentId = persona.lens === 'admin' ? null : 'd1'
  return mountApp({ programId: 'p1', lens: persona.lens, departmentId }, '/gorevler?gorev=w1')
}

const has = (selector: string) => body().find(selector).exists()
const EMPTY_TITLE = trTasksPage.tasksPage.empty.title

/** Panelde görünen eylemler + Notlar / Dosyalar sekmelerindeki yazma denetimleri. */
async function visible(ctx: AppContext) {
  const seen = {
    statusMenu: has('[data-testid="wf-status-trigger"]'),
    statusReadonly: has('[data-testid="status-readonly"]'),
    upload: has('[data-action="upload"]'),
    remove: has('[data-testid="wf-delete"]'),
    newTask: has('[data-testid="tasks-page"] .rp-head button.t-btn--primary'),
    noteInput: false,
    filesUpload: false,
  }
  panelTab('Notlar').click()
  await settle(ctx.queryClient)
  seen.noteInput = has('[data-testid="note-input"]')
  panelTab('Dosyalar').click()
  await settle(ctx.queryClient)
  seen.filesUpload = has('[data-testid="files-upload"]')
  return seen
}

describe('W48 · yetki görünürlüğü (dört kişilik, gerçek bileşenler)', () => {
  it('şirket yöneticisi: salt okunur durum, not yazma ve yükleme gizli; yeni görevde tek atanan', async () => {
    const ctx = await open(ADMIN)
    expect(await visible(ctx)).toEqual({
      statusMenu: false,
      statusReadonly: true,
      upload: false,
      remove: true,
      newTask: true,
      noteInput: false,
      filesUpload: false,
    })
    body().find<HTMLButtonElement>('.rp-head button.t-btn--primary').element.click()
    await settle(ctx.queryClient)
    expect(has('[role="dialog"] [name="assignee"]')).toBe(true)
    expect(has('[data-testid="wf-extra"]')).toBe(false)
  })

  it('koordinatör: tam (durum menüsü, not, yükleme, sil, yeni görevde ek atananlar)', async () => {
    const ctx = await open(COORDINATOR)
    expect(await visible(ctx)).toEqual({
      statusMenu: true,
      statusReadonly: false,
      upload: true,
      remove: true,
      newTask: true,
      noteInput: true,
      filesUpload: true,
    })
    body().find<HTMLButtonElement>('.rp-head button.t-btn--primary').element.click()
    await settle(ctx.queryClient)
    expect(has('[data-testid="wf-extra"]')).toBe(true)
  })

  it('atanmış üye: kendi durumu, not, yükleme; sil ve yeni görev yok', async () => {
    const ctx = await open(ASSIGNED)
    expect(await visible(ctx)).toEqual({
      statusMenu: true,
      statusReadonly: false,
      upload: true,
      remove: false,
      newTask: false,
      noteInput: true,
      filesUpload: true,
    })
  })

  // Pinli sözleşme (`istemci-akislari.md` s.162, `listProgramWorkItems` açıklaması): atanmamış
  // üye görevi listede görmez, ayrıntı ucunda 403 alır. Sahte backend bu yetkiyi uygular.
  it('atanmamış üye: görev listede yok; derin bağlantı 403 work.not_assigned → panel yetkisiz durumu', async () => {
    await open(UNASSIGNED)
    expect(has('[data-work-item="w1"]')).toBe(false)
    expect(body().find('[data-testid="tasks-page"] .rp-empty__title').text()).toBe(EMPTY_TITLE)
    const alert = body().find('.rp-aside [role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Bu görev size atanmamış.')
    expect(alert.find('button').exists()).toBe(false)
  })

  it('atanmamış üye: yetki düğmeleri yok (negatif — durum, yükleme, sil, yeni görev, not, dosya)', async () => {
    await open(UNASSIGNED)
    expect({
      statusMenu: has('[data-testid="wf-status-trigger"]'),
      upload: has('[data-action="upload"]'),
      remove: has('[data-testid="wf-delete"]'),
      newTask: has('[data-testid="tasks-page"] .rp-head button.t-btn--primary'),
      noteInput: has('[data-testid="note-input"]'),
      filesUpload: has('[data-testid="files-upload"]'),
      tabs: has('.rp-aside [role="tab"]'),
    }).toEqual({
      statusMenu: false,
      upload: false,
      remove: false,
      newTask: false,
      noteInput: false,
      filesUpload: false,
      tabs: false,
    })
  })
})
