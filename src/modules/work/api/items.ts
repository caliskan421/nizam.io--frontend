/**
 * Görev yazmaları (03 `backend.md` §2) — hepsi `useProtectedMutation` (K5, ortak-kurallar §7):
 * `Idempotency-Key` yalnız sözleşmenin istediği uçta (`createWorkItem`) ve kullanıcı eylemi
 * başına; başarıda `query-keys.ts` geçersizleme listesi yeniden okunur, iyimser güncelleme yok;
 * kapsam başlığı eylemin hedefinden (görevin kendi program/departmanı).
 */
import { computed, shallowReactive } from 'vue'

import { api } from '@/shared/http'
import {
  runWithFollowUps,
  useProtectedMutation,
  type SubmitOptions,
  withExpectedRevisions,
  WORK_ITEM_REVISION_GROUPS,
} from '@/shared/http/mutation'

import { targetOf } from '../model/target'
import type {
  AddedCount,
  AddAssignmentsInput,
  CreateWorkItemInput,
  CreateWorkItemWithAssigneesInput,
  StatusResult,
  TransitionInput,
  TransitionResult,
  UpdateWorkItemInput,
  WorkItem,
  WorkItemRef,
} from '../model/types'
import { fetchWorkItem } from './fetchers'
import { scopeHeaders } from './http'

const byItem = (vars: WorkItemRef) => ({ workItemId: vars.workItemId })

/** `createWorkItem` (S3: seçilen departman; IK zorunlu; tek atanan). */
export function useCreateWorkItem() {
  return useProtectedMutation<CreateWorkItemInput, WorkItem>({
    operation: 'createWorkItem',
    send: (vars, ctx) =>
      api.POST('/v1/work-items', {
        params: { header: { ...ctx.headers, ...scopeHeaders(vars.target) } },
        body: vars.body,
        signal: ctx.signal,
      }),
    invalidation: (_vars, data) => ({ workItemId: data.work_item_id }),
  })
}

/** `addAssignments` (yalnız koordinatör, s.140; IK yok). */
export function useAddAssignments() {
  return useProtectedMutation<AddAssignmentsInput, AddedCount>({
    operation: 'addAssignments',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/assignments', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
        body: { account_ids: [...vars.accountIds] },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/**
 * Yeni görev + ek atananlar — kısmi başarı modeli (ortak-kurallar §7, CX-S-03): önce
 * `createWorkItem` (formdaki tek atananla), başarılıysa ek atananlar için `addAssignments`
 * (görevin KENDİ kapsamıyla). İkinci adım başarısız olsa da görev ve ilk atanan korunur;
 * sonuç `partial` döner ("görev oluşturuldu, ek atama yapılamadı" — `createOutcomeText`).
 * Ana atanan ek listede tekrar edilmez (409 `work.assignment_duplicate` önlenir).
 * Bütün işlem tek eylem bağlamındadır (CX-F1-E-03): ek atama oluşturmanın kapsam + oturum
 * nesliyle gönderilir; arada kapsam/oturum değiştiyse gönderilmez → `partial`, geçersizleme
 * yalnız ilk eylemin kapsamında.
 */
export function useCreateWorkItemWithAssignees() {
  const create = useCreateWorkItem()
  const assign = useAddAssignments()

  function submit(input: CreateWorkItemWithAssigneesInput) {
    const primaryAssignee = input.body.assignee_account_id
    const extra = [...new Set(input.extraAssignees)].filter((id) => id !== primaryAssignee)
    return runWithFollowUps(
      () => create.submit({ target: input.target, body: input.body }),
      (item, context) =>
        extra.length === 0
          ? []
          : [
              {
                name: 'assignments',
                run: () =>
                  assign.submit(
                    { target: targetOf(item), workItemId: item.work_item_id, accountIds: extra },
                    { context },
                  ),
              },
            ],
    )
  }

  return {
    submit,
    isPending: computed(() => create.isPending.value || assign.isPending.value),
  }
}

/**
 * `updateWorkItem`: gövde, dokunulan grubun beklenen sürümüyle (`expected_revision` /
 * `expected_dates_revision`, taban = formun açılışta okuduğu görev). 409 `work.edit_conflict`
 * → sonuçta sunucunun güncel görevi (`readCurrent`) — alan alan seçim `shared/ui/conflict`.
 */
export function useUpdateWorkItem() {
  return useProtectedMutation<UpdateWorkItemInput, WorkItem, WorkItem>({
    operation: 'updateWorkItem',
    send: (vars, ctx) =>
      api.PATCH('/v1/work-items/{id}', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
        body: withExpectedRevisions(vars.changes, vars.base, WORK_ITEM_REVISION_GROUPS),
        signal: ctx.signal,
      }),
    readCurrent: (vars) => fetchWorkItem(vars.target, vars.workItemId),
    invalidation: byItem,
  })
}

/**
 * `transitionWorkItem` — varsayılan geçiş ucu (her aktöre yeter; istemci-akislari §5). 409
 * `work.subtasks_open` → kullanıcı onayı → AYNI hedefle `close_subtasks: true` yeni eylem;
 * 422 `work.attachment_required` → kanıt yükleme. IK yok; otomatik tekrar yok.
 */
export function useTransitionWorkItem() {
  return useProtectedMutation<TransitionInput, TransitionResult>({
    operation: 'transitionWorkItem',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/transitions', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
        body: vars.body,
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/** `ownStatusWorkItem` — yalnız çağıran göreve atanmışsa (s.142); matris aynı. */
export function useOwnStatusWorkItem() {
  return useProtectedMutation<TransitionInput, TransitionResult>({
    operation: 'ownStatusWorkItem',
    send: (vars, ctx) =>
      api.PATCH('/v1/work-items/{id}/own-status', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
        body: vars.body,
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/**
 * Bu istemcide silinmekte olan görevler (W48). Silme başarısının geçersizlemesi açık panelin
 * görev okumasını yeniden koşturur (404 `work.item_not_found`) ve listeyi yeniden okur; bu
 * pencerede panel bunu "bulunamadı" sayıp ayrıca bildirim göstermez — `deleted` ile kapanır.
 */
const deleting = shallowReactive(new Set<string>())

export function isDeletingWorkItem(workItemId: string): boolean {
  return deleting.has(workItemId)
}

/** `deleteWorkItem` — onay istemci diyaloğunda (`confirmation_required` bu uçta yok). */
export function useDeleteWorkItem() {
  const mutation = useProtectedMutation<WorkItemRef, StatusResult>({
    operation: 'deleteWorkItem',
    send: (vars, ctx) =>
      api.DELETE('/v1/work-items/{id}', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.workItemId } },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
  /** İkinci argüman (`{ context }`) motora aynen geçer: onaylı silme onayın bağlamıyla başlar. */
  async function submit(vars: WorkItemRef, opts?: SubmitOptions) {
    deleting.add(vars.workItemId)
    try {
      return await mutation.submit(vars, opts)
    } finally {
      deleting.delete(vars.workItemId)
    }
  }
  return { ...mutation, submit }
}
