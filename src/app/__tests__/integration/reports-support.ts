// W142 · O3: rapor entegrasyon testlerinin ortak kurulumu (W82a harness'i + arşiv + rapor sunucusu).
import { vi } from 'vitest'

import { PEOPLE, createBackend, seedWorld, until, $, click } from './harness'
import { archiveHandlers, createArchiveState, file, type ArchiveState } from './archive-fake'
import {
  createReportsState,
  holdReports,
  reportsHandlers,
  type FakeMeeting,
  type ReportsState,
} from './fake-reports'

export {
  $,
  $$,
  boot,
  byText,
  click,
  fill,
  idle,
  switchScope,
  teardown,
  toasts,
  until,
  PEOPLE,
} from './harness'
export { ORIGIN } from './fake-org'

export const ADMIN = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'admin' as const },
}
export const COORD = {
  email: PEOPLE.coord.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
}
export const MEMBER = {
  email: PEOPLE.member.email,
  scope: { programId: 'p1', lens: 'member' as const, departmentId: 'd1' },
}
/** Yazılım (d2) koordinatörü: Mekanik toplantı/görevleri için "başka departman". */
export const OTHER_COORD = {
  email: PEOPLE.free.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd2' },
}

export type Roles = Parameters<typeof createBackend>[0]
export const reports: { state: ReportsState; archive: ArchiveState } = {
  state: createReportsState(),
  archive: createArchiveState(),
}
export let backend!: ReturnType<typeof createBackend>

export function useReportsBackend(roles: Roles) {
  backend = createBackend(roles)
  return backend
}

export const MEETING: FakeMeeting = {
  meeting_id: 'm1',
  program_id: 'p1',
  title: 'Haftalık koordinasyon',
  owner_department_id: 'd1',
  department_ids: ['d1'],
}

/** Dünya: ortak veri + Yazılım (d2) koordinatörü (Bora) + bir Mekanik toplantısı. */
export function seedReports(): void {
  seedWorld(backend.db)
  backend.db.memberships.push({
    program_id: 'p1',
    department_id: 'd2',
    account_id: PEOPLE.free.account_id,
    team: 'coordinator',
    membership_id: 'm-bora-d2',
  })
  reports.state = createReportsState()
  reports.state.meetings = [{ ...MEETING }]
  reports.archive = createArchiveState()
  reports.archive.files = [file('f1', 'w1', 'd1', PEOPLE.member.account_id)]
  backend.server.use(
    // Rapor yolları ÖNCE eşleşir; rapor olmayan bilet/tüketim arşiv sunucusuna düşer.
    ...reportsHandlers(backend.db, reports.state),
    ...archiveHandlers(backend.db, reports.archive),
  )
}

/** Her testten önce: sunucu sıfırlanır, rapor dünyası yeniden kurulur. */
export function resetReports(): void {
  backend.reset()
  seedReports()
}

export const hold = (method: string, path: string) => holdReports(reports.state, method, path)

/** Bilet üretim istekleri (yalnız rapor yolları). */
export const issued = () =>
  backend.sent('POST', '/v1/download-tickets').filter((r) => {
    const path = (r.body as { path?: string } | undefined)?.path
    return typeof path === 'string' && path.startsWith('/v1/reports/')
  })

/** Gerçek tıklama: işaretçi önce odaklar (`HTMLElement.click()` odaklamaz; KESİN 27). */
export async function userClick(target: string | (() => HTMLElement | null)): Promise<HTMLElement> {
  const probe = typeof target === 'string' ? () => $(target) : target
  const el = await until(probe, `tıklanacak öğe ${String(target)}`)
  el.focus()
  return click(() => el)
}

/**
 * Tarayıcı dosya kaydı: yalnız `download` öznitelikli bağlantı tıklaması yakalanır (kaydedilen ad
 * `saved`'e yazılır); yönlendirici bağlantıları (`RouterLink`) gerçek tıklamayla çalışır.
 */
export function captureSaves(saved: string[]): void {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'click')!.value as (
    this: HTMLAnchorElement,
  ) => void
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (this.hasAttribute('download')) saved.push(this.download)
    else original.call(this)
  })
}
