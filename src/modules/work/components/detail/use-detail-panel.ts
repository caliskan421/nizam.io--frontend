/**
 * Ayrıntı panelinin veri ve kapanış mantığı (W43; E-03-41…51, `03-gorevler-liste/backend.md` §1
 * `getWorkItem` satırı, README satır dışı "404 → panel kapanır + bildirim").
 *
 *  - Hedef kapsam `useWorkItemTarget` (liste verisine reaktif): yüklenmiş liste satırı (görevin
 *    kendi kapsamı) ya da K/Ü merceğinde seçili birim. Admin merceğinde koordinatörlük süzgeci
 *    (URL `koordinatorluk`) açıksa listenin `department_id`'si ikinci parametre olarak verilir
 *    (süzgeçli listenin satırları). Admin merceğinde liste dışı görev → `null`: liste okuması
 *    sürerken beklenir, bitince hâlâ `null` ise panel "kapsam bilinmiyor" bildirimiyle kapanır
 *    (istek atılmaz; koordinatör notu O2b).
 *  - Kapanış tek seferliktir (görev başına): bu istemcideki silme sürerken (`isDeletingWorkItem`)
 *    görev okumasının 404'ü ya da listeden düşmesi "bulunamadı" sayılmaz; panel `deleted` ile
 *    kapanır (W48).
 *  - `getWorkItem` 404 `work.item_not_found` (silinmiş / kapsam dışı) → panel kapanır + bildirim.
 *  - Sekme sayıları (E-03-45) yalnız panel açıkken ayrıntı uçlarından: alt görev
 *    `subtask_counts.total`, dosya `files.length`, not `WorkItemNoteList.total` (not okuma
 *    yetkisi, s.143, yoksa istek atılmaz). Dosya/not istekleri görevin kendi kapsamıyla.
 */
import { useIsFetching, type Query } from '@tanstack/vue-query'
import { computed, inject, watch, type Ref } from 'vue'
import { routeLocationKey } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { errorText } from '@/shared/i18n'
import { hasErrorCode } from '@/shared/scope/authority-loss'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { useInstanceStore } from '@/shared/instance/store'
import { useToast } from '@/shared/ui'

import {
  isDeletingWorkItem,
  retryTransient,
  useProgramDepartments,
  useWorkItem,
  useWorkItemFiles,
  useWorkItemNotes,
  useWorkItemTarget,
} from '../../api'
import { canReadNotes, workActorFacts } from '../../model/capabilities'
import { targetOf } from '../../model/target'
import type { WorkTarget } from '../../model/types'
import { parseTasksQuery } from '../../pages/tasks/url-state'
import type { WorkDetailCloseReason } from '../index'
import { FALLBACK_TIME_ZONE, kickerText } from './format'
import { detailText } from './messages'

/** Liste sorgusu mu: `scoped([..., 'work-items', filters])` (son öğe süzgeç nesnesi). */
function isListQuery(query: Query): boolean {
  const last = query.queryKey[query.queryKey.length - 1]
  return typeof last === 'object' && last !== null
}

/**
 * Hedef kapsam + liste okuma sayacı. Admin merceğinde listenin `department_id`'si URL
 * `koordinatorluk` süzgecidir (W41b); router yoksa (yalın bileşen) süzgeçsiz. Sayaç yalnız
 * "kapsam bilinmiyor" kararının zamanlaması içindir (liste okuması bitmeden kapanılmaz).
 */
function useTrackedTarget(workItemId: () => string) {
  const store = useScopeStore()
  const route = inject(routeLocationKey, null)
  const listFetching = useIsFetching(() => ({
    queryKey: queryKeys.workItems.all(store.snapshot),
    predicate: isListQuery,
  }))
  const listDepartment = () =>
    store.lens === 'admin' && route ? parseTasksQuery(route.query).department : undefined
  const listPeople = () =>
    store.lens !== 'member' && route ? parseTasksQuery(route.query).people : undefined
  const target = useWorkItemTarget(workItemId, listDepartment, listPeople)
  return { target, listFetching }
}

interface MissingSources {
  workItemId: () => string
  target: Ref<WorkTarget | null>
  listFetching: Ref<number>
  programId: () => string | null
  itemError: () => unknown
}

/** Görev başına tek kapanış: ikinci neden (ör. silme sonrası 404) yok sayılır. */
function useCloseOnce(workItemId: () => string, close: (reason: WorkDetailCloseReason) => void) {
  let closed = false
  watch(workItemId, () => {
    closed = false
  })
  return (reason: WorkDetailCloseReason): boolean => {
    if (closed) return false
    closed = true
    close(reason)
    return true
  }
}

/**
 * Kapanış bekçisi: kapsam bilinmiyor (hedef `null`, liste okuması bitmiş) ya da 404
 * `work.item_not_found` → bir kez bildirim + `close('not_found')`. Bu istemcideki silme
 * sürerken bekçi susar (kapanış `deleted` ile gelir).
 */
function watchMissing(sources: MissingSources, closeOnce: (r: WorkDetailCloseReason) => boolean) {
  const toast = useToast()
  const deleting = () => isDeletingWorkItem(sources.workItemId())
  function closeWith(message: string): void {
    if (deleting()) return
    if (closeOnce('not_found')) toast.push({ message })
  }
  watch(
    [sources.target, sources.listFetching, sources.programId],
    ([resolved, fetching, programId]) => {
      if (resolved === null && programId !== null && fetching === 0) {
        closeWith(detailText('workDetail.scopeUnknown'))
      }
    },
    { immediate: true },
  )
  watch(sources.itemError, (error) => {
    if (hasErrorCode(error, 'work.item_not_found')) closeWith(errorText(toApiError(error)))
  })
}

export function useDetailPanel(
  workItemId: () => string,
  close: (reason: WorkDetailCloseReason) => void,
) {
  const store = useScopeStore()
  const instance = useInstanceStore()
  const { standing } = useStanding()

  const closeOnce = useCloseOnce(workItemId, close)
  const { target, listFetching } = useTrackedTarget(workItemId)
  const itemQuery = useWorkItem(workItemId, target)
  const item = computed(() => itemQuery.data.value ?? null)
  const facts = computed(() =>
    item.value ? workActorFacts(standing.value, store.programId, item.value) : null,
  )
  const itemTarget = computed(() => (item.value ? targetOf(item.value) : null))
  const files = useWorkItemFiles(workItemId, itemTarget)
  const notesTarget = computed(() =>
    facts.value && canReadNotes(facts.value) ? itemTarget.value : null,
  )
  const notes = useWorkItemNotes(workItemId, notesTarget)
  const departments = useProgramDepartments()

  watchMissing(
    {
      workItemId,
      target,
      listFetching,
      programId: () => store.programId,
      itemError: () => itemQuery.error.value,
    },
    closeOnce,
  )

  const error = computed(() => {
    const raw = itemQuery.error.value
    return raw && !item.value ? toApiError(raw) : null
  })
  const kicker = computed(() => {
    if (!item.value) return ''
    const department = departments.byId.value.get(item.value.department_id)
    return kickerText(department?.code, department?.display_name)
  })

  return {
    /** Panelin kapanışı (kullanıcı, silme) — bekçiyle aynı tek seferlik kapı. */
    close: (reason: WorkDetailCloseReason) => void closeOnce(reason),
    item,
    facts,
    error,
    retryable: computed(() => error.value !== null && retryTransient(0, error.value)),
    retry: () => void itemQuery.refetch(),
    kicker,
    files: computed(() => files.data.value?.files ?? null),
    notesTotal: computed(() => notes.data.value?.total),
    timeZone: computed(() => instance.profile?.timezone ?? FALLBACK_TIME_ZONE),
  }
}
