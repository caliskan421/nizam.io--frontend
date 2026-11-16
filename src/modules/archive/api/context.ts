/**
 * Arşiv bağlamı (P33 → F8 BE-072): rota + kapsam + yetki olgusundan okuma kaynağı ve klasör
 * doğrulaması.
 *
 *  - Yönetici (`company_admin` olgusu): okumalar S2 program arşivinden (`programArchive*`); klasör
 *    özeti süzgeçsizdir (06 ve 07 aynı önbellek girdisi), görev/dosya okumaları rotadaki `klasorId`
 *    ile `department_id` süzülür. Yazma/indirme başlığı satırın `department_id`'sidir (burada değil).
 *    Kapsam deposuna YAZILMAZ.
 *  - Koordinatör/üye: S3, başlık seçili kapsamdan; `klasorId` yanıtla doğrulanan gösterim kimliği.
 *  - `klasorId` klasör özeti yanıtıyla doğrulanır; doğrulanmadan görev/dosya okuması başlamaz
 *    (yönetici). `folderMissing` → "klasör bulunamadı / erişim yok".
 * Standing (yetki olgusu) gelmeden kaynak yoktur: yanlış kipte istek çıkmaz.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import {
  accessTarget,
  decideEntry,
  folderKnown,
  folderSource,
  readSource,
  resolveArchiveAccess,
} from '../model/admin-scope'
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
  /** S3 başlığı (yalnız klasör ZIP'i gibi klasör-başlıklı eylemler için); `/arsiv` yöneticisinde yok. */
  const target = computed(() => accessTarget(access.value))
  /** Görev/dosya/yükleyen okumalarının kaynağı (yönetici S2, K/Ü S3). */
  const source = computed(() => readSource(access.value, store.snapshot.programId))
  const folders = useArchiveFolders(() => folderSource(access.value, store.snapshot.programId))
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
    source,
    folders,
    folderList,
    folderOk,
    folderMissing,
    readsOpen,
    entry,
  }
}
