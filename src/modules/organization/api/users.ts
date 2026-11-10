/**
 * Kullanıcı ve hesap uçları (05 `backend.md` §1.1, §2). Hepsi S1 (kapsam başlığı yok); liste
 * yalnız şirket yöneticisine açıktır (ORGANIZATION-K33, P13) — çağıran `enabled`'ı capability'den
 * verir.
 *
 *  - `listUsers` imleçli sonsuz sorgu: `limit` 200, `sort_by=name` + `sort_order` AÇIKÇA
 *    (E-05-10), `search` yalnız ad (E-05-07). Rol süzgeci sunucuya gönderilmez (ret: "herhangi bir
 *    programda" anlamı, G16) — sekmeler yüklenen kümede istemcide. Anahtar `['users', filters]`
 *    (ortak-kurallar §6); süzgeç/yön değişince yeni anahtar → eski imleç kullanılmaz. 422
 *    `organization.invalid_sort` → varsayılan sırayla bir kez yeniden okunur (E-05-10).
 *  - Yazmalar anahtarsız (`useKeylessMutation`). Geçici parola (`updateAccount`) YALNIZ form
 *    belleğinde kalır: mutasyon önbellekte tutulmaz (`gcTime: 0` + `reset()`), dönen sonuçta
 *    taslak yoktur (`redactDraft`), geçersizleme parolayı görmez (KESİN 7; P14).
 */
import { useInfiniteQuery, type QueryFunctionContext, type QueryKey } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { api } from '@/shared/http'
import { isDetached, markDetached, type MutationOutcome } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

import { serverRoleOf } from '../model/capabilities'
import type {
  AccountRef,
  AccountResult,
  CreateUserInput,
  KnownUser,
  TemporaryPasswordInput,
  TransferOffer,
  UpdateUserInput,
  UserListFilters,
  UserPage,
  UserResult,
} from '../model/types'
import {
  isTruncated,
  ORGANIZATION_STALE_MS,
  retryTransient,
  unwrapList,
  USER_PAGE_LIMIT,
} from './http'
import { useKeylessMutation } from './keyless'

const INVALID_SORT = 'organization.invalid_sort'
const TRANSFER_CODE = 'organization.transfer_available'

function isInvalidSort(error: unknown): boolean {
  return error instanceof ApiError && error.fields.some((f) => f.code === INVALID_SORT)
}

function readUsers(
  filters: UserListFilters,
  cursor: string | undefined,
  sorted: boolean,
  signal?: AbortSignal,
) {
  const search = filters.search?.trim()
  return unwrapList(
    api.GET('/v1/admin/users', {
      params: {
        query: {
          limit: USER_PAGE_LIMIT,
          ...(sorted ? { sort_by: 'name', sort_order: filters.sortOrder } : {}),
          ...(search ? { search } : {}),
          ...(cursor ? { cursor } : {}),
        },
      },
      signal,
    }),
  )
}

/** Tek `listUsers` sayfası + kesme bayrağı. */
export async function fetchUserPage(
  filters: UserListFilters,
  cursor: string | undefined,
  signal?: AbortSignal,
): Promise<UserPage> {
  let page
  try {
    page = await readUsers(filters, cursor, true, signal)
  } catch (error) {
    if (!isInvalidSort(error)) throw error
    page = await readUsers(filters, undefined, false, signal)
  }
  return { page, truncated: isTruncated(page) }
}

/**
 * Şirket geneli kullanıcı listesi (E-05-03, E-05-13, E-05-23). "Daha fazla yükle" =
 * `fetchNextPage()`. `complete` imleç bitince VE hiçbir sayfa kesilmemişse `true` (yalnız o zaman
 * "Toplam N"; §10; CX-F2-K-03); `truncated` herhangi bir sayfada sunucu kestiyse.
 */
export function useUserList(
  filters: MaybeRefOrGetter<UserListFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const query = useInfiniteQuery(
    computed(() => {
      const current = toValue(filters)
      const key: QueryKey = queryKeys.users.list({
        search: current.search?.trim() || null,
        sortOrder: current.sortOrder,
      })
      return {
        queryKey: key,
        // Okuyucu kapısı (CX-F2-Ö-01): başka oturumda başlamış okuma bu oturuma yazılmaz.
        queryFn: sessionBound(
          ({ pageParam, signal }: QueryFunctionContext<QueryKey, string | undefined>) =>
            fetchUserPage(current, pageParam, signal),
        ),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last: UserPage) => last.page.next_cursor || undefined,
        enabled: toValue(enabled),
        retry: retryTransient,
        staleTime: ORGANIZATION_STALE_MS,
      }
    }),
  )
  const users = computed<KnownUser[]>(
    () => query.data.value?.pages.flatMap((p) => p.page.users ?? []) ?? [],
  )
  const truncated = computed(() => query.data.value?.pages.some((p) => p.truncated) === true)
  return {
    query,
    users,
    // Kesilmiş küme tam değildir: "yüklenen kayıtlar içinde" etiketi kalkmaz (CX-F2-K-03).
    complete: computed(
      () => query.data.value !== undefined && query.hasNextPage.value === false && !truncated.value,
    ),
    truncated,
  }
}

/**
 * 409 `identity.account_exists` + alan `organization.transfer_available` (E-05-05). Teklif
 * `fields[]`'ta üç girdidir (`email`, `account_id`, `user_full_name`; değer `message`'tadır, ApiError
 * `value`). Koordinatörde ve hesap hedef ekipte zaten varken girdiler gelmez (K22).
 */
export function isTransferAvailable(error: ApiError): boolean {
  return error.fields.some((f) => f.code === TRANSFER_CODE)
}

export function transferOffer(error: ApiError): TransferOffer | null {
  const value = (field: string) =>
    error.fields.find((f) => f.code === TRANSFER_CODE && f.field === field)?.value?.trim() || null
  const accountId = value('account_id')
  return accountId ? { accountId, fullName: value('user_full_name') } : null
}

// --- Yazmalar ------------------------------------------------------------------------------

/** `createUser` (S1): hesap + seçili programdaki ilk ekip satırı; parola yanıtta DÖNMEZ. */
export function useCreateUser() {
  return useKeylessMutation<CreateUserInput, UserResult>({
    operation: 'createUser',
    send: (vars, ctx) =>
      api.POST('/v1/admin/users', {
        body: {
          email: vars.email,
          program_id: vars.programId,
          department_id: vars.departmentId,
          role: serverRoleOf(vars.role),
          ...(vars.fullName ? { full_name: vars.fullName } : {}),
          ...(vars.transferAccountId ? { transfer_account_id: vars.transferAccountId } : {}),
        },
        signal: ctx.signal,
      }),
  })
}

/** `updateUser` (S1): ad / e-posta / şirket yöneticiliği; gönderilmeyen alan değişmez. */
export function useUpdateUser() {
  return useKeylessMutation<UpdateUserInput, UserResult>({
    operation: 'updateUser',
    send: (vars, ctx) => {
      const { fullName, email, companyAdmin } = vars.changes
      return api.PATCH('/v1/admin/users/{id}', {
        params: { path: { id: vars.accountId } },
        body: {
          ...(fullName !== undefined ? { full_name: fullName } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(companyAdmin !== undefined ? { company_admin: companyAdmin } : {}),
        },
        signal: ctx.signal,
      })
    },
  })
}

/** `deleteUser` (S1): onay kapısı yok → istemci yıkıcı onayı çağıranda (atamalar devredilir). */
export function useDeleteUser() {
  return useKeylessMutation<AccountRef, UserResult>({
    operation: 'deleteUser',
    send: (vars, ctx) =>
      api.DELETE('/v1/admin/users/{id}', {
        params: { path: { id: vars.accountId } },
        signal: ctx.signal,
      }),
  })
}

/** `unlockAccount` (yalnız ŞY): 409 `identity.account_not_locked` → "Hesap kilitli değil". */
export function useUnlockAccount() {
  return useKeylessMutation<AccountRef, AccountResult>({
    operation: 'unlockAccount',
    send: (vars, ctx) =>
      api.POST('/v1/admin/accounts/{id}/unlock', {
        params: { path: { id: vars.accountId } },
        signal: ctx.signal,
      }),
  })
}

/**
 * Sonuçtan gönderim taslağını çıkarır (parola sonuç nesnesine girmez). Taslak taşıyan sonuçlar
 * (`unknown_outcome`, `scope_changed`, `owner_disposed`, `edit_conflict`) yalnız hesap kimliğiyle
 * döner; `retry` zaten yoktur (anahtarsız uç).
 */
export function redactDraft(
  outcome: MutationOutcome<TemporaryPasswordInput, AccountResult, unknown>,
): MutationOutcome<TemporaryPasswordInput, AccountResult, unknown> {
  if (!('draft' in outcome)) return outcome
  const redacted = { ...outcome, draft: { accountId: outcome.draft.accountId, password: '' } }
  // Sahibi sökülmüş (geç) sonuç işareti korunur (CX-F1-Ö-07, W82c).
  return isDetached(outcome) ? markDetached(redacted) : redacted
}

/**
 * "Geçici parola belirle" (05 satır dışı; P14): `updateAccount {password, force_password_change:
 * true}` (yalnız ŞY, ORGANIZATION-K36). Yanıt `revoked_sessions`. Parola hiçbir önbellekte kalmaz.
 */
export function useSetTemporaryPassword() {
  const mutation = useKeylessMutation<TemporaryPasswordInput, AccountResult>({
    operation: 'updateAccount',
    gcTime: 0,
    send: (vars, ctx) =>
      api.PATCH('/v1/admin/accounts/{id}', {
        params: { path: { id: vars.accountId } },
        body: { password: vars.password, force_password_change: true },
        signal: ctx.signal,
      }),
  })
  async function submit(vars: TemporaryPasswordInput) {
    try {
      return redactDraft(await mutation.submit(vars))
    } finally {
      mutation.reset()
    }
  }
  return { submit, isPending: mutation.isPending }
}
