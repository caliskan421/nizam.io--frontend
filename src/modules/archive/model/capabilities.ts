/**
 * Arşiv eylem görünürlüğü (K1; `06-arsiv/backend.md` §3). Saf fonksiyonlar; girdi yalnız sunucu
 * OLGULARIDIR (`me.company_admin`, kapsamdaki ekip satırı, göreve atanmış olma, dosyayı yükleyen
 * olma). Mercek girdi değildir (P1). Yetkisiz eylem GİZLENİR; gizleme güvenlik değildir, sunucu
 * her istekte denetler, 403/404 gerçek sonuçtur. Rol dizesi karşılaştırması yalnız burada ve
 * `shared/scope/standing*` içindedir.
 *
 * Kaynak (pin v0.15.0-api): `istemci-akislari.md` §4 dosya satırları, RECORDS-K01/K02/K10/K18/K24
 * ve ADR-0030 (şirket yöneticisi ekip/atama aranmadan yükler; yükleyen yönetici ekip satırı
 * olmadan siler).
 *  - Yükle: ŞY ∨ görevin departmanında K ∨ (görevin departmanında Ü ∧ göreve atanmış). Arşivdeki
 *    her görev üyeye atanmıştır (K18) → arşiv görev listesinden `assigned` varsayılan `true`.
 *  - Adlandır: ŞY ∨ dosyanın departmanında K ∨ (yükleyen ∧ o departmanda ekip satırı).
 *  - Sil: yalnız yükleyen ∧ (ŞY ∨ o departmanda ekip satırı); yönetici/koordinatör başkasınınkini silemez.
 *  - Klasör ZIP'i: ŞY her klasör; K yalnız kendi (departman) klasörü; Ü yalnız sanal klasör.
 *  - Dönem ZIP'i: yalnız ŞY (RECORDS-K24).
 *  - İndir: listede görünen her dosya (yetki tüketimde hedefte).
 *  - Etiketi değiştir (`retagFile`, BE-074): yeniden adlandırmayla aynı yetki (ŞY ∨ K ∨ yükleyen ∧
 *    ekip satırı; sunucuda aynı kural, 403 gerçek sonuçtur).
 *  - Başka göreve taşı (`moveFile`, RECORDS-K46): kaynakta yeniden adlandırmayla aynı yetki; hedef
 *    adayları ayrıca hedef departmanda `upload` ile süzülür (sunucu ikisini de denetler).
 *  - Etiket oluşturma: uç yok → devre dışı (`model/stubs.ts`).
 */
import { scopeFacts, type Standing } from '@/shared/scope/standing-facts'

import type { ArchiveFolder } from './types'

export interface ArchiveFileFacts {
  /** Dosyanın (görevinin) departmanı = isteğin S3 başlığı. */
  departmentId: string
  uploadedByAccountId: string
}

export type ArchiveFolderFacts = Pick<ArchiveFolder, 'folder_id' | 'is_virtual'>

export const ARCHIVE_CAPABILITY_ACTIONS = [
  'upload',
  'rename',
  'retag',
  'move',
  'delete',
  'download',
  'folderZip',
  'periodZip',
] as const
export type ArchiveCapabilityAction = (typeof ARCHIVE_CAPABILITY_ACTIONS)[number]

/** Her eylemin kaynağı (tablo testi ve denetim izi için). */
export const ARCHIVE_CAPABILITY_SOURCES: Readonly<Record<ArchiveCapabilityAction, string>> = {
  upload: 'istemci-akislari §4 "Dosya yükle" + RECORDS-K01/ADR-0030: ŞY ∨ K ∨ atanmış Ü',
  rename:
    'istemci-akislari §4 "Dosya adını değiştir" + RECORDS-K10: ŞY ∨ K ∨ (yükleyen ∧ ekip satırı)',
  retag: 'RECORDS-K10 (retagFile): yeniden adlandırmayla aynı — ŞY ∨ K ∨ (yükleyen ∧ ekip satırı)',
  move: 'RECORDS-K46 (moveFile): kaynakta yeniden adlandırma yetkisi — ŞY ∨ K ∨ (yükleyen ∧ ekip satırı); hedefte yükleme ayrıca',
  delete: 'istemci-akislari §4 "Dosya sil" + RECORDS-K10: yalnız yükleyen ∧ (ŞY ∨ ekip satırı)',
  download: 'istemci-akislari §3 + README §6: listede görünen her dosya (yetki hedefte)',
  folderZip: 'RECORDS-K24/K18: ŞY her klasör; K kendi; Ü sanal klasör',
  periodZip: 'RECORDS-K24: yalnız ŞY',
}

export function archiveCapabilities(standing: Standing | null, programId: string | null) {
  const facts = (departmentId: string | null) => scopeFacts(standing, programId, departmentId)
  const me = standing?.accountId ?? null
  const isUploader = (file: ArchiveFileFacts) => me !== null && file.uploadedByAccountId === me
  const hasTeamRow = (departmentId: string) => {
    const f = facts(departmentId)
    return f.coordinator || f.member
  }
  const canRename = (file: ArchiveFileFacts): boolean => {
    const f = facts(file.departmentId)
    return f.companyAdmin || f.coordinator || (isUploader(file) && hasTeamRow(file.departmentId))
  }
  return {
    /** Görev seçilmeden "Dosya yükle" düğmesi görünür mü (hedef görev pencerede seçilir). */
    canOpenUpload: standing !== null && programId !== null,
    upload(departmentId: string, assigned = true): boolean {
      const f = facts(departmentId)
      return f.companyAdmin || f.coordinator || (f.member && assigned)
    },
    rename: canRename,
    /** Etiketi değiştir: yetki yeniden adlandırmayla aynıdır (RECORDS-K10; `retagFile`). */
    retag: canRename,
    /** Başka göreve taşı: kaynak tarafı yeniden adlandırmayla aynıdır (RECORDS-K46). */
    move: canRename,
    delete(file: ArchiveFileFacts): boolean {
      if (!isUploader(file)) return false
      return facts(file.departmentId).companyAdmin || hasTeamRow(file.departmentId)
    },
    download(): boolean {
      return standing !== null
    },
    folderZip(folder: ArchiveFolderFacts): boolean {
      if (standing === null) return false
      if (standing.companyAdmin) return true
      if (folder.is_virtual) return hasAnyMemberRow(standing, programId)
      return facts(folder.folder_id).coordinator
    },
    periodZip(): boolean {
      return standing?.companyAdmin === true
    },
  }
}

/** Üye sanal klasörü: seçili programda herhangi bir üye satırı (klasör kimliği `my-tasks`). */
function hasAnyMemberRow(standing: Standing, programId: string | null): boolean {
  return standing.rows.some((row) => row.programId === programId && row.role === 'member')
}

export interface MoveTargetDepartment {
  departmentId: string
  displayName: string
}

/**
 * Taşıma hedefi olabilecek departmanlar (RECORDS-K46): seçili programdaki ekip satırlarından,
 * hedefte yükleme yetkisi olanlar — yetki tek yüklemden (`upload`) gelir. Bilinmeyen ya da başka
 * programın departmanı aday olmaz. Yönetici için boştur (program geneli görev listesi okunur).
 */
export function moveTargetDepartments(
  standing: Standing | null,
  programId: string | null,
): MoveTargetDepartment[] {
  if (standing === null || programId === null || standing.companyAdmin) return []
  const caps = archiveCapabilities(standing, programId)
  const found = new Map<string, MoveTargetDepartment>()
  for (const row of standing.rows) {
    if (row.programId !== programId || found.has(row.departmentId)) continue
    if (caps.upload(row.departmentId)) {
      found.set(row.departmentId, { departmentId: row.departmentId, displayName: row.displayName })
    }
  }
  return [...found.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr'))
}

export type ArchiveCapabilities = ReturnType<typeof archiveCapabilities>
