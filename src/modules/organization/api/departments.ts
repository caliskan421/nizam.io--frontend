/**
 * Departman okumaları ve yazmaları (08 `backend.md` §1–§2; G13, G17).
 *
 *  - `listProgramDepartments` (S2): programdaki ad/kod sözlüğü; anahtar `scoped(['departments'])`
 *    — kabuk K7 tespiti ve work okuyucularıyla AYNI anahtar ve ham şekil (tek istek).
 *  - `listDepartments` (S1, katalog: ad/kod/tür/açıklama) ve `listDeletedDepartments` (S2,
 *    imleçli): `department_exists` sonrası "mevcut departmanı bu programa ekle" eşleşmesi (K7).
 *  - Yazmalar anahtarsız (`useKeylessMutation`): son yazan kazanır, `expected_revision` yok.
 *    İSTİSNA (v0.15, BE-050): `createDepartment` ve `linkDepartment` isteğe bağlı `Idempotency-Key`
 *    alır → kullanıcı eylemi başına anahtar (`useProtectedMutation`); sonuç bilinmiyorsa AYNI
 *    anahtar + gövdeyle tek tekrar (`unknown_outcome.retry`, K5), kör tekrar yok.
 *    Ad iki kavramdır: programdaki ad (`renameDepartmentLink`) ≠ katalog adı/kod/açıklama/tür
 *    (`updateDepartment`, şirket geneli — "tüm sezonlarda geçerli").
 *  - Yeni koordinatörlük = `createDepartment` → `linkDepartment` (E-08-05; iki adım, atomik
 *    değil): ikinci adım ilk eylemin bağlamıyla (`followUps(data, context)` +
 *    `submit(…, { context })`); bağlam değiştiyse gönderilmez, ilk başarı korunur → `partial`.
 */
import {
  useInfiniteQuery,
  useQuery,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/shared/http'
import { runWithFollowUps, useProtectedMutation } from '@/shared/http/mutation'
import type { ActionContext, MutationOutcome } from '@/shared/http/mutation'
import type { ApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import type {
  CreateCoordinatorshipInput,
  CreateDepartmentInput,
  DeletedDepartmentList,
  Department,
  ExistingDepartment,
  LinkDepartmentInput,
  ProgramDepartmentLink,
  RenameDepartmentLinkInput,
  UpdateDepartmentInput,
} from '../model/types'
import {
  DELETED_DEPARTMENT_PAGE_LIMIT,
  isTruncated,
  ORGANIZATION_STALE_MS,
  programHeader,
  readProgramDepartments,
  retryTransient,
  unwrapList,
} from './http'
import { useKeylessMutation } from './keyless'

/**
 * Seçili programın departmanları (ad/kod sözlüğü; 05 E-05-08/20/33, 08 E-08-03/27…29/52).
 * `byId` kimlik → kayıt; `truncated` → "sınıra ulaşmış olabilir".
 */
export function useProgramDepartmentIndex(enabled: MaybeRefOrGetter<boolean> = true) {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.departments.all(scope),
        // Okuyucu kapısı (CX-F2-Ö-01): başka oturumda başlamış okuma bu oturuma yazılmaz.
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          readProgramDepartments(scope.programId ?? '', signal),
        ),
        enabled: toValue(enabled) && scope.programId !== null,
        retry: retryTransient,
        staleTime: ORGANIZATION_STALE_MS,
      }
    }),
  )
  const departments = computed(() => query.data.value?.departments ?? [])
  return {
    query,
    departments,
    byId: computed(() => new Map(departments.value.map((d) => [d.department_id, d]))),
    truncated: computed(() => isTruncated(query.data.value)),
  }
}

/** Katalog (S1, yalnız ŞY): K7 ad eşleşmesi ve form "tür" alanı. */
export function useCatalogDepartments(enabled: MaybeRefOrGetter<boolean> = true) {
  const query = useQuery(
    computed(() => ({
      queryKey: queryKeys.catalog.departments(),
      queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
        unwrapList(api.GET('/v1/departments', { signal })),
      ),
      enabled: toValue(enabled),
      retry: retryTransient,
      staleTime: ORGANIZATION_STALE_MS,
    })),
  )
  return {
    query,
    departments: computed<Department[]>(() => query.data.value?.departments ?? []),
    truncated: computed(() => isTruncated(query.data.value)),
  }
}

/** Silinmiş departmanlar (S2, ŞY, imleçli): ad/kod silinmiş satırda da tekildir (K38). */
export function useDeletedDepartments(enabled: MaybeRefOrGetter<boolean> = true) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.deletedDepartments.all(scope),
        queryFn: sessionBound(
          ({ pageParam, signal }: QueryFunctionContext<QueryKey, string | undefined>) =>
            unwrapList(
              api.GET('/v1/admin/deleted/departments', {
                params: {
                  header: programHeader(scope.programId ?? ''),
                  query: {
                    limit: DELETED_DEPARTMENT_PAGE_LIMIT,
                    ...(pageParam ? { cursor: pageParam } : {}),
                  },
                },
                signal,
              }),
            ),
        ),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last: DeletedDepartmentList) => last.next_cursor || undefined,
        enabled: toValue(enabled) && scope.programId !== null,
        retry: retryTransient,
        staleTime: ORGANIZATION_STALE_MS,
      }
    }),
  )
  return {
    query,
    departments: computed(() => query.data.value?.pages.flatMap((p) => p.departments) ?? []),
    complete: computed(() => query.data.value !== undefined && query.hasNextPage.value === false),
  }
}

// --- Yazmalar ------------------------------------------------------------------------------

const EXISTING_CODE = 'organization.existing_department'

/**
 * 409 `organization.department_exists` zarfındaki mevcut departman (BE-050, v0.15):
 * `fields[field=department_id].message` kimlik, `fields[field=deleted].message` `"true"|"false"`.
 * Kimlik yoksa `null` (zarf eski/biçimsiz).
 */
export function existingDepartment(error: ApiError): ExistingDepartment | null {
  const value = (field: string) =>
    error.fields.find((f) => f.code === EXISTING_CODE && f.field === field)?.value?.trim()
  const departmentId = value('department_id')
  return departmentId ? { departmentId, deleted: value('deleted') === 'true' } : null
}

/**
 * `createDepartment` (S1, ŞY): katalog kaydı. Kod büyük harfe çevrilir (G17). İsteğe bağlı
 * `Idempotency-Key` kullanıcı eylemi başına gönderilir (BE-050); tekrar 200 + ilk kaydın bugünkü
 * hâli.
 */
export function useCreateDepartment() {
  return useProtectedMutation<CreateDepartmentInput, Department>({
    operation: 'createDepartment',
    send: (vars, ctx) =>
      api.POST('/v1/departments', {
        params: { header: { 'Idempotency-Key': ctx.idempotencyKey } },
        body: {
          name: vars.name,
          kind: vars.kind,
          ...(vars.code ? { code: vars.code.toUpperCase() } : {}),
          ...(vars.description ? { description: vars.description } : {}),
        },
        signal: ctx.signal,
      }),
  })
}

/**
 * `linkDepartment` (S2, ŞY): bağ idempotent (var olan bağ 201, ad değişmez); isteğe bağlı
 * `Idempotency-Key` kullanıcı eylemi başına gönderilir (BE-050).
 */
export function useLinkDepartment() {
  return useProtectedMutation<LinkDepartmentInput, ProgramDepartmentLink>({
    operation: 'linkDepartment',
    send: (vars, ctx) =>
      api.POST('/v1/program/departments', {
        params: {
          header: { ...programHeader(vars.programId), 'Idempotency-Key': ctx.idempotencyKey },
        },
        body: {
          department_id: vars.departmentId,
          ...(vars.displayName ? { display_name: vars.displayName } : {}),
          ...(vars.copyMembersFromProgramId
            ? { copy_members_from_program_id: vars.copyMembersFromProgramId }
            : {}),
        },
        signal: ctx.signal,
      }),
  })
}

/** `renameDepartmentLink` (S2, ŞY): yalnız bu programdaki ad. */
export function useRenameDepartmentLink() {
  return useKeylessMutation<RenameDepartmentLinkInput, ProgramDepartmentLink>({
    operation: 'renameDepartmentLink',
    send: (vars, ctx) =>
      api.PATCH('/v1/program/departments/{departmentId}', {
        params: {
          header: programHeader(vars.programId),
          path: { departmentId: vars.departmentId },
        },
        body: { display_name: vars.displayName },
        signal: ctx.signal,
      }),
  })
}

/** `updateDepartment` (S1, ŞY): katalog ad/kod/açıklama/tür — şirket geneli etki. */
export function useUpdateDepartment() {
  return useKeylessMutation<UpdateDepartmentInput, Department>({
    operation: 'updateDepartment',
    send: (vars, ctx) =>
      api.PATCH('/v1/departments/{id}', {
        params: { path: { id: vars.departmentId } },
        body: {
          ...vars.changes,
          ...(vars.changes.code ? { code: vars.changes.code.toUpperCase() } : {}),
        },
        signal: ctx.signal,
      }),
  })
}

/**
 * Yeni koordinatörlük (E-08-05): `createDepartment` → `linkDepartment`. Sonuç `CompositeOutcome`:
 * `primary_failed` (409 `organization.department_exists` → "mevcut departmanı ekle" akışı
 * çağıranda), `complete`, `partial` (katalog kaydı kaldı, bağ kurulamadı → ekran ikinci adımı
 * "mevcut departmanı ekle" olarak yeniden sunar). Adım adı `link`.
 */
export function useCreateCoordinatorship() {
  const create = useCreateDepartment()
  const link = useLinkDepartment()

  const followUps =
    (input: CreateCoordinatorshipInput) =>
    (department: Department, context: ActionContext | undefined) => [
      {
        name: 'link',
        run: () =>
          link.submit(
            {
              programId: input.programId,
              departmentId: department.department_id,
              ...(input.displayName ? { displayName: input.displayName } : {}),
            },
            { context },
          ),
      },
    ]

  function submit(input: CreateCoordinatorshipInput) {
    return runWithFollowUps(() => create.submit(input.department), followUps(input))
  }

  /**
   * "Sonuç bilinmiyor" sonrası `retry` çözülünce (aynı anahtarla): başarıysa bağ adımı İLK
   * eylemin bağlamıyla koşar; başarısızsa birincil hata olarak döner (BE-050, K5).
   */
  function resume(
    input: CreateCoordinatorshipInput,
    primary: MutationOutcome<CreateDepartmentInput, Department, unknown>,
  ) {
    return runWithFollowUps(() => Promise.resolve(primary), followUps(input))
  }

  return {
    submit,
    resume,
    isPending: computed(() => create.isPending.value || link.isPending.value),
  }
}
