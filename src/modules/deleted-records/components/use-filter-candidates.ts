/**
 * Süzgeç adayları (E-12-18/19): sunucu aday ucu yoktur, süzgeç sunucuda çalıştığından yüklenen
 * küme süzgeçle daralır. Adaylar bu yüzden bir türün görünümü boyunca BİRİKİR (görülen silenler,
 * görülen koordinatörlük kimlikleri) ve kapsam ya da oturum değişince sıfırlanır; koordinatörlük
 * adayları ayrıca program sözlüğündendir. "Bilinmiyor" silen seçeneği sunulmaz: silen bilinmeyen
 * kayıt `deleted_by` süzgecine eşleşmez, sunucuya gönderilemez (W169 varsayım 12).
 */
import { computed, reactive, watch } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import type { DeletedKind } from '../model/kinds'
import type { DeletedRow } from '../model/types'

export interface ActorCandidate {
  accountId: string
  name: string
}

export function useFilterCandidates(kind: () => DeletedKind, rows: () => readonly DeletedRow[]) {
  const dictionary = useProgramDepartments()
  const seenActors = reactive(new Map<DeletedKind, Map<string, string>>())
  const seenDepartments = reactive(new Map<DeletedKind, Set<string>>())

  watch(
    rows,
    (list) => {
      const k = kind()
      const actors = seenActors.get(k) ?? new Map<string, string>()
      const departments = seenDepartments.get(k) ?? new Set<string>()
      for (const row of list) {
        if (row.actor?.accountId) actors.set(row.actor.accountId, row.actor.name)
        for (const id of row.departmentIds) departments.add(id)
      }
      seenActors.set(k, actors)
      seenDepartments.set(k, departments)
    },
    { immediate: true },
  )

  const reset = () => {
    seenActors.clear()
    seenDepartments.clear()
  }
  const stopScope = useScopeStore().onChange(reset)
  const stopSession = authSession.subscribe(reset)

  const actors = computed<ActorCandidate[]>(() =>
    [...(seenActors.get(kind())?.entries() ?? [])].map(([accountId, name]) => ({
      accountId,
      name,
    })),
  )
  const departments = computed<string[]>(() => [
    ...new Set([...dictionary.byId.value.keys(), ...(seenDepartments.get(kind()) ?? [])]),
  ])
  function dispose(): void {
    stopScope()
    stopSession()
  }
  return { actors, departments, dispose }
}
