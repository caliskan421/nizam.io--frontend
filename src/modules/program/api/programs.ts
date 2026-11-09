/**
 * Program okumaları ve yazmaları (E-00-25; `listPrograms`, `readProgram`, `createProgram`,
 * `updateProgram`, `deleteProgram`, `resetProgram`). Hepsi S1 (`readProgram` S2: program başlığı
 * açıkça yazılır).
 *
 *  - Liste anahtarı `['programs']` (ortak-kurallar §6) — kabuk standing'i ile AYNI anahtar ve
 *    AYNI şekil (`fetchPrograms`, `shared/scope/standing.ts`): tek istek, tek önbellek.
 *  - Yazmalar anahtarsız (`Idempotency-Key` yok; sözleşme istemiyor): sonuç bilinmiyorsa kör
 *    tekrar yok, liste yeniden okunur (`useKeylessMutation`, KESİN 8).
 *  - Başarıda `['programs']` motorun §6 listesiyle yeniden okunur; program yaşamı kapsamı da
 *    etkilediği için (K2) standing (`me`, `me/departments`, `programs`) tazelenir ve silme /
 *    sıfırlamada kapsamlı sorgular geçersizlenir: seçili program silindiyse kabuk yaşam döngüsü
 *    başka programa ya da "program yok" durumuna düşer.
 *  - Silme / sıfırlama parolası yalnız form belleğindedir: mutasyon önbellekte tutulmaz
 *    (`gcTime: 0` + `reset()`), dönen sonuçta taslak parolasızdır (KESİN 7).
 */
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useKeylessMutation } from '@/modules/organization/public'
import { api, unwrap } from '@/shared/http'
import type { MutationOutcome, SendResult, SubmitOptions } from '@/shared/http/mutation'
import { isScopedQueryKey, type OperationId, queryKeys } from '@/shared/http/query-keys'
import { fetchPrograms, invalidateStanding } from '@/shared/scope/standing'
import { sessionBound } from '@/shared/session/query-session'

import type {
  CreateProgramInput,
  PasswordConfirmedInput,
  Program,
  ProgramResetResult,
  UpdateProgramInput,
} from '../model/types'
import { PROGRAM_STALE_MS, programHeader, retryTransient } from './http'

/** Program listesi (`['programs']`; kabukla aynı önbellek girdisi). */
export function useProgramList() {
  const query = useQuery({
    queryKey: queryKeys.programs.all(),
    // Okuyucu kapısı (CX-F1-Ö-08): başka oturumda başlamış okuma bu oturuma yazılmaz (W82c).
    queryFn: sessionBound(fetchPrograms),
    retry: retryTransient,
    staleTime: PROGRAM_STALE_MS,
    refetchOnWindowFocus: false,
  })
  return {
    query,
    programs: computed(() => query.data.value?.programs ?? []),
    truncated: computed(() => query.data.value?.truncated === true),
  }
}

/** Tek program (açıklama dahil; düzenleme formu açılınca kullanıcının açtığı tek kayıt). */
export function fetchProgram(programId: string, signal?: AbortSignal): Promise<Program> {
  return unwrap(api.GET('/v1/program', { params: { header: programHeader(programId) }, signal }))
}

/** Program yaşamı kapsamı etkiler (K2): standing ve (gerekirse) kapsamlı sorgular yeniden okunur. */
async function refreshScope(client: QueryClient, scoped: boolean): Promise<void> {
  const work: Promise<void>[] = [invalidateStanding(client)]
  if (scoped) {
    work.push(client.invalidateQueries({ predicate: (q) => isScopedQueryKey(q.queryKey) }))
  }
  await Promise.all(work)
}

function afterSuccess<V, D>(client: QueryClient, scoped: boolean) {
  return async (outcome: MutationOutcome<V, D, unknown>) => {
    if (outcome.kind === 'success') await refreshScope(client, scoped)
    return outcome
  }
}

export function useCreateProgram() {
  const client = useQueryClient()
  const mutation = useKeylessMutation<CreateProgramInput, Program>({
    operation: 'createProgram',
    queryClient: client,
    send: (vars, ctx) => api.POST('/v1/programs', { body: vars, signal: ctx.signal }),
  })
  const done = afterSuccess<CreateProgramInput, Program>(client, false)
  return {
    submit: async (vars: CreateProgramInput) => done(await mutation.submit(vars)),
    isPending: mutation.isPending,
  }
}

export function useUpdateProgram() {
  const client = useQueryClient()
  const mutation = useKeylessMutation<UpdateProgramInput, Program>({
    operation: 'updateProgram',
    queryClient: client,
    send: (vars, ctx) =>
      api.PATCH('/v1/programs/{id}', {
        params: { path: { id: vars.programId } },
        body: vars.changes,
        signal: ctx.signal,
      }),
  })
  return { submit: mutation.submit, isPending: mutation.isPending }
}

/** Sonuçtaki taslaktan parolayı siler (KESİN 7). */
export function redactPassword<D>(
  outcome: MutationOutcome<PasswordConfirmedInput, D, unknown>,
): MutationOutcome<PasswordConfirmedInput, D, unknown> {
  if (!('draft' in outcome)) return outcome
  return { ...outcome, draft: { programId: outcome.draft.programId, password: '' } }
}

function usePasswordConfirmed<D>(
  operation: OperationId,
  send: (vars: PasswordConfirmedInput, signal: AbortSignal) => Promise<SendResult<D>>,
) {
  const client = useQueryClient()
  const mutation = useKeylessMutation<PasswordConfirmedInput, D>({
    operation,
    queryClient: client,
    gcTime: 0,
    send: (vars, ctx) => send(vars, ctx.signal),
  })
  const done = afterSuccess<PasswordConfirmedInput, D>(client, true)
  async function submit(vars: PasswordConfirmedInput, opts?: SubmitOptions) {
    try {
      return redactPassword(await done(await mutation.submit(vars, opts)))
    } finally {
      mutation.reset()
    }
  }
  return { submit, isPending: mutation.isPending }
}

export function useDeleteProgram() {
  return usePasswordConfirmed<undefined>('deleteProgram', (vars, signal) =>
    api.DELETE('/v1/programs/{id}', {
      params: { path: { id: vars.programId } },
      body: { password: vars.password },
      signal,
    }),
  )
}

export function useResetProgram() {
  return usePasswordConfirmed<ProgramResetResult>('resetProgram', (vars, signal) =>
    api.POST('/v1/programs/{id}/reset', {
      params: { path: { id: vars.programId } },
      body: { password: vars.password },
      signal,
    }),
  )
}
