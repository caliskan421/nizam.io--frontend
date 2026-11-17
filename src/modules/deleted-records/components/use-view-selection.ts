/**
 * Silinen kayıtlar görünümünün seçili satırı ve ebeveyne gidiş (URL `kayit`). Tek türlü görünümde
 * `kayit` düz kimliktir (eski bağlantılar çalışır), birleşik görünümde `kind:id` (aynı kimlik
 * farklı türlerde çakışmaz). Ebeveyne gidişte çocuğun arama/tarih/silen/koordinatörlük süzgeçleri
 * taşınmaz ki ebeveyn yanlış süzgeçte kaybolmasın; kayıt yüklenen sayfalarda yoksa panel bunu
 * dürüstçe söyler (kimlik arama ucu yoktur).
 */
import { computed, type ComputedRef, type Ref } from 'vue'

import { DEFAULT_SORT, type DeletedFilters, type DeletedSort } from '../model/filters'
import { DEFAULT_RANGE, singleKindOf } from '../model/kinds'
import { findSelected, selectedParam } from '../model/lifecycle'
import type { DeletedRow } from '../model/types'

export interface ViewSelectionOptions {
  filters: ComputedRef<DeletedFilters>
  rows: () => readonly DeletedRow[]
  update: (patch: Partial<DeletedFilters>) => void
  navigate: (next: DeletedFilters) => void
  sort: Ref<DeletedSort>
}

export function useViewSelection(options: ViewSelectionOptions) {
  const single = computed(() => singleKindOf(options.filters.value.kind))
  const selected = computed(() =>
    findSelected(options.rows(), options.filters.value.selected, single.value),
  )
  const select = (row: DeletedRow) => options.update({ selected: selectedParam(row, single.value) })

  /** Yalnız ebeveyn silinmiş, türü bilinen (görev/toplantı) ve adı okunabilirse. */
  function openParent(row: DeletedRow): void {
    const parent = row.parent
    if (!parent?.deleted || !parent.kind || !parent.name) return
    options.sort.value = DEFAULT_SORT
    options.navigate({
      kind: parent.kind === 'tasks' ? 'gorev' : 'toplanti',
      q: '',
      department: null,
      range: DEFAULT_RANGE,
      actor: null,
      selected: parent.id,
    })
  }

  return { selected, select, openParent }
}
