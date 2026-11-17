/**
 * Açık görünümün silinen kayıt listesi (12; P42/P43; v0.26): okuyuculardan YALNIZ açık görünümünki
 * etkindir (fan-out yok). Tek türlü görünümler tipli listesini (zengin alan), `Tümü` ve `Not ve
 * gündem` tek `listDeletedRecords` sorgusunu okur; satırları istemci birleştirmez ve sıralamaz. Süzgeç/sıra sunucuya gider (`query`,
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
import { useDeletedFiles, useDeletedSubtasks } from '../api/queries-child'
import { useDeletedRecords } from '../api/unified'
import type { ListQuery } from '../model/filters'
import { isUnifiedView, VIEW_KINDS, type DeletedKind } from '../model/kinds'
import { accountRow, departmentRow, meetingRow, taskRow, type RowContext } from '../model/rows'
import { fileRow, recordRow, subtaskRow } from '../model/rows-child'
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

type TypedView = Exclude<DeletedKind, 'tumu' | 'notgundem'>
type Queries = {
  gorev: ReturnType<typeof useDeletedWorkItems>
  altgorev: ReturnType<typeof useDeletedSubtasks>
  dosya: ReturnType<typeof useDeletedFiles>
  toplanti: ReturnType<typeof useDeletedMeetings>
  koordinatorluk: ReturnType<typeof useDeletedDepartments>
  kullanici: ReturnType<typeof useDeletedAccounts>
  birlesik: ReturnType<typeof useDeletedRecords>
}

const pagesOf = <T>(data: { pages: T[] } | undefined) => data?.pages ?? []

/** Görünümün okuyucusu: birleşik görünümler tek sorguyu paylaşır. */
const sourceOf = (kind: DeletedKind): keyof Queries =>
  isUnifiedView(kind) ? 'birlesik' : (kind as TypedView)

function rowsOf(kind: DeletedKind, q: Queries, ctx: RowContext): DeletedRow[] {
  switch (kind) {
    case 'toplanti':
      return pagesOf(q.toplanti.data.value).flatMap((p) => p.items.map((i) => meetingRow(i, ctx)))
    case 'koordinatorluk':
      return pagesOf(q.koordinatorluk.data.value).flatMap((p) => p.departments.map(departmentRow))
    case 'kullanici':
      return pagesOf(q.kullanici.data.value).flatMap((p) => p.accounts.map(accountRow))
    case 'altgorev':
      return pagesOf(q.altgorev.data.value).flatMap((p) => p.items.map(subtaskRow))
    case 'dosya':
      return pagesOf(q.dosya.data.value).flatMap((p) => p.items.map(fileRow))
    case 'tumu':
    case 'notgundem':
      return pagesOf(q.birlesik.data.value).flatMap((p) => p.items.map(recordRow))
    default:
      return pagesOf(q.gorev.data.value).flatMap((p) => p.items.map((i) => taskRow(i, ctx)))
  }
}

/** Süzülmüş küme boyu: son yüklenen sayfanın zarfı (imleçten bağımsız). */
function totalOf(kind: DeletedKind, q: Queries): number | null {
  const data = q[sourceOf(kind)].data.value as { pages: Array<{ total?: number }> } | undefined
  const last = pagesOf(data).at(-1)
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
  const on = (source: keyof Queries) => () => toValue(enabled) && sourceOf(toValue(kind)) === source
  // Birleşik listenin sorgusu: sıra yoktur (`sort`/`order` gönderilmez); `tumu` tür kısıtı taşımaz.
  const unified = computed(() => {
    const rest = { ...toValue(query) }
    delete rest.sort
    delete rest.order
    const view = toValue(kind)
    return { ...rest, ...(view === 'tumu' ? {} : { kinds: VIEW_KINDS[view] }) }
  })
  const queries: Queries = {
    gorev: useDeletedWorkItems(query, on('gorev')),
    altgorev: useDeletedSubtasks(query, on('altgorev')),
    dosya: useDeletedFiles(query, on('dosya')),
    toplanti: useDeletedMeetings(query, on('toplanti')),
    koordinatorluk: useDeletedDepartments(query, on('koordinatorluk')),
    kullanici: useDeletedAccounts(query, on('kullanici')),
    birlesik: useDeletedRecords(unified, on('birlesik')),
  }
  const timezone = useDeletedTimezone()
  const context = useDepartmentNames(timezone)

  const paged = computed<PagedQuery>(() => queries[sourceOf(toValue(kind))])
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
