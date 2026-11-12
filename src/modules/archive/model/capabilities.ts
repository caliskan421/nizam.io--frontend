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
 *  - Etiket değiştir / taşı / etiket oluştur / geri yükle: uç yok → devre dışı (`model/stubs.ts`).
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
  return {
    /** Görev seçilmeden "Dosya yükle" düğmesi görünür mü (hedef görev pencerede seçilir). */
    canOpenUpload: standing !== null && programId !== null,
    upload(departmentId: string, assigned = true): boolean {
      const f = facts(departmentId)
      return f.companyAdmin || f.coordinator || (f.member && assigned)
    },
    rename(file: ArchiveFileFacts): boolean {
      const f = facts(file.departmentId)
      return f.companyAdmin || f.coordinator || (isUploader(file) && hasTeamRow(file.departmentId))
    },
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

export type ArchiveCapabilities = ReturnType<typeof archiveCapabilities>
