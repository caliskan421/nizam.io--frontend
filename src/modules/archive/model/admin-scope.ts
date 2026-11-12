/**
 * P33 yönetici kapsamı — S3 başlığı kararı (`06-arsiv/mekanizma.md` §3 "F5 açılış notu").
 *
 * Arşiv uçlarının hepsi S3'tür (program + departman başlığı zorunlu); yöneticide (`company_admin`
 * OLGUSU, mercek değil — P1, KESİN 6) departman başlığı sonucu süzmez (sunucu program geneli
 * döner) ama doğru dosya/görev işlemi için dosyanın departmanı gerekir ve `FileListItem` /
 * `ArchiveTask` `department_id` taşımaz (BE-072). Karar:
 *
 *  - Yönetici: S3 departman başlığı YALNIZ rotadaki `klasorId`'dir (= departman kimliği; kod
 *    kuralı, sözleşme açıkça yazmaz) — keyfî/sessiz "ilk departman" yoktur (K2, Codex §8 reddi),
 *    kapsam deposuna yazılmaz. `/arsiv` (klasörsüz) yönetici için S3 isteği ATMAZ; 06 ızgarası
 *    `listProgramDepartments` (S2) adlarından kurulur. `klasorId` önce `archiveFolders` yanıtıyla
 *    doğrulanır (`folderKnown`); doğrulanmadan görev/dosya okunmaz.
 *  - Koordinatör/üye: başlık seçili kapsamdan (`departmentId`); `klasorId` yalnız yanıtla
 *    doğrulanan gösterim kimliğidir (departman kimliği ya da üyede sabit `my-tasks`).
 *  - Dosyalar yöneticide yalnız `work_item_id` süzgeciyle okunur ve süzgeçteki görev
 *    `archiveTasks ∩ listProgramWorkItems(department_id)` kesişiminde olmalıdır (aksi dosyanın
 *    departmanı bilinmez).
 *  - Dönem ZIP'i S3'tür (departman başlığı zorunlu): yalnız açık seçilmiş bir klasör bağlamında
 *    (`folderId`) istenebilir; `/arsiv`'te (06) yönetici için kullanılamaz (BE-072).
 */
import type { ScopeSnapshot } from '@/shared/scope/scope'

import type { ArchiveAccess, ArchiveFolder, ArchiveTarget } from './types'

/** Üyenin sabit sanal klasör kimliği (`archiveFolders`: `my-tasks`, "Görevlerim"). */
export const MEMBER_FOLDER_ID = 'my-tasks'

const FOLDER_ID = /^[A-Za-z0-9_-]{1,128}$/

/** Rota parametresi güvenli kimlik mi (başlığa yazılmadan önce). */
export function isFolderId(value: unknown): value is string {
  return typeof value === 'string' && FOLDER_ID.test(value)
}

export interface AccessInput {
  scope: ScopeSnapshot
  /** `me.company_admin` olgusu (`standing.companyAdmin`); mercek DEĞİL. `null`: standing henüz yok. */
  admin: boolean | null
  /** Rota `/arsiv/:klasorId`; `/arsiv`'te `null`. */
  routeFolderId: string | null
}

/**
 * Rota + kapsam + yetki olgusundan arşiv erişim kipi. Kapsam hazır değilse `waiting`; S3
 * başlığı olmayan kip hiçbir S3 isteği için hedef üretmez.
 */
export function resolveArchiveAccess({ scope, admin, routeFolderId }: AccessInput): ArchiveAccess {
  // Yetki olgusu gelmeden başlık kararı verilmez (yanlış kipte S3 isteği çıkmasın).
  if (scope.programId === null || admin === null) return { mode: 'waiting' }
  if (admin) {
    if (routeFolderId === null) return { mode: 'admin-overview' }
    if (!isFolderId(routeFolderId) || routeFolderId === MEMBER_FOLDER_ID) {
      return { mode: 'invalid' }
    }
    return {
      mode: 'admin-folder',
      target: { programId: scope.programId, departmentId: routeFolderId },
      folderId: routeFolderId,
    }
  }
  if (scope.departmentId === null) return { mode: 'waiting' }
  return {
    mode: 'scoped',
    target: { programId: scope.programId, departmentId: scope.departmentId },
  }
}

/** Erişim kipinin S3 hedefi (başlıklı istek atılabilir mi); `admin-overview`/`waiting` → `null`. */
export function accessTarget(access: ArchiveAccess): ArchiveTarget | null {
  return access.mode === 'admin-folder' || access.mode === 'scoped' ? access.target : null
}

/** `klasorId` `archiveFolders` yanıtında var mı (doğrulama; yanıt yoksa `false`). */
export function folderKnown(
  folders: readonly ArchiveFolder[] | undefined,
  folderId: string | null,
): boolean {
  return folderId !== null && (folders ?? []).some((f) => f.folder_id === folderId)
}

/**
 * Sorgu anahtarının kapsamı: yöneticide departman alanı rotadaki klasörle doldurulur (aksi
 * farklı klasörlerin önbelleği karışırdı); depoya yazılmaz.
 */
export function keyScope(scope: ScopeSnapshot, target: ArchiveTarget): ScopeSnapshot {
  return { ...scope, departmentId: target.departmentId }
}

export type EntryDecision =
  { kind: 'wait' } | { kind: 'grid' } | { kind: 'redirect'; folderId: string } | { kind: 'empty' }

/**
 * `/arsiv` girişi (P40): yönetici 06 ızgarasını görür; koordinatör/üye doğrudan kendi klasörüne
 * (07) yönlenir — üyede sanal `my-tasks`, koordinatörde başlıktaki departmanın klasörü. Klasör
 * listesi gelmeden karar `wait`; liste boşsa `empty` (yönlendirilecek klasör yok).
 */
export function decideEntry(input: {
  admin: boolean
  departmentId: string | null
  folders: readonly ArchiveFolder[] | undefined
}): EntryDecision {
  if (input.admin) return { kind: 'grid' }
  if (input.folders === undefined) return { kind: 'wait' }
  const own =
    input.folders.find((f) => f.is_virtual) ??
    input.folders.find((f) => f.folder_id === input.departmentId) ??
    input.folders[0]
  return own ? { kind: 'redirect', folderId: own.folder_id } : { kind: 'empty' }
}
