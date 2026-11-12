/**
 * Açık sekmenin silinen kayıt listesi (12; P42/P43): dört okuyucudan YALNIZ açık türünkü
 * etkindir (fan-out yok, birleşik liste yok). Satırlar liste öğelerinden türetilir (`model/rows`);
 * koordinatörlük adı program sözlüğünden (`listProgramDepartments`, kabukla ortak anahtar), yoksa
 * önbellekte yüklü silinmiş departman listesinden (ek istek yok; yalnız okunur, abonelik yok),
 * yoksa "Bilinmeyen koordinatörlük".
 */
import { useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

import { useDeletedMeetings } from '@/modules/meetings/public'
import { useDeletedDepartments } from '@/modules/organization/public'
import { useProgramDepartments } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'

import { useDeletedAccounts, useDeletedWorkItems } from '../api/queries'
import type { DeletedKind } from '../model/kinds'
import { accountRow, departmentRow, meetingRow, taskRow, type RowContext } from '../model/rows'
import type { DeletedDepartment, DeletedRow } from '../model/types'

const DEFAULT_TIMEZONE = 'Europe/Istanbul'

/** Sonsuz sorgu sonucundan listenin ihtiyaç duyduğu ortak yüz (dört okuyucu da uyar). */
interface PagedQuery {
  hasNextPage: Ref<boolean>
  isFetchingNextPage: Ref<boolean>
  isPending: Ref<boolean>
  isError: Ref<boolean>
  error: Ref<unknown>
  refetch: () => unknown
  fetchNextPage: () => unknown
}

/** Koordinatörlük adı çözücüsü: program sözlüğü, yoksa önbellekteki silinmiş departmanlar. */
function useDepartmentNames(timezone: Ref<string>) {
  const client = useQueryClient()
  const scope = useScopeStore()
  const dictionary = useProgramDepartments()
  return computed<RowContext>(() => {
    const names = new Map<string, string>()
    const cached = client.getQueryData<{ pages: Array<{ departments: DeletedDepartment[] }> }>(
      queryKeys.deletedDepartments.all(scope.snapshot),
    )
    for (const row of cached?.pages.flatMap((page) => page.departments) ?? []) {
      names.set(row.department_id, row.name)
    }
    for (const [id, d] of dictionary.byId.value) names.set(id, d.display_name)
    return { timezone: timezone.value, departmentName: (id) => names.get(id) ?? null }
  })
}

export function useDeletedList(
  kind: MaybeRefOrGetter<DeletedKind>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const on = (wanted: DeletedKind) => () => toValue(enabled) && toValue(kind) === wanted
  const tasks = useDeletedWorkItems(on('gorev'))
  const meetings = useDeletedMeetings(on('toplanti'))
  const departments = useDeletedDepartments(on('koordinatorluk'))
  const accounts = useDeletedAccounts(on('kullanici'))
  const instance = useInstanceStore()
  const timezone = computed(() => instance.profile?.timezone ?? DEFAULT_TIMEZONE)
  const context = useDepartmentNames(timezone)

  const pages = <T>(data: { pages: T[] } | undefined) => data?.pages ?? []
  const paged = computed<PagedQuery>(() => {
    const active: Record<DeletedKind, PagedQuery> = {
      gorev: tasks,
      toplanti: meetings,
      koordinatorluk: departments.query,
      kullanici: accounts,
    }
    return active[toValue(kind)]
  })
  const rows = computed<DeletedRow[]>(() => {
    const ctx = context.value
    switch (toValue(kind)) {
      case 'toplanti':
        return pages(meetings.data.value).flatMap((p) => p.items.map((i) => meetingRow(i, ctx)))
      case 'koordinatorluk':
        return departments.departments.value.map(departmentRow)
      case 'kullanici':
        return pages(accounts.data.value).flatMap((p) => p.accounts.map(accountRow))
      default:
        return pages(tasks.data.value).flatMap((p) => p.items.map((i) => taskRow(i, ctx)))
    }
  })
  const error = computed(() =>
    paged.value.isError.value && rows.value.length === 0
      ? toApiError(paged.value.error.value)
      : null,
  )

  return {
    rows,
    timezone,
    error,
    departmentName: (id: string) => context.value.departmentName(id),
    hasMore: computed(() => paged.value.hasNextPage.value === true),
    loadingMore: computed(() => paged.value.isFetchingNextPage.value),
    /** İlk yükleme sürüyor (henüz hiç sayfa yok, hata da yok). */
    loading: computed(() => paged.value.isPending.value && !paged.value.isError.value),
    /** Sonraki sayfa yüklenemedi (satırlar korunur). */
    moreFailed: computed(() => paged.value.isError.value && rows.value.length > 0),
    refetch: async () => {
      await paged.value.refetch()
    },
    fetchMore: async () => {
      await paged.value.fetchNextPage()
    },
  }
}
