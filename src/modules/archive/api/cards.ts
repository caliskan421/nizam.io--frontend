/**
 * 06 klasör kartları (veri): `archiveFolders` (koordinatör/üye) ya da `programArchiveFolders`
 * (yönetici, S2; BE-072) — bağlamın doğrulayan çağrısı aynı yanıtla. Sayılar sunucudandır;
 * departman adı listesi (`listProgramDepartments`) artık kullanılmaz.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { archiveFolderCards } from '../model/folder-cards'
import type { ArchiveContext } from '../model/context'
import type { FolderSortDirection, FolderSortField } from '../model/types'

export function useFolderCards(
  context: ArchiveContext,
  field: MaybeRefOrGetter<FolderSortField> = 'ad',
  direction: MaybeRefOrGetter<FolderSortDirection> = 'artan',
) {
  const cards = computed(() =>
    archiveFolderCards(context.folderList.value, toValue(field), toValue(direction)),
  )
  const loading = computed(() => context.folders.isPending.value)
  const error = computed(() => context.folders.isError.value)
  return { cards, loading, error }
}
