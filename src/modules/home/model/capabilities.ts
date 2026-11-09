/**
 * Ana sayfa (01) eylem görünürlüğü ve veri kaynağı (K1). Saf fonksiyonlar; girdi yalnız sunucu
 * OLGULARIDIR (`me.company_admin`, seçili programdaki ekip satırları). Mercek yetki DEĞİLDİR
 * (ortak-kurallar §1, P1): eylemler merceğe bakmaz; yalnız pano verisinin kaynağı (içerik
 * kapsamı) Admin merceğine bağlıdır. Gizleme güvenlik değildir: sunucu her istekte denetler.
 *
 * `istemci-akislari.md` §4'te satırı OLMAYAN işlemler modül README kural kimliklerinden
 * (`01-ana-sayfa/backend.md` §3):
 *  - Pano (`reportDashboard`): REPORTING-K01 — yalnız şirket yöneticisi; içerik Admin merceğinde
 *    (program geneli). K/Ü merceğinde çağrılmaz (403 yok; P1, E-01-04).
 *  - "Toplantı oluştur" (`createMeeting`, `POST /v1/meetings`): meetings README — ŞY ∨ K.
 *  - "Kullanıcı davet et" (`createUser`, `POST /v1/admin/users`): ORGANIZATION README — ŞY ∨ K
 *    (koordinatör yalnız `uye`, programdaki kendi departmanı).
 * "Yeni görev" (`createWorkItem`, §4 s.139) görev modülünün `canCreateWorkItem`'ındadır.
 */
import type { ScopeLens } from '@/shared/scope/scope'
import type { Standing } from '@/shared/scope/standing-facts'

export type HomeCapability = 'readDashboard' | 'createMeeting' | 'addUser'

/** Her kararın kaynağı (denetim izi). */
export const HOME_CAPABILITY_SOURCES: Readonly<Record<HomeCapability, string>> = {
  readDashboard:
    'REPORTING-K01: reportDashboard yalnız şirket yöneticisi; içerik Admin merceğinde (P1)',
  createMeeting:
    'meetings README POST /v1/meetings (createMeeting): şirket yöneticisi ∨ koordinatör',
  addUser:
    'ORGANIZATION README POST /v1/admin/users (createUser): şirket yöneticisi ∨ koordinatör (yalnız uye)',
}

/** Seçili programda en az bir departmanın koordinatörü mü. */
function coordinatesIn(standing: Standing, programId: string): boolean {
  return standing.rows.some((row) => row.programId === programId && row.role === 'coordinator')
}

function adminOrCoordinator(standing: Standing | null, programId: string | null): boolean {
  if (!standing || programId === null) return false
  return standing.companyAdmin || coordinatesIn(standing, programId)
}

/** KPI kaynağı pano mu (REPORTING-K01): şirket yöneticisi VE Admin merceği. */
export function canReadDashboard(standing: Standing | null, lens: ScopeLens | null): boolean {
  return standing?.companyAdmin === true && lens === 'admin'
}

/** "Toplantı oluştur" kutucuğu görünür mü (F4'e kadar devre dışı). */
export function canCreateMeeting(standing: Standing | null, programId: string | null): boolean {
  return adminOrCoordinator(standing, programId)
}

/** "Kullanıcı davet et" kutucuğu görünür mü (F2'ye kadar devre dışı). */
export function canAddUser(standing: Standing | null, programId: string | null): boolean {
  return adminOrCoordinator(standing, programId)
}
