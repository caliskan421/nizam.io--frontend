/**
 * Ekip okumaları ve üyelik/koordinatör yazmaları (05/08 `backend.md` §1–§2). Hepsi S2: yalnız
 * `X-Nizamio-Program`; departman yol parametresi (`/v1/departments/{id}/…`), departman başlığı
 * gönderilmez. Anahtarlar `queryKeys.departments.members` (work görev atama adaylarıyla AYNI
 * anahtar, ham `RosterList`) ve `queryKeys.departments.assignable`.
 *
 * Yazmalar anahtarsızdır (`useKeylessMutation`): kör tekrar yok, sonuç bilinmiyorsa liste
 * yeniden okunur. `confirmation_required` döndüren üç uç (`updateMembershipRole` gövde,
 * `removeMember` / `removeCoordinator` sorgu) ortak onayla (`useImpactConfirmedWrite`)
 * sarılıdır; `submit(vars, confirmOptions, opts?)` vazgeçte `null` döner.
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { serverRoleOf } from '../model/capabilities'
import type {
  AssignCoordinatorInput,
  AssignMembershipInput,
  ChangeRoleInput,
  CoordinatorResult,
  Membership,
  MembershipChange,
  MemberRef,
} from '../model/types'
import { useImpactConfirmedWrite } from './confirm'
import {
  isTruncated,
  ORGANIZATION_STALE_MS,
  programHeader,
  retryTransient,
  unwrapList,
} from './http'
import { useKeylessMutation } from './keyless'

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/** `listMembers` (S2; ŞY ve o departmanın K; Ü 403). `status = deleted` satırları da gelir. */
export function fetchRoster(programId: string, departmentId: string, signal?: AbortSignal) {
  return unwrapList(
    api.GET('/v1/departments/{id}/members', {
      params: { header: programHeader(programId), path: { id: departmentId } },
      signal,
    }),
  )
}

/** `listAssignable` (S2; yalnız K — ŞY 403, ORGANIZATION-K16). */
export function fetchAssignable(programId: string, departmentId: string, signal?: AbortSignal) {
  return unwrapList(
    api.GET('/v1/departments/{id}/assignable', {
      params: { header: programHeader(programId), path: { id: departmentId } },
      signal,
    }),
  )
}

function departmentQuery<D>(
  key: typeof queryKeys.departments.members,
  fetcher: (programId: string, departmentId: string, signal?: AbortSignal) => Promise<D>,
  departmentId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(departmentId)
      return {
        queryKey: key(scope, id ?? ''),
        // Okuyucu kapısı (CX-F2-Ö-01): başka oturumda başlamış okuma bu oturuma yazılmaz.
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetcher(scope.programId ?? '', id ?? '', signal),
        ),
        enabled: toValue(enabled) && id !== null && id !== '' && scope.programId !== null,
        retry: retryTransient,
        staleTime: ORGANIZATION_STALE_MS,
      }
    }),
  )
}

/**
 * Tek birimin ekibi (08b Ekip/Üyeler, E-08-53/59/78/81; 05 koordinatörlük süzgeci E-05-08):
 * tek istek, ≤200. `members` ad sırasıyla (`tr`) bütün satırlar (silinmiş dahil, soluk gösterim
 * çağıranda); `active` yalnız `status = active`. `truncated` → "liste eksik olabilir".
 */
export function useDepartmentRoster(
  departmentId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const query = departmentQuery(queryKeys.departments.members, fetchRoster, departmentId, enabled)
  const members = computed(() =>
    [...(query.data.value?.members ?? [])].sort((a, b) =>
      collator.compare(a.full_name, b.full_name),
    ),
  )
  return {
    query,
    members,
    active: computed(() => members.value.filter((m) => m.status === 'active')),
    truncated: computed(() => isTruncated(query.data.value)),
  }
}

/** Atanabilir havuz (yalnız koordinatör merceği; F2 yönetim ekranlarında ŞY `listUsers` kullanır). */
export function useAssignableAccounts(
  departmentId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const query = departmentQuery(
    queryKeys.departments.assignable,
    fetchAssignable,
    departmentId,
    enabled,
  )
  return {
    query,
    accounts: computed(() => query.data.value?.accounts ?? []),
    truncated: computed(() => isTruncated(query.data.value)),
  }
}

// --- Yazmalar ------------------------------------------------------------------------------

/** `assignMembership` (ŞY ∨ K; onay kapısı yok → istemci onayı gerekmez, §7). */
export function useAssignMembership() {
  return useKeylessMutation<AssignMembershipInput, Membership>({
    operation: 'assignMembership',
    send: (vars, ctx) =>
      api.POST('/v1/departments/{id}/memberships', {
        params: { header: programHeader(vars.programId), path: { id: vars.departmentId } },
        body: { account_id: vars.accountId, role: serverRoleOf(vars.role) },
        signal: ctx.signal,
      }),
  })
}

/** `assignCoordinator` (yalnız ŞY; idempotent `changed`; onay kapısı yok). */
export function useAssignCoordinator() {
  return useKeylessMutation<AssignCoordinatorInput, CoordinatorResult>({
    operation: 'assignCoordinator',
    send: (vars, ctx) =>
      api.POST('/v1/departments/{id}/coordinator', {
        params: { header: programHeader(vars.programId), path: { id: vars.departmentId } },
        body: { account_id: vars.accountId },
        signal: ctx.signal,
      }),
  })
}

/** `updateMembershipRole` — onay GÖVDEDE (`confirm: true`). */
export function useUpdateMembershipRole() {
  return useImpactConfirmedWrite(
    useKeylessMutation<ChangeRoleInput, MembershipChange>({
      operation: 'updateMembershipRole',
      send: (vars, ctx) =>
        api.PATCH('/v1/departments/{id}/memberships/{accountId}', {
          params: {
            header: programHeader(vars.programId),
            path: { id: vars.departmentId, accountId: vars.accountId },
          },
          body: { role: serverRoleOf(vars.role), ...(ctx.confirm ? { confirm: true } : {}) },
          signal: ctx.signal,
        }),
    }),
  )
}

/** `removeMember` — onay SORGUDA (`?confirm=true`); aktif atamalar işlemi yapana devredilir. */
export function useRemoveMember() {
  return useImpactConfirmedWrite(
    useKeylessMutation<MemberRef, MembershipChange>({
      operation: 'removeMember',
      send: (vars, ctx) =>
        api.DELETE('/v1/departments/{id}/memberships/{accountId}', {
          params: {
            header: programHeader(vars.programId),
            path: { id: vars.departmentId, accountId: vars.accountId },
            ...(ctx.confirm ? { query: { confirm: 'true' } } : {}),
          },
          signal: ctx.signal,
        }),
    }),
  )
}

/** `removeCoordinator` — onay SORGUDA; satırı silmez, rolü `uye`'ye indirir (kod okuması). */
export function useRemoveCoordinator() {
  return useImpactConfirmedWrite(
    useKeylessMutation<MemberRef, MembershipChange>({
      operation: 'removeCoordinator',
      send: (vars, ctx) =>
        api.DELETE('/v1/departments/{id}/coordinator/{accountId}', {
          params: {
            header: programHeader(vars.programId),
            path: { id: vars.departmentId, accountId: vars.accountId },
            ...(ctx.confirm ? { query: { confirm: 'true' } } : {}),
          },
          signal: ctx.signal,
        }),
    }),
  )
}
