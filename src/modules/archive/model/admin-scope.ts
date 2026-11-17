/**
 * Yönetici kapsamı (P33 → F8 BE-072, RECORDS-K39, ADR-0044).
 *
 * Yönetici (`company_admin` OLGUSU, mercek değil — P1, KESİN 6) arşivi program geneli S2 uçlarından
 * okur (`programArchive*`; yalnız program başlığı, isteğe bağlı `department_id` süzgeci); S3
 * departman başlığı okumada kullanılmaz. Karar:
 *
 *  - `/arsiv` (06): `programArchiveFolders` (bütün koordinatörlük kartları, tek istek). Klasör
 *    kimliği = departman kimliğidir (kod kuralı); rotadaki `klasorId` önce bu yanıtla doğrulanır
 *    (`folderKnown`), doğrulanmadan görev/dosya okunmaz.
 *  - `/arsiv/:klasorId` (07): görevler ve dosyalar `department_id=klasorId` süzgeciyle S2'den.
 *  - Dosya/görev İŞLEMLERİ (indir, ad, etiket, sil, yükle) S3'tür: başlık satırın / görev
 *    seçeneğinin `department_id`'sidir (rotadaki klasör kimliği DEĞİL; model dışında çağıran verir).
 *    Klasör ZIP'i yöneticide klasör kimliğiyle (`target`) S3 yoluyla alınır.
 *  - Koordinatör/üye: S3, başlık seçili kapsamdan (`departmentId`); `klasorId` yalnız yanıtla
 *    doğrulanan gösterim kimliğidir (departman kimliği ya da üyede sabit `my-tasks`).
 *  - Keyfî/sessiz "ilk departman" yoktur (K2); kapsam deposuna yazılmaz.
 */
import type { ScopeSnapshot } from '@/shared/scope/scope'

import type {
  ArchiveAccess,
  ArchiveFolder,
  ArchiveSource,
  ArchiveTarget,
  ProgramArchiveSource,
} from './types'
import { isProgramSource } from './types'

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

/** Yönetici S2 kaynağı: yalnız program başlığı; `departmentId` isteğe bağlı sorgu süzgeci. */
export function programSource(
  programId: string,
  departmentId: string | null,
): ProgramArchiveSource {
  return { programId, departmentId, program: true }
}

/**
 * Görev/dosya/yükleyen okumalarının kaynağı: yöneticide S2 (`/arsiv` bütün program, klasörde
 * `department_id` süzgeci), koordinatör/üyede S3 hedefi. `waiting`/`invalid` → `null` (istek yok).
 */
export function readSource(access: ArchiveAccess, programId: string | null): ArchiveSource | null {
  if (programId === null) return null
  if (access.mode === 'admin-overview') return programSource(programId, null)
  if (access.mode === 'admin-folder') return programSource(programId, access.folderId)
  return access.mode === 'scoped' ? access.target : null
}

/**
 * Klasör özetinin kaynağı: yöneticide süzgeçsiz S2 (kartların hepsi tek istekte; `/arsiv` ve
 * `/arsiv/:klasorId` aynı önbellek girdisini paylaşır), koordinatör/üyede S3.
 */
export function folderSource(
  access: ArchiveAccess,
  programId: string | null,
): ArchiveSource | null {
  if (programId === null) return null
  if (access.mode === 'admin-overview' || access.mode === 'admin-folder') {
    return programSource(programId, null)
  }
  return access.mode === 'scoped' ? access.target : null
}

/** `klasorId` klasör özeti yanıtında var mı (doğrulama; yanıt yoksa `false`). */
export function folderKnown(
  folders: readonly ArchiveFolder[] | undefined,
  folderId: string | null,
): boolean {
  return folderId !== null && (folders ?? []).some((f) => f.folder_id === folderId)
}

/**
 * Sorgu anahtarının kapsamı: departman alanı kaynağın süzgeciyle doldurulur (aksi farklı
 * klasörlerin önbelleği karışırdı); depoya yazılmaz.
 */
export function keyScope(scope: ScopeSnapshot, source: ArchiveSource): ScopeSnapshot {
  return { ...scope, departmentId: source.departmentId }
}

/** S2 ve S3 yanıtları aynı anahtarda buluşmasın: S2 kaynağı süzgece işaret koyar. */
export function sourceFilters<F extends Record<string, unknown>>(
  source: ArchiveSource,
  filters: F,
): F & { source?: 'program' } {
  return isProgramSource(source) ? { ...filters, source: 'program' } : filters
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

/**
 * Dosya taşıma hedef görevlerinin okuma kaynağı (`include_empty=true` seçenekleri; RECORDS-K46).
 * Yönetici (`company_admin` olgusu) programın bütün departmanlarındaki görevleri tek S2 okumasıyla
 * görür (süzgeçsiz; N'li departman gezintisi yok). Koordinatör/üye YALNIZ seçilen TEK yetkili
 * departmanın S3 listesini okur (`departmentId`: yerel hedef seçimi; yetkisi doğrulanmış olmalı,
 * `null` → istek yok). Kapsam deposuna YAZILMAZ; hedef departman seçmek global kapsamı değiştirmez.
 */
export function moveTargetSource(
  scope: ScopeSnapshot,
  admin: boolean | null,
  departmentId: string | null,
): ArchiveSource | null {
  if (scope.programId === null || admin === null) return null
  if (admin) return programSource(scope.programId, null)
  if (departmentId === null) return null
  return { programId: scope.programId, departmentId }
}
