/**
 * Silinen kayıtlar sayfasının bileşimi (sayfa bileşeni yalnız çizer; 250 satır kapısı): yetki,
 * görünüm (URL ⇄ süzgeç ⇄ sunucu sorgusu), sayaçlar, seçim, tekil/toplu/çöp boşaltma eylemleri
 * ve odak taşıma (KESİN 27). `useConfirm`/`useToast` kurulumda alınır (KESİN 26a): çağıran
 * `setup` içinde çağırmalıdır.
 */
import { computed, onScopeDispose } from 'vue'

import { useStanding } from '@/shared/scope/standing'

import { deletedRecordsCapabilities } from '../model/capabilities'
import type { DeletedRow } from '../model/types'
import { useBatchActions } from './use-batch-actions'
import { useDeletedExport } from './use-export'
import { useDeletedView } from './use-deleted-view'
import { usePageCounts } from './use-page-counts'
import { usePageFocus } from './use-page-focus'
import { usePurgeAll } from './use-purge-all'
import { useRecordActions } from './use-record-actions'
import { useLifecycleHub } from './use-lifecycle-hub'
import { useSelection } from './use-selection'

function usePageState() {
  const { standing } = useStanding()
  const caps = computed(() => deletedRecordsCapabilities(standing.value))
  const view = useDeletedView(() => caps.value.view)
  const { filters, list } = view
  onScopeDispose(view.dispose)
  const focus = usePageFocus()
  const forbidden = computed(() => list.error.value?.status === 403)
  const allowed = computed(() => caps.value.view && !forbidden.value)
  const denied = computed(() => standing.value !== null && !allowed.value)
  const { counts, subtitle } = usePageCounts(
    () => caps.value.view,
    () => filters.value.kind,
  )
  const listState = computed<'loading' | 'error' | 'empty' | 'filtered' | null>(() => {
    if (list.error.value) return 'error'
    if (list.loading.value) return 'loading'
    if (list.rows.value.length > 0) return null
    return view.filtered.value ? 'filtered' : 'empty'
  })
  return { caps, view, filters, list, focus, allowed, denied, counts, subtitle, listState }
}

type PageState = ReturnType<typeof usePageState>

/** Yazma eylemleri: tekil, toplu (seçim) ve çöpü boşalt; hepsi ortak onay ve kilit üzerinden. */
function usePageWrites({ view, filters, list, focus }: PageState) {
  // Dokuz türün yazmaları tek merkezden: tekil, toplu ve çöpü boşalt aynı hook'ları paylaşır.
  const hub = useLifecycleHub()
  const actions = useRecordActions({
    hub,
    refresh: () => list.refetch(),
    removed: (row) => {
      // Liste yenilendiğinde satır çoktan düşmüş olabilir: seçim URL değerinden denetlenir.
      const selected = filters.value.selected
      if (selected === row.id || selected === row.key) view.update({ selected: null })
      void focus.afterRemoval()
    },
  })
  const selection = useSelection(
    () => list.rows.value,
    // Dize anahtarı: yalnız tür/süzgeç/sıra gerçekten değişince sıfırlanır (kimlik değil değer).
    () => `${filters.value.kind}|${JSON.stringify(view.query.value)}`,
  )
  onScopeDispose(selection.dispose)
  const batch = useBatchActions({
    hub,
    refresh: () => list.refetch(),
    finished: (failedKeys) => {
      selection.keepOnly(failedKeys)
      void focus.afterRemoval()
    },
  })
  const purgeAll = usePurgeAll({
    hub,
    kind: () => filters.value.kind,
    refresh: () => list.refetch(),
    finished: () => {
      selection.clear()
      void focus.toTrashButton()
    },
  })
  const exporter = useDeletedExport({
    kind: () => filters.value.kind,
    query: () => view.query.value,
  })
  const busy = computed(
    () => actions.pending.value || batch.pending.value || purgeAll.pending.value,
  )
  return { actions, selection, batch, purgeAll, exporter, busy }
}

/** Şablonun çağırdığı küçük eylemler: odak dönüşü her kapanış yolunda (KESİN 27). */
function usePageHandlers(state: PageState, writes: ReturnType<typeof usePageWrites>) {
  const { view, list, focus } = state
  const { actions, selection, batch, purgeAll } = writes
  return {
    act: (action: 'restore' | 'purge', row: DeletedRow) => {
      focus.remember(list.rows.value.findIndex((candidate) => candidate.key === row.key))
      void (action === 'restore' ? actions.restore(row) : actions.purge(row))
    },
    clearSelection: () => {
      selection.clear()
      void focus.toSelectAll()
    },
    dismissBatchSummary: () => {
      batch.dismissSummary()
      void focus.toKindButton()
    },
    openDepartments: () => {
      actions.dismissNotice()
      view.setKind('koordinatorluk')
      void focus.toKindButton('koordinatorluk')
    },
    dismissNotice: () => {
      actions.dismissNotice()
      void focus.toKindButton()
    },
    closePurgeAll: () => {
      purgeAll.close()
      void focus.toTrashButton()
    },
    dismissPurgeSummary: () => {
      purgeAll.dismissSummary()
      void focus.toTrashButton()
    },
  }
}

export function useDeletedPage() {
  const state = usePageState()
  const writes = usePageWrites(state)
  const handlers = usePageHandlers(state, writes)
  const { focus, ...rest } = state
  return { ...rest, ...writes, ...handlers, column: focus.column }
}
