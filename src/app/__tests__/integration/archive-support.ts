// W127 · O3: arşiv entegrasyon testlerinin ortak kurulumu (W82a harness'i + durumlu arşiv sunucusu).
import { $, PEOPLE, click, createBackend, seedWorld, until } from './harness'

import {
  archiveHandlers,
  createArchiveState,
  file,
  holdRequest,
  type ArchiveState,
} from './archive-fake'

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

export type Roles = Parameters<typeof createBackend>[0]
export const archive: { state: ArchiveState } = { state: createArchiveState() }
export let backend!: ReturnType<typeof createBackend>

/** Test dosyası rol dizelerini verir (K1: rol dizesi yalnız test dosyasında). */
export function useArchiveBackend(roles: Roles) {
  backend = createBackend(roles)
  return backend
}

export function seedArchive(): void {
  seedWorld(backend.db)
  const m = PEOPLE.member.account_id
  const c = PEOPLE.coord.account_id
  archive.state = createArchiveState()
  archive.state.files = [
    file('f1', 'w1', 'd1', m, { display_name: 'rapor.pdf', tag: 'sonuc' }),
    file('f2', 'w1', 'd1', c, { display_name: 'foto.png', content_type: 'image/png', tag: 'plan' }),
    file('f3', 'w2', 'd1', c, { display_name: 'sartname.pdf', tag: 'ister' }),
    file('f4', 'w3', 'd2', m, { display_name: 'yazilim.pdf' }),
  ]
  backend.server.use(...archiveHandlers(backend.db, archive.state))
}

/** Her testten önce: sunucu sıfırlanır, arşiv dünyası yeniden kurulur. */
export function resetArchive(): void {
  backend.reset()
  seedArchive()
}

/** S3 arşiv/dosya istekleri (başlıksız olanı yakalamak için). */
export const s3 = () =>
  backend.requests.filter(
    (r) => r.path.startsWith('/v1/records/archive') || r.path.startsWith('/v1/files/'),
  )

/** Arşiv sunucusunda isteği bekletir (geç sonuç senaryoları; gerçek süre yok). */
export const hold = (method: string, path: string) => holdRequest(archive.state, method, path)

/**
 * Gerçek kullanıcı tıklaması: tarayıcıda işaretçi önce öğeyi odaklar (`HTMLElement.click()` odaklamaz);
 * odak dönüşü testleri tetikleyicinin odaklı olmasına dayanır (KESİN 27).
 */
export async function userClick(target: string | (() => HTMLElement | null)): Promise<HTMLElement> {
  const probe = typeof target === 'string' ? () => $(target) : target
  const el = await until(probe, `tıklanacak öğe ${String(target)}`)
  el.focus()
  return click(() => el)
}
