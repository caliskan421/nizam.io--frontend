/**
 * Dosya listesi süzgeci → sunucu sorgusu; klasör sıralaması. Süzgeç değişince imleç sıfırlanır
 * (sorgu anahtarı süzgeci taşır, imleç `pageParam`'dadır — `api/queries.ts`). Bilinmeyen değerler
 * gönderilmez: `mime_category` yalnız bilinen kümeden, `sort` yalnız kodda belgeli değerlerden.
 */
import { mimeCategoryOf } from './mime'
import { isArchiveTag } from './tags'
import type {
  ArchiveFileFilters,
  ArchiveFileQuery,
  ArchiveFolder,
  ArchiveSort,
  FolderSortDirection,
  FolderSortField,
} from './types'

/** `archiveAttachments` sayfa boyu: sözleşmede bu uç için belgelenmemiş; README genel 50/200. */
export const ARCHIVE_PAGE_LIMIT = 50

/** `sort` izinli değerleri (kod; openapi yazmaz — eksikler yeni-8): boş = `created_at` azalan. */
export const ARCHIVE_SORTS: readonly ArchiveSort[] = ['', 'name', 'size']

export function isArchiveSort(value: unknown): value is ArchiveSort {
  return typeof value === 'string' && (ARCHIVE_SORTS as readonly string[]).includes(value)
}

/** Sorgu anahtarına giren kararlı süzgeç nesnesi (boş değerler düşer, anahtar sırası sabit). */
export function filterKey(filters: ArchiveFileFilters): Record<string, string> {
  const out: Record<string, string> = {}
  const search = filters.search?.trim()
  if (filters.tag && isArchiveTag(filters.tag)) out.tag = filters.tag
  const category = mimeCategoryOf(filters.kind)
  if (category) out.mime_category = category
  if (search) out.search = search
  if (filters.workItemId) out.work_item_id = filters.workItemId
  if (filters.uploaderId) out.uploader_id = filters.uploaderId
  if (filters.sort && isArchiveSort(filters.sort)) out.sort = filters.sort
  return out
}

/** Sunucu sorgusu: süzgeç + sayfa boyu + (varsa) imleç. */
export function toQuery(filters: ArchiveFileFilters, cursor?: string): ArchiveFileQuery {
  return {
    ...filterKey(filters),
    limit: ARCHIVE_PAGE_LIMIT,
    ...(cursor ? { cursor } : {}),
  }
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

type Sortable = Pick<ArchiveFolder, 'name'> & {
  file_count?: number
  last_uploaded_at?: string | null
}

/**
 * 06 klasör sırası (istemci): ada, dosya sayısına ya da son yüklemeye göre (BE-025). Son yükleme
 * sıralamasında yüklemesi olmayan (`null`) klasör yönden bağımsız SONDA; eşitlikte ad A→Z.
 */
export function sortFolders<T extends Sortable>(
  folders: readonly T[],
  field: FolderSortField = 'ad',
  direction: FolderSortDirection = 'artan',
): T[] {
  const sign = direction === 'artan' ? 1 : -1
  return [...folders].sort((a, b) => {
    const byName = collator.compare(a.name, b.name)
    if (field === 'ad') return sign * byName
    if (field === 'son') return byLastUpload(a, b, sign) || byName
    const diff = (a.file_count ?? 0) - (b.file_count ?? 0)
    return diff !== 0 ? sign * diff : byName
  })
}

/** Son yükleme karşılaştırması: yüklemesiz (`null`) klasör yönden bağımsız sonda. */
function byLastUpload(a: Sortable, b: Sortable, sign: number): number {
  const left = a.last_uploaded_at ?? null
  const right = b.last_uploaded_at ?? null
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1
  return sign * (Date.parse(left) - Date.parse(right))
}
