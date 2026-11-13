/**
 * Rapor okuyucuları (S2; hepsi yalnız şirket yöneticisi ya da — görev/toplantı PDF'i için —
 * koordinatör; yetki sunucuda, görünürlük `model/capabilities.ts`). Her okuyucu `sessionBound`
 * kapısından geçer ve `signal`'i iletir (KESİN 26b). Önbellek anahtarları `queryKeys.report.*`
 * (ortak-kurallar §6); kapsam değişince düşer (K2).
 *
 *  - `reportSeason` (01f önizleme): tek ağır istek; `enabled` dışarıdan (yalnız 01f açıkken);
 *    `reportGate`'ten geçer (hesap başına tek eşzamanlı üretim; JSON da korumadadır,
 *    REPORTING-K10); `staleTime: 0`, odakta/yeniden bağlanmada otomatik tazeleme YOK (E-13-40);
 *    otomatik tekrar YOK (429/503 için "Yeniden dene" kullanıcıdadır).
 *  - `reportMeetingDetail` (01g): hafif, kilitsiz; yalnız ŞY (K için 403).
 *  - `reportTaskDetail`: hafif, kilitsiz.
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/shared/http/retry'
import { linkSignals } from '@/shared/download'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { reportGate, type ReportGate } from '../model/gate'

const program = (programId: string) => ({ 'X-Nizamio-Program': programId })

export function fetchSeason(programId: string, signal?: AbortSignal) {
  return unwrap(api.GET('/v1/reports/season', { params: { header: program(programId) }, signal }))
}

export function fetchMeetingDetail(programId: string, id: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/reports/meetings/{id}', {
      params: { header: program(programId), path: { id } },
      signal,
    }),
  )
}

export function fetchTaskDetail(programId: string, id: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/reports/tasks/{id}', {
      params: { header: program(programId), path: { id } },
      signal,
    }),
  )
}

/** Dönem raporu JSON'u (01f). Kilit sırası beklenirken `signal` iptali sıradan düşürür. */
export function useReportSeason(enabled: MaybeRefOrGetter<boolean>, gate: ReportGate = reportGate) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.report.season(scope),
        queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
          const lease = await gate.acquireWhenFree(signal)
          try {
            return await fetchSeason(scope.programId ?? '', linkSignals(signal, lease.signal))
          } finally {
            lease.release()
          }
        }),
        enabled: toValue(enabled) && scope.programId !== null,
        retry: false,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      }
    }),
  )
}

/** Toplantı rapor ayrıntısı (01g). `id` yokken sorgu kapalıdır. */
export function useReportMeetingDetail(
  id: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const meetingId = toValue(id)
      return {
        queryKey: queryKeys.report.meeting(scope, meetingId ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchMeetingDetail(scope.programId ?? '', meetingId ?? '', signal),
        ),
        enabled: toValue(enabled) && scope.programId !== null && meetingId !== null,
        retry: retryTransient,
        staleTime: 0,
        refetchOnWindowFocus: false,
      }
    }),
  )
}

/** Görev rapor ayrıntısı. `id` yokken sorgu kapalıdır. */
export function useReportTaskDetail(
  id: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const taskId = toValue(id)
      return {
        queryKey: queryKeys.report.task(scope, taskId ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchTaskDetail(scope.programId ?? '', taskId ?? '', signal),
        ),
        enabled: toValue(enabled) && scope.programId !== null && taskId !== null,
        retry: retryTransient,
        staleTime: 0,
        refetchOnWindowFocus: false,
      }
    }),
  )
}
