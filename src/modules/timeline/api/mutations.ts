/**
 * Tarih / talep / bağımlılık yazmaları (03c `backend.md` §2) — hepsi `useProtectedMutation`
 * üzerinden (`useKeylessMutation`; K5, ortak-kurallar §7). Altısı da `Idempotency-Key` ALMAZ
 * (BE-056): istek anahtar taşımaz, SONUÇ BİLİNMİYORSA kör tekrar YOK (`retry` düşer) ve Gantt +
 * görev + talep (+ bağımlılık) yeniden okunur; kullanıcı yeni duruma bakıp karar verir. Tek
 * otomatik tekrar `platform.conflict_retry`'dır (motor, aynı gövdeyle). 401 sonrası özdeş tek
 * tekrar taşıyıcıdadır ve ayrı şeydir. Sahip sökülünce yeni yazma başlamaz (`owner_disposed`);
 * ortak önbellek uzlaştırması (geçersizleme, yeniden okuma) sürer ama ekrana özgü iş ve
 * bildirim başlatılmaz (`reachesOwner`).
 *
 * Başarıda geçersizleme motorun §6 listesidir (`query-keys.ts`): tarih uçları Gantt'ın bütün
 * yüzlerini, `work-items` görevlerini/listelerini; talep uçları ayrıca `date-requests`'i;
 * bağımlılık uçları Gantt'ı yeniden okutur. İyimser güncelleme yoktur: başarı yanıtı gelmeden
 * ekran değişmez. Kapsam başlığı eylemin hedefinden (görevin KENDİ program/departmanı); eylem
 * değişkeninde dondurulur (ortak-kurallar §7).
 *
 * `cascade_count` / `affected_tasks_count` (zincirle kayan bağımlılar) sonuçta döner;
 * onay diyaloğu yoktur — sonradan bildirilir (03c satır dışı varsayım 4).
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { getActivePinia } from 'pinia'

import { useKeylessMutation } from '@/modules/organization/public'
import { fetchWorkItem } from '@/modules/work/public'
import { api } from '@/shared/http'
import {
  type MutationOutcome,
  type ProtectedMutationOptions,
  type SubmitOptions,
  withExpectedRevisions,
  WORK_ITEM_REVISION_GROUPS,
} from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'

import type {
  AddDependencyInput,
  DateChangeRequest,
  DependencyEdge,
  ExtendInput,
  ExtendResult,
  RemoveDependencyInput,
  RequestDateChangeInput,
  ReviewInput,
  ReviewResult,
  UpdateDatesInput,
  WorkItemIdOf,
} from '../model/types'
import { scopeHeaders } from './http'

import type { WorkItem } from '@/modules/work/public'

const NO_SCOPE: ScopeSnapshot = { programId: null, departmentId: null }

/**
 * Sonuç bilinmiyorsa yeniden okunacaklar: motorun §6 listesine EK olarak talepler, görev ve
 * (varsa) bağımlılıklar — `updateWorkItem` talep listesini geçersizlemez ama bekleyen talebin
 * sonucu (zincir) değişmiş olabilir. Eylemin YAKALANMIŞ kapsamıyla; sahip sökülse de sürer.
 */
async function rereadAll(
  client: QueryClient,
  scope: ScopeSnapshot,
  workItemId: string,
): Promise<void> {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.gantt.all(scope) }),
    client.invalidateQueries({ queryKey: queryKeys.dateRequests.all(scope) }),
    client.invalidateQueries({
      queryKey: queryKeys.workItems.item(scope, workItemId),
      exact: true,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.workItems.dependencies(scope, workItemId),
      exact: true,
    }),
  ])
}

/**
 * Anahtarsız zaman çizelgesi yazması: `useKeylessMutation` (kör tekrar yok, yeniden okuma) +
 * sonuç bilinmiyorsa Gantt/görev/talep/bağımlılık yeniden okuması. `workItemId` yeniden okuma
 * hedefidir.
 */
function useTimelineMutation<V, D>(
  options: ProtectedMutationOptions<V, D, unknown>,
  workItemOf: (vars: V) => string,
) {
  const client = useQueryClient()
  const readScope = (): ScopeSnapshot => (getActivePinia() ? useScopeStore().snapshot : NO_SCOPE)
  const mutation = useKeylessMutation<V, D>({ ...options, queryClient: client })

  async function submit(vars: V, opts?: SubmitOptions): Promise<MutationOutcome<V, D, unknown>> {
    const scope = { ...(opts?.context?.scope ?? readScope()) }
    const outcome = await mutation.submit(vars, opts)
    if (outcome.kind === 'unknown_outcome') await rereadAll(client, scope, workItemOf(vars))
    return outcome
  }

  return { submit, isPending: mutation.isPending }
}

const byItem = (vars: WorkItemIdOf) => ({ workItemId: vars.workItemId })

/**
 * `updateWorkItem` — yalnız TARİH alanları (`start_on`, `end_on`, `planned_end_on`) ve
 * `expected_dates_revision` (panel açılışındaki `getWorkItem.dates_revision`; `GanttTask`
 * sürüm taşımaz, eksikler yeni-2). Başlık/öncelik gövdede olmaz. 409 `work.edit_conflict` →
 * sonuçta sunucunun güncel görevi (`readCurrent`) — alan alan seçim `shared/ui/conflict` (K5).
 */
export function useUpdateWorkItemDates() {
  return useTimelineMutation<UpdateDatesInput, WorkItem>(
    {
      operation: 'updateWorkItem',
      send: (vars, ctx) =>
        api.PATCH('/v1/work-items/{id}', {
          params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
          body: withExpectedRevisions(vars.dates, vars.base, WORK_ITEM_REVISION_GROUPS),
          signal: ctx.signal,
        }),
      readCurrent: (vars) => fetchWorkItem(vars.target, vars.workItemId),
      invalidation: byItem,
    },
    (vars) => vars.workItemId,
  )
}

/**
 * `extendWorkItem` — yalnız bitiş ileri 1–90 gün. Ne sürüm ne anahtar var: tekrar çift uzatma
 * yapabilir → sonuç bilinmiyorsa tekrar yok, Gantt yeniden okunur (çağıran `end_on`'u
 * karşılaştırır).
 */
export function useExtendWorkItem() {
  return useTimelineMutation<ExtendInput, ExtendResult>(
    {
      operation: 'extendWorkItem',
      send: (vars, ctx) =>
        api.POST('/v1/work-items/{id}/extend', {
          params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
          body: { days: vars.days },
          signal: ctx.signal,
        }),
      invalidation: byItem,
    },
    (vars) => vars.workItemId,
  )
}

/**
 * `requestDateChange` (Koordinatör; P8) — `new_start_on` + `new_end_on` ikisi zorunlu, `reason`
 * isteğe bağlı. 409 `work.date_request_pending_exists` → "bekleyen talep var", panel yeniden
 * okunur. Yönetici tek başına açamaz (403 `work.not_authorized`).
 */
export function useRequestDateChange() {
  return useTimelineMutation<RequestDateChangeInput, DateChangeRequest>(
    {
      operation: 'requestDateChange',
      send: (vars, ctx) =>
        api.POST('/v1/date-change-requests', {
          params: { header: scopeHeaders(vars.target) },
          body: {
            work_item_id: vars.workItemId,
            new_start_on: vars.newStartOn,
            new_end_on: vars.newEndOn,
            ...(vars.reason ? { reason: vars.reason } : {}),
          },
          signal: ctx.signal,
        }),
      invalidation: byItem,
    },
    (vars) => vars.workItemId,
  )
}

/**
 * `reviewDateChangeRequest` (Admin; S1, başlıksız) — `{id}` = `getWorkItem.pending_date_request
 * .request_id`. Onay bağımlıları zincirle öteler → `affected_tasks_count`. 409
 * `work.date_request_already_reviewed` → yeniden oku, "talep zaten karara bağlanmış".
 */
export function useReviewDateChangeRequest() {
  return useTimelineMutation<ReviewInput, ReviewResult>(
    {
      operation: 'reviewDateChangeRequest',
      send: (vars, ctx) =>
        api.POST('/v1/date-change-requests/{id}/review', {
          params: { path: { id: vars.requestId } },
          body: { decision: vars.decision },
          signal: ctx.signal,
        }),
      invalidation: byItem,
    },
    (vars) => vars.workItemId,
  )
}

/**
 * `addDependency` (Admin + Koordinatör; S3, BAĞIMLI görevin kapsamı) — gövde
 * `depends_on_work_item_id` (ön görev). 409 `work.dependency_cycle` / `work.dependency_duplicate`.
 * Başarıda Gantt + görevin bağımlılık listesi (ortak anahtar, motor) yeniden okunur.
 */
export function useAddDependency() {
  return useTimelineMutation<AddDependencyInput, DependencyEdge>(
    {
      operation: 'addDependency',
      send: (vars, ctx) =>
        api.POST('/v1/work-items/{id}/dependencies', {
          params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
          body: { depends_on_work_item_id: vars.dependsOnWorkItemId },
          signal: ctx.signal,
        }),
      invalidation: byItem,
    },
    (vars) => vars.workItemId,
  )
}

/** `removeDependency` — `depId` = `GanttLink.dependency_id`. */
export function useRemoveDependency() {
  return useTimelineMutation<RemoveDependencyInput, unknown>(
    {
      operation: 'removeDependency',
      send: (vars, ctx) =>
        api.DELETE('/v1/work-items/{id}/dependencies/{depId}', {
          params: {
            header: scopeHeaders(vars.target),
            path: { id: vars.workItemId, depId: vars.dependencyId },
          },
          signal: ctx.signal,
        }),
      invalidation: byItem,
    },
    (vars) => vars.workItemId,
  )
}
