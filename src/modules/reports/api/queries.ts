/**
 * Rapor okuyucuları (S2; hepsi yalnız şirket yöneticisi ya da — görev/toplantı PDF'i için —
 * koordinatör; yetki sunucuda, görünürlük `model/capabilities.ts`). Her okuyucu `sessionBound`
 * kapısından geçer ve `signal`'i iletir (KESİN 26b). Önbellek anahtarları `queryKeys.report.*`
 * (ortak-kurallar §6); kapsam değişince düşer (K2).
 *
 *  - `reportSeason` (01f önizleme): tek ağır istek; `enabled` dışarıdan (yalnız 01f açıkken);
 *    `reportGate`'ten geçer (hesap başına tek eşzamanlı üretim; JSON da korumadadır,
 *    REPORTING-K10); `staleTime: 0`, odakta/yeniden bağlanmada otomatik tazeleme YOK (E-13-40);
 *    otomatik tekrar YOK (429/503 için "Yeniden dene" kullanıcıdadır). Başlıklı 429 ortak
 *    `reportGate` sayacını başlatır (indirme yoluyla aynı politika; CX-F6-E-05). Sayaç sürerken
 *    (önizleme kapatılıp yeniden açılsa da) okuyucu AĞA ÇIKMAZ: istek atmadan sayaçlı
 *    `export_in_progress` hatasıyla biter; sayaç bitince otomatik istek yok, "Yeniden dene"
 *    kullanıcı eylemidir ve tek istektir (CX-F6-E-08).
 *  - `reportMeetingDetail` (01g): hafif, kilitsiz; yalnız ŞY (K için 403).
 *  - `reportTaskDetail`: hafif, kilitsiz.
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { linkSignals } from '@/shared/download'
import { ApiError, toApiError } from '@/shared/errors/api-error'
import { api, authSession, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { retryTransient } from '@/shared/http/retry'
import { useScopeStore } from '@/shared/scope/store'
import { SessionChangedError, sessionBound } from '@/shared/session/query-session'

import { classifyFailure } from '../model/failure'
import { reportGate, type ReportGate } from '../model/gate'
import { applyCooldown } from '../model/settle'
import { bindGateToSession } from './cancellation'

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

/** Sayaç sürerken ağır okuma başlamaz: PDF düğmesiyle tutarlı, ağa çıkmayan sayaçlı hata. */
function cooldownError(gate: ReportGate): ApiError {
  return new ApiError({
    code: 'reporting.export_in_progress',
    status: 429,
    retryAfter: gate.cooldown.value,
  })
}

/** Dönem raporu JSON'u (01f). Kilit sırası beklenirken `signal` iptali sıradan düşürür. */
export function useReportSeason(enabled: MaybeRefOrGetter<boolean>, gate: ReportGate = reportGate) {
  const store = useScopeStore()
  bindGateToSession(gate)
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.report.season(scope),
        queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
          const born = {
            generation: authSession.generation,
            accountId: authSession.snapshot.accountId,
          }
          if (gate.cooldown.value > 0) throw cooldownError(gate)
          const lease = await gate.acquireWhenFree(signal)
          // Sırada beklerken başka bir yol sayaç başlatmış olabilir (CX-F6-E-08).
          if (gate.cooldown.value > 0) {
            lease.release()
            throw cooldownError(gate)
          }
          try {
            return await fetchSeason(scope.programId ?? '', linkSignals(signal, lease.signal))
          } catch (cause) {
            // Ağır okumanın 429'u indirme yoluyla AYNI sınıflandırma ve bekleme politikasındadır
            // (CX-F6-E-05); sayaç yalnız `Retry-After` varsa, süre bitince otomatik istek yok.
            // Oturum değiştiyse (kapı sıfırlandı, istek kesildi) hata oturum değişimidir; sayaç yok.
            if (
              born.generation !== authSession.generation ||
              born.accountId !== authSession.snapshot.accountId
            ) {
              throw new SessionChangedError()
            }
            if (!signal.aborted) {
              const error = toApiError(cause)
              applyCooldown(classifyFailure(error, error.retryAfter), gate.startCooldown)
            }
            throw cause
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
