/**
 * `useStanding()` (K1): kullanıcının yetki olguları — `GET /v1/me` (`company_admin`, ad,
 * e-posta) + `GET /v1/me/departments` (ekip satırları) + `GET /v1/programs` (program adları;
 * `organization.membership_required` sinyali, G14). Üçü de S1'dir; anahtarlar KAPSAMSIZDIR
 * (ortak-kurallar §6: `['me']`, `['me','departments']`, `['programs']`), kapsam değişiminde
 * düşmez. Yeni uç yoktur. Ek olarak yönetici için program departman boşluğu (K7):
 * `useProgramDepartmentGap` (S2 `listProgramDepartments`, kapsamlı anahtar).
 */
import type { QueryClient } from '@tanstack/vue-query'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useSessionStore } from '@/shared/session/store'

import { hasErrorCode } from './authority-loss'
import { programDepartmentGap, type DepartmentGap } from './resolve'
import { parsePrograms, parseStanding, type ProgramOption, type Standing } from './standing-facts'
import { useScopeStore } from './store'

/** Anahtarlar tek fabrikadan (`shared/http/query-keys.ts`, ortak-kurallar §6). */
export const STANDING_KEYS = {
  me: queryKeys.me.root(),
  myDepartments: queryKeys.me.departments(),
  programs: queryKeys.programs.all(),
} as const

const STANDING_KEY_LIST: ReadonlyArray<readonly string[]> = Object.values(STANDING_KEYS)

export function isStandingKey(key: readonly unknown[]): boolean {
  return STANDING_KEY_LIST.some(
    (candidate) => candidate.length === key.length && candidate.every((part, i) => part === key[i]),
  )
}

/** Yalnız geçici hatalarda (ağ, 5xx) en çok iki tekrar; 4xx bir hükümdür, tekrarlanmaz. */
function retryTransient(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (!(error instanceof ApiError)) return true
  return error.status === null || error.status >= 500
}

const TRUNCATED_HEADER = 'X-Result-Truncated'

async function withTruncation<D>(
  call: Promise<{ data?: D; error?: unknown; response: Response }>,
): Promise<{ data: D; truncated: boolean }> {
  let truncated = false
  const data = await unwrap(
    call.then((result) => {
      truncated = result.response.headers.get(TRUNCATED_HEADER) === 'true'
      return result
    }),
  )
  return { data, truncated }
}

export async function fetchMe() {
  return unwrap(api.GET('/v1/me'))
}

export async function fetchMyDepartments() {
  return withTruncation(api.GET('/v1/me/departments'))
}

export async function fetchPrograms() {
  const { data, truncated } = await withTruncation(api.GET('/v1/programs'))
  return { programs: parsePrograms(data), truncated }
}

export type StandingStatus = 'idle' | 'loading' | 'error' | 'ready'

/** Standing sorgularını yeniden okutur (K6, odak); devam eden okumayı kesmez. */
export function invalidateStanding(client: QueryClient): Promise<void> {
  return client.invalidateQueries(
    { predicate: (query) => isStandingKey(query.queryKey) },
    { cancelRefetch: false },
  )
}

export function useStanding() {
  const session = useSessionStore()
  const enabled = computed(() => session.isAuthenticated)
  const common = {
    enabled,
    retry: retryTransient,
    staleTime: 30_000,
    // Odak tazelemesi kapsam yaşam döngüsünde tek yerden yapılır (K6).
    refetchOnWindowFocus: false,
  } as const

  const me = useQuery({ ...common, queryKey: STANDING_KEYS.me, queryFn: fetchMe })
  const departments = useQuery({
    ...common,
    queryKey: STANDING_KEYS.myDepartments,
    queryFn: fetchMyDepartments,
  })
  const programs = useQuery({
    ...common,
    queryKey: STANDING_KEYS.programs,
    queryFn: fetchPrograms,
  })

  const standing = computed<Standing | null>(() => {
    const meData = me.data.value
    const list = departments.data.value
    return meData && list ? parseStanding(meData, list.data) : null
  })

  /** G14: hiçbir programda ekip satırı olmayan, yönetici olmayan hesap → `listPrograms` 403. */
  const membershipRequired = computed(() =>
    hasErrorCode(programs.error.value, 'organization.membership_required'),
  )

  const programList = computed<ProgramOption[] | null>(() => programs.data.value?.programs ?? null)

  const error = computed<unknown>(() => {
    if (!me.data.value && me.error.value) return me.error.value
    if (!departments.data.value && departments.error.value) return departments.error.value
    if (
      standing.value?.companyAdmin &&
      !programs.data.value &&
      programs.error.value &&
      !membershipRequired.value
    ) {
      return programs.error.value
    }
    return null
  })

  const status = computed<StandingStatus>(() => {
    if (!enabled.value) return 'idle'
    if (error.value) return 'error'
    if (!standing.value) return 'loading'
    // Kartlar program adlarıyla birlikte görünür (görünüp kaybolma yok, E-00-11).
    if (!programs.data.value && !programs.error.value) return 'loading'
    return 'ready'
  })

  return {
    status,
    error,
    standing,
    programs: programList,
    membershipRequired,
    programsTruncated: computed(() => programs.data.value?.truncated === true),
    departmentsTruncated: computed(() => departments.data.value?.truncated === true),
  }
}

export async function fetchProgramDepartments() {
  return unwrap(api.GET('/v1/program/departments'))
}

/**
 * Yönetici için "programa departman katılmamış" (K7) tespiti: Admin merceğinde, kapsam hazırken
 * `listProgramDepartments` (S2; anahtar `scoped(['departments'])`, ortak-kurallar §6) okunur.
 * Kapsamlı anahtar olduğundan program değişiminde düşer (K2); `linkDepartment` vb. geçersizler.
 * Koordinatör/Üye merceğinde istek atılmaz.
 */
export function useProgramDepartmentGap(scopeReady: () => boolean) {
  const store = useScopeStore()
  const adminScope = computed(
    () => scopeReady() && store.lens === 'admin' && store.programId !== null,
  )
  const query = useQuery({
    queryKey: computed(() => queryKeys.departments.all(store.snapshot)),
    queryFn: fetchProgramDepartments,
    enabled: adminScope,
    retry: retryTransient,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
  return computed<DepartmentGap>(() =>
    programDepartmentGap({
      adminScope: adminScope.value,
      departments: query.data.value?.departments,
      failed: query.error.value !== null,
    }),
  )
}
