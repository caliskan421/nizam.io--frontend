/**
 * Kapsam yaşam döngüsü (K2, K6). Kabukta BİR kez kurulur (`useScopeLifecycle()`):
 *
 *  1. Standing (`me` + `me/departments` + programlar) geldikçe kapsam `resolveScope` ile
 *     çözülür ve depoya yazılır; hatırlanan kimlikler güncellenir.
 *  2. Kapsam (program / mercek / departman) her değiştiğinde `scopedKey(...)` ile başlayan
 *     BÜTÜN sorgular iptal edilir ve önbellekten düşer: eski kapsamın verisi hiç görünmez.
 *  3. Yetki kaybı (K6 + Y1 kodları) bir sorgu ya da mutasyondan gelince standing geçersizlenir;
 *     yeni olgularla kapsam yeniden doğrulanır (geçersiz seçim düşer: tek seçenekte otomatik,
 *     çokta seçici).
 *  4. Pencere görünür olunca / odağa dönünce standing tazelenir.
 *
 * Mercek ≠ yetki (ortak-kurallar §1): `facts` mercekten bağımsızdır; mercek yalnız kapsamı
 * (ve dolayısıyla başlıkları + sorgu anahtarlarını) belirler.
 */
import type { Mutation, Query, QueryClient } from '@tanstack/vue-query'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, onScopeDispose, shallowRef, watch } from 'vue'

import { isAuthorityLoss } from './authority-loss'
import { resolveScope, type ScopeResolution } from './resolve'
import { isScopedKey, type ScopeLens } from './scope'
import { invalidateStanding, isStandingKey, useStanding } from './standing'
import {
  departmentOptions,
  lensOptions,
  programOptions,
  scopeFacts,
  type ScopeFacts,
} from './standing-facts'
import { useScopeStore } from './store'

/** Kapsamlı sorguları iptal eder ve önbellekten düşürür (K2). */
export function purgeScopedQueries(client: QueryClient): void {
  const filters = { predicate: (query: Query) => isScopedKey(query.queryKey) }
  void client.cancelQueries(filters)
  client.removeQueries(filters)
}

export type ScopeStatus = 'idle' | 'loading' | 'error' | 'empty' | 'selecting' | 'ready'

export interface ScopeLifecycleTarget {
  window: Pick<Window, 'addEventListener' | 'removeEventListener'>
  document: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>
}

function watchAuthorityLoss(client: QueryClient, onLoss: () => void): () => void {
  const offQueries = client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'error') return
    if (isStandingKey(event.query.queryKey)) return
    if (isAuthorityLoss(event.action.error)) onLoss()
  })
  const offMutations = client.getMutationCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'error') return
    const mutation: Mutation<unknown, unknown, unknown, unknown> = event.mutation
    if (isAuthorityLoss(mutation.state.error)) onLoss()
  })
  return () => {
    offQueries()
    offMutations()
  }
}

function watchFocus(target: ScopeLifecycleTarget, onFocus: () => void): () => void {
  const onVisibility = () => {
    if (target.document.visibilityState === 'visible') onFocus()
  }
  target.document.addEventListener('visibilitychange', onVisibility)
  target.window.addEventListener('focus', onFocus)
  return () => {
    target.document.removeEventListener('visibilitychange', onVisibility)
    target.window.removeEventListener('focus', onFocus)
  }
}

export function useScopeLifecycle(
  target: ScopeLifecycleTarget = { window: globalThis.window, document: globalThis.document },
) {
  const client = useQueryClient()
  const store = useScopeStore()
  const standing = useStanding()
  const resolution = shallowRef<ScopeResolution | null>(null)

  const refreshStanding = () => {
    if (standing.status.value === 'idle') return
    void invalidateStanding(client)
  }

  const offChange = store.onChange(() => purgeScopedQueries(client))
  const offLoss = watchAuthorityLoss(client, refreshStanding)
  const offFocus = watchFocus(target, refreshStanding)
  onScopeDispose(() => {
    offChange()
    offLoss()
    offFocus()
  })

  function reconcile(): void {
    const facts = standing.standing.value
    if (standing.status.value !== 'ready' || !facts) {
      resolution.value = null
      return
    }
    const next = resolveScope({
      standing: facts,
      programs: standing.programs.value,
      membershipRequired: standing.membershipRequired.value,
      current: {
        programId: store.programId,
        lens: store.lens,
        departmentId: store.departmentId,
      },
      remembered: store.remembered(),
    })
    resolution.value = next
    store.commit(next.selection)
    store.persist()
  }

  watch(
    [
      standing.status,
      standing.standing,
      standing.programs,
      standing.membershipRequired,
      () => store.snapshot,
    ],
    reconcile,
    { immediate: true },
  )

  const programs = computed(() =>
    standing.standing.value ? programOptions(standing.standing.value, standing.programs.value) : [],
  )
  const lenses = computed(() =>
    standing.standing.value && store.programId
      ? lensOptions(standing.standing.value, store.programId)
      : [],
  )
  const departments = computed(() =>
    standing.standing.value && store.programId && store.lens
      ? departmentOptions(standing.standing.value, store.programId, store.lens)
      : [],
  )

  const status = computed<ScopeStatus>(() => {
    const s = standing.status.value
    if (s !== 'ready') return s
    const r = resolution.value
    return r ? (r.kind === 'ready' ? 'ready' : r.kind) : 'loading'
  })

  /** Seçili kapsamdaki yetki olguları; mercek değişimi `companyAdmin`'i değiştirmez (P1). */
  const facts = computed<ScopeFacts>(() =>
    scopeFacts(standing.standing.value, store.programId, store.departmentId),
  )

  return {
    status,
    error: standing.error,
    standing: standing.standing,
    facts,
    programs,
    lenses,
    departments,
    /** Seçici hangi basamakta açık olmalı (çok seçenek + hatırlanan yok). */
    pending: computed(() =>
      resolution.value?.kind === 'selecting' ? resolution.value.pending : null,
    ),
    /** K7 açık durumu. */
    emptyReason: computed(() =>
      resolution.value?.kind === 'empty' ? resolution.value.reason : null,
    ),
    /** Tek mercekli kullanıcıda Rol kartı salt gösterimdir (P11). */
    lensFixed: computed(() => lenses.value.length <= 1),
    programsTruncated: standing.programsTruncated,
    departmentsTruncated: standing.departmentsTruncated,
    selectProgram: (programId: string) => store.setProgram(programId),
    selectLens: (lens: ScopeLens) => store.setLens(lens),
    selectDepartment: (departmentId: string) => store.setDepartment(departmentId),
    refreshStanding,
  }
}
