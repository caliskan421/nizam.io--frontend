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

export type HomeCapability = 'readDashboard' | 'createMeeting' | 'addUser' | 'openDeletedRecords'

/** Her kararın kaynağı (denetim izi). */
export const HOME_CAPABILITY_SOURCES: Readonly<Record<HomeCapability, string>> = {
  readDashboard:
    'REPORTING-K01: reportDashboard yalnız şirket yöneticisi; içerik Admin merceğinde (P1)',
  createMeeting:
    'meetings README POST /v1/meetings (createMeeting): şirket yöneticisi ∨ koordinatör',
  addUser:
    'ORGANIZATION README POST /v1/admin/users (createUser): şirket yöneticisi ∨ koordinatör (yalnız uye)',
  openDeletedRecords:
    '12-silinen-kayitlar README + istemci-akislari §3 silinen listeleri (P36): yalnız şirket yöneticisi, mercekten bağımsız (P1)',
}

/** Seçili programda en az bir departmanın koordinatörü mü. */
function coordinatesIn(standing: Standing, programId: string): boolean {
  return standing.rows.some((row) => row.programId === programId && row.role === 'coordinator')
}

function adminOrCoordinator(standing: Standing | null, programId: string | null): boolean {
  if (!standing || programId === null) return false
  return standing.companyAdmin || coordinatesIn(standing, programId)
}

/**
 * "Silinen kayıtlar" düğmesi (E-01-02; F5, P36): yalnız şirket yöneticisi görür. Mercek girdi
 * değildir (P1): Koordinatör/Üye merceğindeki yönetici de görür; diğer roller için DOM'da yoktur.
 */
export function canOpenDeletedRecords(standing: Standing | null): boolean {
  return standing?.companyAdmin === true
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

/** 01 ana sayfa gövdesi: yönetici sayfası, K1 (koordinatör) ya da Ü1 (üye) — P53. */
export type HomeVariant = 'admin' | 'coordinator' | 'member'

/**
 * Sayfa seçimi (P53, geçici kabul — W135 varsayımı 1): `company_admin` mercek ne olursa olsun
 * yönetici sayfasını görür (P1; E-01-28 kartları program geneli). K1 yalnız `company_admin`
 * OLMAYAN hesabın Koordinatör merceğinde, Ü1 yalnız Üye merceğinde açılır. Olgular (standing)
 * ya da mercek henüz yoksa yönetici sayfası (kendi yükleniyor durumu) kalır.
 */
export function homeVariant(standing: Standing | null, lens: ScopeLens | null): HomeVariant {
  if (!standing || standing.companyAdmin) return 'admin'
  if (lens === 'coordinator') return 'coordinator'
  if (lens === 'member') return 'member'
  return 'admin'
}

/** Ekip listesi satırının rolü koordinatör mü (`listMembers` satırı; yalnız gösterim noktası). */
export function isCoordinatorRole(role: string): boolean {
  return role === 'koordinator'
}

/** Seçili programda koordinatörü olunan birimlerin görünen adları (E-K1-02 alt başlık). */
export function coordinatedUnitNames(
  standing: Standing | null,
  programId: string | null,
): string[] {
  if (!standing || programId === null) return []
  const seen = new Map<string, string>()
  for (const row of standing.rows) {
    if (row.programId === programId && row.role === 'coordinator') {
      seen.set(row.departmentId, row.displayName)
    }
  }
  return [...seen.values()]
}
