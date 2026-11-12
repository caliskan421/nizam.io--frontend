/**
 * Arşiv bağlamı (P33): rota + kapsam + yetki olgusundan S3 hedefi ve klasör doğrulaması.
 *
 *  - Yönetici (`company_admin` olgusu): S3 departman başlığı YALNIZ rotadaki `klasorId`; `/arsiv`
 *    S3 isteği atmaz (06 ızgarası `listProgramDepartments` adlarından). Kapsam deposuna YAZILMAZ.
 *  - Koordinatör/üye: başlık seçili kapsamdan; `klasorId` yanıtla doğrulanan gösterim kimliği.
 *  - `klasorId` `archiveFolders` yanıtıyla doğrulanır; doğrulanmadan görev/dosya okuması başlamaz
 *    (yönetici). `folderMissing` → "klasör bulunamadı / erişim yok".
 * Standing (yetki olgusu) gelmeden hedef yoktur: yanlış kipte S3 isteği çıkmaz.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { accessTarget, decideEntry, folderKnown, resolveArchiveAccess } from '../model/admin-scope'
import { useArchiveFolders } from './queries'

export function useArchiveContext(routeFolderId: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const admin = computed(() => (standing.value === null ? null : standing.value.companyAdmin))
  const access = computed(() =>
    resolveArchiveAccess({
      scope: store.snapshot,
      admin: admin.value,
      routeFolderId: toValue(routeFolderId),
    }),
  )
  const target = computed(() => accessTarget(access.value))
  const folders = useArchiveFolders(target)
  const folderList = computed(() => folders.data.value?.folders)
  const folderOk = computed(() => folderKnown(folderList.value, toValue(routeFolderId)))
  const folderMissing = computed(() => {
    const id = toValue(routeFolderId)
    if (id === null) return false
    if (access.value.mode === 'invalid') return true
    const error = folders.error.value
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return true
    return folderList.value !== undefined && !folderOk.value
  })
  /** Görev/dosya okumaları açılabilir mi: yöneticide klasör doğrulandıktan sonra. */
  const readsOpen = computed(() => {
    if (access.value.mode === 'admin-folder') return folderOk.value
    return access.value.mode === 'scoped'
  })
  const entry = computed(() =>
    decideEntry({
      admin: admin.value === true,
      departmentId: store.snapshot.departmentId,
      folders: folderList.value,
    }),
  )
  return {
    standing,
    admin,
    access,
    target,
    folders,
    folderList,
    folderOk,
    folderMissing,
    readsOpen,
    entry,
  }
}
