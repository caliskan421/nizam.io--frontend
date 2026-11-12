/**
 * 06 klasör kartları (veri). Yönetici (P33): `listProgramDepartments` (S2; 03 ile AYNI
 * önbellek girdisi) adlarından, sayılar statik (`null`; BE-072/BE-025) — S3 isteği yok.
 * Koordinatör/üye: `archiveFolders` (bağlamın doğrulayan çağrısı) sayılarıyla (P40: 06 atlanır,
 * kart yine de ağaç düzey 0 için kurulabilir). `truncated`: >200 bağda departman listesi kesildi
 * (`X-Result-Truncated`) — ızgara eksik olabilir, ekran söyler.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { isListTruncated } from '@/shared/http/truncation'

import { adminFolderCards, archiveFolderCards } from '../model/folder-cards'
import type { ArchiveContext } from '../model/context'
import type { FolderSortDirection, FolderSortField } from '../model/types'

export function useFolderCards(
  context: ArchiveContext,
  field: MaybeRefOrGetter<FolderSortField> = 'ad',
  direction: MaybeRefOrGetter<FolderSortDirection> = 'artan',
) {
  const departments = useProgramDepartments()
  const admin = computed(() => context.admin.value === true)
  const cards = computed(() =>
    admin.value
      ? adminFolderCards(
          departments.query.data.value?.departments,
          toValue(field),
          toValue(direction),
        )
      : archiveFolderCards(context.folderList.value, toValue(field), toValue(direction)),
  )
  const loading = computed(() =>
    admin.value ? departments.query.isPending.value : context.folders.isPending.value,
  )
  const error = computed(() =>
    admin.value ? departments.query.isError.value : context.folders.isError.value,
  )
  const truncated = computed(() => admin.value && isListTruncated(departments.query.data.value))
  return { cards, loading, error, truncated }
}
