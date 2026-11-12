/**
 * 07 URL durumu (K10; `06-arsiv/mekanizma.md` §3). Ad ve değerler rota kataloğuyla
 * (`archive.folder.query`: `gorev`, `etiket`, `gorunum`, `dosya`, `q`) aynıdır
 * (`ARCHIVE_FOLDER_QUERY_KEYS`). Geçersiz değer sessizce düşer; varsayılanlar (ızgara, boş arama)
 * yazılmaz. Görünüm hiçbir yerde kalıcı saklanmaz (K2: depolama istisnası yalnız kapsam + tema).
 */
import { isFolderId } from '../../model/admin-scope'
import { isArchiveTag } from '../../model/tags'
import type { ArchiveTag, ArchiveView } from '../../model/types'

export interface FolderUrlState {
  /** Görev klasörü süzgeci (`gorev`). */
  task: string | null
  tag: ArchiveTag | null
  view: ArchiveView
  /** Önizlenen dosya (`dosya`). */
  file: string | null
  q: string
}

export const DEFAULT_FOLDER_STATE: FolderUrlState = {
  task: null,
  tag: null,
  view: 'izgara',
  file: null,
  q: '',
}

const SEARCH_MAX = 200

function first(raw: unknown): string | undefined {
  const value = Array.isArray(raw)
    ? (raw as unknown[]).find((v) => typeof v === 'string' && v !== '')
    : raw
  return typeof value === 'string' && value !== '' ? value : undefined
}

function idValue(raw: unknown): string | null {
  const value = first(raw)
  return isFolderId(value) ? value : null
}

export function parseFolderQuery(query: Readonly<Record<string, unknown>>): FolderUrlState {
  const tag = first(query.etiket)
  return {
    task: idValue(query.gorev),
    tag: isArchiveTag(tag) ? tag : null,
    view: first(query.gorunum) === 'liste' ? 'liste' : 'izgara',
    file: idValue(query.dosya),
    q: (first(query.q) ?? '').slice(0, SEARCH_MAX),
  }
}

/** Durumdan sorgu dizgisi (varsayılanlar yazılmaz). */
export function folderQuery(state: FolderUrlState): Record<string, string> {
  const out: Record<string, string> = {}
  if (state.task) out.gorev = state.task
  if (state.tag) out.etiket = state.tag
  if (state.view === 'liste') out.gorunum = 'liste'
  if (state.file) out.dosya = state.file
  const q = state.q.trim()
  if (q) out.q = q
  return out
}
