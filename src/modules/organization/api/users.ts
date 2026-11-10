/**
 * Kullanıcı ve hesap uçları (05 `backend.md` §1.1, §2). Hepsi S1 (kapsam başlığı yok); liste
 * yalnız şirket yöneticisine açıktır (ORGANIZATION-K33, P13) — çağıran `enabled`'ı capability'den
 * verir.
 *
 *  - `listUsers` imleçli sonsuz sorgu: `limit` 200, `sort_by=name` + `sort_order` AÇIKÇA
 *    (E-05-10), `search` ad VEYA e-posta (BE-041), `role` / `program_id` / `department_id`
 *    sunucuda (BE-011, v0.14); yanıt `total` + `role_counts` (sekme sayaçları ve liste toplamı
 *    sunucudan, istemci sayımı yok). Süzgeçsiz liste ("Tümü") şirketteki bütün canlı hesaplardır
 *    (ekip satırsız hesaplar dahil; BE-045). Anahtar `['users', filters]` (ortak-kurallar §6);
 *    süzgeç/yön değişince yeni anahtar → eski imleç kullanılmaz. 422 `organization.invalid_sort`
 *    → varsayılan sırayla bir kez yeniden okunur (E-05-10).
 *  - Yazmalar anahtarsız (`useKeylessMutation`). Geçici parola (`updateAccount`) YALNIZ form
 *    belleğinde kalır: mutasyon önbellekte tutulmaz (`gcTime: 0` + `reset()`), dönen sonuçta
 *    taslak yoktur (`redactDraft`), geçersizleme parolayı görmez (KESİN 7; P14).
 */
import {
  useInfiniteQuery,
  useQuery,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, ref, toValue, watch, watchEffect, type MaybeRefOrGetter } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'
import { isDetached, markDetached, type MutationOutcome } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

import { serverRoleOf } from '../model/capabilities'
import type {
  AccountRef,
  AccountResult,
  AccountStatusResult,
  CreateUserInput,
  KnownUser,
  TemporaryPasswordInput,
  TransferOffer,
  UserCountFilters,
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
/** Ardışık boş sayfada otomatik ilerlemenin üst sınırı. */
const MAX_EMPTY_PAGES = 20
const TRANSFER_CODE = 'organization.transfer_available'

function isInvalidSort(error: unknown): boolean {
  return error instanceof ApiError && error.fields.some((f) => f.code === INVALID_SORT)
}

function readUsers(
  filters: UserListFilters,
  cursor: string | undefined,
  sorted: boolean,
  signal?: AbortSignal,
  limit: number = USER_PAGE_LIMIT,
) {
  const search = filters.search?.trim()
  return unwrapList(
    api.GET('/v1/admin/users', {
      params: {
        query: {
          limit,
          ...(sorted ? { sort_by: 'name', sort_order: filters.sortOrder } : {}),
          ...(search ? { search } : {}),
          ...(filters.role ? { role: filters.role } : {}),
          ...(filters.programId ? { program_id: filters.programId } : {}),
          ...(filters.departmentId ? { department_id: filters.departmentId } : {}),
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
 * Sekme sayaçları (BE-011): `role_counts` rol dışı süzgeçlerle (`search`, `program_id`,
 * `department_id`) hesaplanır; `program_id` verilince ekip satırsız hesaplar ve rol sayıları o
 * programa daralır. Sekmeler iki kapsamda çalıştığından (Tümü/Admin şirket geneli, K/Ü seçili
 * program — G16, BE-045) sayaçlar iki `limit=1` okumadan birleştirilir:
 * Tümü/Admin ← kapsamsız yanıt, Koordinatör/Üye ← `program_id`'li yanıt. Koordinatörlük süzgeci
 * seçiliyken tek (program+departman kapsamlı) okuma yeter.
 */
export function useUserCounts(filters: MaybeRefOrGetter<UserCountFilters>) {
  function counts(scoped: boolean) {
    return useQuery(
      computed(() => {
        const f = toValue(filters)
        const withProgram = scoped || f.departmentId ? (f.programId ?? null) : null
        const key = queryKeys.users.list({
          counts: scoped ? 'scoped' : 'all',
          search: f.search?.trim() || null,
          ...(withProgram ? { programId: withProgram } : {}),
          ...(f.departmentId ? { departmentId: f.departmentId } : {}),
        })
        return {
          queryKey: key,
          queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
            readUsers(
              {
                search: f.search,
                sortOrder: 'asc',
                programId: withProgram,
                departmentId: f.departmentId,
              },
              undefined,
              false,
              signal,
              1,
            ),
          ),
          enabled: !scoped || (f.programId ?? null) !== null,
          retry: retryTransient,
          staleTime: ORGANIZATION_STALE_MS,
        }
      }),
    )
  }
  const company = counts(false)
  const program = counts(true)
  return {
    /** Tümü/Admin ve (program yoksa) K/Ü için kapsamsız; program varken K/Ü programlı. */
    counts: computed(() => {
      const all = company.data.value?.role_counts
      const scoped = program.data.value?.role_counts ?? all
      if (!all || !scoped) return null
      return { ...all, koordinator: scoped.koordinator, uye: scoped.uye }
    }),
  }
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
        ...(current.role ? { role: current.role } : {}),
        ...(current.programId ? { programId: current.programId } : {}),
        ...(current.departmentId ? { departmentId: current.departmentId } : {}),
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
  const latest = computed(() => query.data.value?.pages.at(-1)?.page ?? null)
  // Süzgeçli sayfa `limit`ten kısa (boş bile) dönüp `next_cursor` taşıyabilir: boş sayfada istemci
  // `next_cursor` boşalana dek ilerler (satır atlanmaz; BE-011, istemci-akislari §3). Sunucuda
  // imleç her sayfada ilerler (sayfa başına tarama bütçesi sonludur), yani sonsuz döngünün kaynağı
  // sunucu değil istemcidir: devam okuması HATA verince efekt `isFetchingNextPage` düşünce yeniden
  // tetiklenip aynı isteği sonsuza dek yineliyordu (WP3). Hata durumunda otomatik ilerleme durur;
  // kullanıcı "Daha fazla yükle" ile bilinçli sürdürür. Üst sınır SON ardışık boş sayfalarla
  // ölçülür (toplam sayfa sayısıyla değil): dolu sayfalarla biriken uzun liste sınıra takılmaz.
  watchEffect(() => {
    if (!toValue(enabled) || latest.value === null || !noRows(latest.value.users)) return
    const failed = query.isError.value || query.isFetchNextPageError.value
    const exhausted = trailingEmptyPages(query.data.value?.pages ?? []) >= MAX_EMPTY_PAGES
    if (failed || exhausted) return
    if (query.hasNextPage.value && !query.isFetchingNextPage.value) void query.fetchNextPage()
  })
  return {
    query,
    users,
    /** Süzgeçlere uyan toplam hesap (`total`; imleç zincirinin tamamı) — sayfa sayısı değil. */
    total: computed(() => latest.value?.total ?? null),
    /** Rol dışındaki süzgeçlere uyan sekme sayıları (`role_counts`). */
    roleCounts: computed(() => latest.value?.role_counts ?? null),
    // Kesilmiş küme tam değildir: "yüklenen kayıtlar içinde" etiketi kalkmaz (CX-F2-K-03).
    complete: computed(
      () => query.data.value !== undefined && query.hasNextPage.value === false && !truncated.value,
    ),
    truncated,
  }
}

/** Satır listesi boş mu (alan yok = boş). */
const noRows = (users: readonly unknown[] | null | undefined): boolean => (users?.length ?? 0) === 0

/** Sondaki ardışık boş sayfa sayısı (otomatik ilerlemenin üst sınırı bununla ölçülür). */
function trailingEmptyPages(pages: readonly UserPage[]): number {
  let count = 0
  while (count < pages.length && noRows(pages[pages.length - 1 - count]?.page.users)) {
    count += 1
  }
  return count
}

/**
 * `readUser` (S1, yalnız ŞY; BE-043, v0.14): liste satırıyla aynı alanlar + bütün programlardaki
 * ekip satırları. Derin bağlantı ve 05b başlığı liste yüklenmeden kişiyi buradan okur (liste
 * önbelleği/ek `listUsers` taraması yok). Silinmiş/olmayan hesap 404
 * `organization.account_not_found` (`notFound`).
 */
export function useUser(
  accountId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  // Yapışkan etkinlik (WP3): `enabled` çoğu çağıranda "kişi henüz önbellekte değil"dir; okuma
  // önbelleğe düşünce çağıran onu kapatırdı. Pasif gözlemci geçersizlemede yeniden okunmaz
  // (hesap kapat/aç, rol, çip yazmaları sonrası 05b/05 paneli bayat kalıyordu). Veri geldiği an
  // gözlemci o kimlik için etkin kalır.
  const loadedFor = ref<string | null>(null)
  const query = useQuery(
    computed(() => {
      const id = toValue(accountId)
      return {
        queryKey: queryKeys.users.detail(id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          unwrap(api.GET('/v1/admin/users/{id}', { params: { path: { id: id ?? '' } }, signal })),
        ),
        enabled: (toValue(enabled) || (id !== null && loadedFor.value === id)) && !!id,
        retry: retryTransient,
        staleTime: ORGANIZATION_STALE_MS,
      }
    }),
  )
  watch(
    () => query.data.value,
    (data) => {
      if (data !== undefined) loadedFor.value = toValue(accountId)
    },
    { immediate: true },
  )
  return {
    query,
    user: computed<KnownUser | null>(() => query.data.value ?? null),
    notFound: computed(
      () =>
        query.isError.value &&
        query.error.value instanceof ApiError &&
        query.error.value.code === 'organization.account_not_found',
    ),
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
 * `disableAccount` (BE-012, yalnız ŞY): girişi kapatır, oturumları düşürür (`revoked_sessions`);
 * idempotent (`changed`). Atamalar devredilmez. Anahtarsız uç: sonuç bilinmiyorsa kör tekrar yok,
 * liste yeniden okunur (satırdaki `account_status` gerçeği söyler).
 */
export function useDisableAccount() {
  return useKeylessMutation<AccountRef, AccountStatusResult>({
    operation: 'disableAccount',
    send: (vars, ctx) =>
      api.POST('/v1/admin/accounts/{id}/disable', {
        params: { path: { id: vars.accountId } },
        signal: ctx.signal,
      }),
  })
}

/** `enableAccount` (BE-012, yalnız ŞY): kapatılmış hesabı açar (yetki geri gelir); idempotent. */
export function useEnableAccount() {
  return useKeylessMutation<AccountRef, AccountStatusResult>({
    operation: 'enableAccount',
    send: (vars, ctx) =>
      api.POST('/v1/admin/accounts/{id}/enable', {
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
