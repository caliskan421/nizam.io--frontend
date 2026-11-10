/**
 * Zaman çizelgesi okuma uçları (03c `backend.md` §1). Her çağrı tek uç, tek istek; departmanlar
 * arası fan-out yoktur (K3, ortak-kurallar §9). Üç Gantt yüzü AYNI şemayı döndürür
 * (`Gantt{tasks, links}`); yüz kapsamdan türetilir (`model/face.ts`).
 */
import { api, unwrap } from '@/shared/http'
import { unwrapList } from '@/shared/http/truncation'

import type { WorkTarget } from '@/modules/work/public'

import type { DateRequestStatusFilter, GanttFace, GanttTarget } from '../model/types'
import { programHeaders, scopeHeaders } from './http'

/** S3 yüzler için departman zorunludur; eksikse programlama hatası (okuyucu `enabled` ile korur). */
function workTarget(target: GanttTarget): WorkTarget {
  if (target.departmentId === null) throw new Error('Gantt: bu yüz için departman kapsamı gerekli')
  return { programId: target.programId, departmentId: target.departmentId }
}

/**
 * `adminGantt` (S2) / `coordinatorGantt` (S3) / `memberGantt` (S3). `overdue` parametresi
 * KULLANILMAZ: uç yalnız bitiş gününe bakar, tamamlanmış geç görevi de döndürür (GAP-053);
 * "Geciken" süzgeci istemcide `lateness.is_overdue` ile yapılır. İlk 200 kalem; imleç yok.
 * Kesilme `X-Result-Truncated: true` başlığından okunur (BE-019): kesildiyse veride `truncated`
 * bayrağı vardır; tam 200 kalem başlıksızsa kesilme YOKTUR.
 */
export function fetchGantt(face: GanttFace, target: GanttTarget, signal?: AbortSignal) {
  if (face === 'admin') {
    return unwrapList(
      api.GET('/v1/work-items/gantt/admin', {
        params: { header: programHeaders(target) },
        signal,
      }),
    )
  }
  const header = scopeHeaders(workTarget(target))
  if (face === 'coordinator') {
    return unwrapList(api.GET('/v1/work-items/gantt', { params: { header }, signal }))
  }
  return unwrapList(api.GET('/v1/work-items/gantt/mine', { params: { header }, signal }))
}

/**
 * `listDateChangeRequests` (S1, kapsamsız; yalnız yönetici). Sayfasız, BÜTÜN programların
 * talepleri (GAP-053): yalnız seçili görevin ayrıntısı için okunur, Gantt satırlarıyla toplu
 * birleştirilmez (backend.md §6).
 */
export function fetchDateChangeRequests(status: DateRequestStatusFilter, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/date-change-requests', {
      params: { query: status === 'pending' ? { status: 'pending' } : {} },
      signal,
    }),
  )
}

/** `myDateChangeRequests` (S3; başlık istenir ama süzmez — GAP-053). Koordinatörün kendi talepleri. */
export function fetchMyDateChangeRequests(target: WorkTarget, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/date-change-requests/mine', {
      params: { header: scopeHeaders(target) },
      signal,
    }),
  )
}

/** `listDependencies` (S3, görevin kendi kapsamı; yalnız koordinatör ve yönetici). */
export function fetchDependencies(target: WorkTarget, workItemId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/work-items/{id}/dependencies', {
      params: { header: scopeHeaders(target), path: { id: workItemId } },
      signal,
    }),
  )
}
