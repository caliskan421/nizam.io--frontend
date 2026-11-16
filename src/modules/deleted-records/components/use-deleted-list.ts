/**
 * Açık sekmenin silinen kayıt listesi (12; P42/P43): dört okuyucudan YALNIZ açık türünkü
 * etkindir (fan-out yok, birleşik liste yok; GAP-234). Süzgeç/sıra sunucuya gider (`query`,
 * BE-117); satırlar liste öğelerinden türetilir (`model/rows`), istemci süzmez. `total` süzgece
 * uyan kayıt sayısıdır (imleçten bağımsız). Koordinatörlük adı program sözlüğünden
 * (`listProgramDepartments`, kabukla ortak anahtar), yoksa önbellekte yüklü silinmiş departman
 * listelerinden (ek istek yok; yalnız okunur, abonelik yok), yoksa "Bilinmeyen koordinatörlük".
 */
import { useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'

import {
  useDeletedAccounts,
  useDeletedDepartments,
  useDeletedMeetings,
  useDeletedWorkItems,
} from '../api/queries'
import type { ListQuery } from '../model/filters'
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
    const cached = client.getQueriesData<{ pages: Array<{ departments: DeletedDepartment[] }> }>({
      queryKey: queryKeys.deletedDepartments.all(scope.snapshot),
    })
    for (const [, data] of cached) {
      for (const row of data?.pages.flatMap((page) => page.departments) ?? []) {
        names.set(row.department_id, row.name)
      }
    }
    for (const [id, d] of dictionary.byId.value) names.set(id, d.display_name)
    return { timezone: timezone.value, departmentName: (id) => names.get(id) ?? null }
  })
}

type Queries = {
  gorev: ReturnType<typeof useDeletedWorkItems>
  toplanti: ReturnType<typeof useDeletedMeetings>
  koordinatorluk: ReturnType<typeof useDeletedDepartments>
  kullanici: ReturnType<typeof useDeletedAccounts>
}

const pagesOf = <T>(data: { pages: T[] } | undefined) => data?.pages ?? []

function rowsOf(kind: DeletedKind, q: Queries, ctx: RowContext): DeletedRow[] {
  switch (kind) {
    case 'toplanti':
      return pagesOf(q.toplanti.data.value).flatMap((p) => p.items.map((i) => meetingRow(i, ctx)))
    case 'koordinatorluk':
      return pagesOf(q.koordinatorluk.data.value).flatMap((p) => p.departments.map(departmentRow))
    case 'kullanici':
      return pagesOf(q.kullanici.data.value).flatMap((p) => p.accounts.map(accountRow))
    default:
      return pagesOf(q.gorev.data.value).flatMap((p) => p.items.map((i) => taskRow(i, ctx)))
  }
}

/** Süzülmüş küme boyu: son yüklenen sayfanın zarfı (imleçten bağımsız). */
function totalOf(kind: DeletedKind, q: Queries): number | null {
  const last = pagesOf(q[kind].data.value as { pages: Array<{ total?: number }> } | undefined).at(
    -1,
  )
  return typeof last?.total === 'number' ? last.total : null
}

/** Kurulum saat dilimi (gün sınırı ve tarih biçimleri; profil yoksa varsayılan). */
export function useDeletedTimezone() {
  const instance = useInstanceStore()
  return computed(() => instance.profile?.timezone ?? DEFAULT_TIMEZONE)
}

export function useDeletedList(
  kind: MaybeRefOrGetter<DeletedKind>,
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const on = (wanted: DeletedKind) => () => toValue(enabled) && toValue(kind) === wanted
  const tasks = useDeletedWorkItems(query, on('gorev'))
  const meetings = useDeletedMeetings(query, on('toplanti'))
  const departments = useDeletedDepartments(query, on('koordinatorluk'))
  const accounts = useDeletedAccounts(query, on('kullanici'))
  const timezone = useDeletedTimezone()
  const context = useDepartmentNames(timezone)

  const queries = {
    gorev: tasks,
    toplanti: meetings,
    koordinatorluk: departments,
    kullanici: accounts,
  }
  const paged = computed<PagedQuery>(() => queries[toValue(kind)])
  const rows = computed<DeletedRow[]>(() => rowsOf(toValue(kind), queries, context.value))
  /** Süzgece uyan kayıt sayısı (son yüklenen sayfanın zarfı; toplantıda alan isteğe bağlıdır). */
  const total = computed(() => totalOf(toValue(kind), queries))
  const error = computed(() =>
    paged.value.isError.value && rows.value.length === 0
      ? toApiError(paged.value.error.value)
      : null,
  )

  return {
    rows,
    total,
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
