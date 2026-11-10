/**
 * Zaman çizelgesi okuma composable'ları (TanStack Query). Anahtarlar YALNIZ
 * `shared/http/query-keys.ts` fabrikasından (`gantt`, `date-requests`; ortak-kurallar §6) ve
 * seçili kapsamın anlık görüntüsüyle kurulur: program / mercek / birim değişince hepsi düşer
 * (K2). Okuyucular oturuma bağlıdır (`sessionBound`) ve `signal`'i iletir (KESİN 26b, Ö-08).
 *
 * Tek görev okumaları (`getWorkItem`, `listWorkItemFiles`, `listWorkItemSubtasks`) ve departman
 * ad çözümü (`listProgramDepartments`) work modülünden gelir (`work/public.ts`); 03 ile AYNI
 * anahtarları paylaşır, burada yeniden yazılmaz.
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import type { WorkTarget } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { isListTruncated } from '@/shared/http/truncation'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { ganttFace, ganttTarget } from '../model/face'
import type { DateRequestFilters, GanttLink, GanttTask } from '../model/types'
import {
  fetchDateChangeRequests,
  fetchDependencies,
  fetchGantt,
  fetchMyDateChangeRequests,
} from './fetchers'
import { retryTransient, TIMELINE_STALE_MS } from './http'

const NO_TASKS: readonly GanttTask[] = []
const NO_LINKS: readonly GanttLink[] = []

/**
 * Seçili yüzün Gantt'ı (`adminGantt` / `coordinatorGantt` / `memberGantt`). Yüz kapsam
 * merceğinden türetilir; kapsam eksikse (mercek/birim yok) istek yok. Anahtar
 * `scoped(['gantt', yüz])` — kapsam değişince düşer, Gantt yazmaları öneki geçersizler.
 * `ceiling` sunucunun kesilme bildirimidir (BE-019): `X-Result-Truncated: true` → `true`; tam 200
 * kalem başlıksızsa `false` ("tam 200 ise uyar" sezgisi yoktur).
 */
export function useGantt() {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      const face = ganttFace(scope)
      const target = ganttTarget(scope)
      return {
        queryKey: queryKeys.gantt.face(scope, face ?? 'none'),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          // `enabled` yüz ve hedef yokken sorguyu kapatır.
          fetchGantt(face!, target!, signal),
        ),
        enabled: face !== null && target !== null,
        retry: retryTransient,
        staleTime: TIMELINE_STALE_MS,
      }
    }),
  )
  const tasks = computed<readonly GanttTask[]>(() => query.data.value?.tasks ?? NO_TASKS)
  const links = computed<readonly GanttLink[]>(() => query.data.value?.links ?? NO_LINKS)
  const face = computed(() => ganttFace(store.snapshot))
  const ceiling = computed(() => isListTruncated(query.data.value))
  return { query, tasks, links, face, ceiling }
}

/**
 * `listDateChangeRequests` (S1; yalnız yönetici). Panel için seçili görevin ayrıntısı; Gantt ile
 * toplu birleştirme yok (backend.md §6). `enabled` çağıranın yönetici olgusudur.
 */
export function useDateChangeRequests(
  filters: MaybeRefOrGetter<DateRequestFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const current = toValue(filters)
      return {
        queryKey: queryKeys.dateRequests.list(store.snapshot, { ...current }),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchDateChangeRequests(current.status, signal),
        ),
        enabled: toValue(enabled) && store.snapshot.programId !== null,
        retry: retryTransient,
        staleTime: TIMELINE_STALE_MS,
      }
    }),
  )
}

/**
 * `myDateChangeRequests` (S3): koordinatörün kendi talepleri. Aynı `date-requests` önekinin
 * altında (`{ mine: true, department }` süzgeci) — talep yazmaları öneki geçersizler.
 */
export function useMyDateChangeRequests(
  target: MaybeRefOrGetter<WorkTarget | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const resolved = toValue(target)
      return {
        queryKey: queryKeys.dateRequests.list(store.snapshot, {
          mine: true,
          department: resolved?.departmentId ?? null,
        }),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchMyDateChangeRequests(resolved!, signal),
        ),
        enabled: toValue(enabled) && resolved !== null,
        retry: retryTransient,
        staleTime: TIMELINE_STALE_MS,
      }
    }),
  )
}

/**
 * Seçili görevin `listDependencies` okuması (yalnız koordinatör/yönetici; üye yüzünde çağrılmaz —
 * çağıran `enabled` verir). Anahtar ortak `queryKeys.workItems.dependencies` (03 ile aynı);
 * bağımlılık yazmaları motorun §6 listesiyle yeniden okutur.
 */
export function useDependencies(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const id = toValue(workItemId)
      const resolved = toValue(target)
      return {
        queryKey: queryKeys.workItems.dependencies(store.snapshot, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchDependencies(resolved!, id!, signal),
        ),
        enabled: toValue(enabled) && id !== null && resolved !== null,
        retry: retryTransient,
        staleTime: TIMELINE_STALE_MS,
      }
    }),
  )
}
