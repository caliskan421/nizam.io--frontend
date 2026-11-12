// W127 · O3: arşiv entegrasyon testlerinin ortak kurulumu (W82a harness'i + durumlu arşiv sunucusu).
import { PEOPLE, createBackend, seedWorld } from '@/app/__tests__/integration/harness'

import { archiveHandlers, createArchiveState, file, type ArchiveState } from './archive-fake'

export {
  $,
  $$,
  boot,
  byText,
  click,
  idle,
  switchScope,
  teardown,
  toasts,
  until,
  PEOPLE,
} from '@/app/__tests__/integration/harness'
export { ORIGIN } from '@/app/__tests__/integration/fake-org'

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

export const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
export let state: ArchiveState = createArchiveState()

export function seedArchive(): void {
  seedWorld(backend.db)
  const m = PEOPLE.member.account_id
  const c = PEOPLE.coord.account_id
  state = createArchiveState()
  state.files = [
    file('f1', 'w1', 'd1', m, { display_name: 'rapor.pdf', tag: 'sonuc' }),
    file('f2', 'w1', 'd1', c, { display_name: 'foto.png', content_type: 'image/png', tag: 'plan' }),
    file('f3', 'w2', 'd1', c, { display_name: 'sartname.pdf', tag: 'ister' }),
    file('f4', 'w3', 'd2', m, { display_name: 'yazilim.pdf' }),
  ]
  backend.server.use(...archiveHandlers(backend.db, state))
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
