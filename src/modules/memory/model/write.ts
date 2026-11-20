import { useQueryClient } from '@tanstack/vue-query'
import { onScopeDispose, shallowRef } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'

import { useMemoryScope } from './capabilities'

export function useMemoryWrite() {
  const scope = useMemoryScope()
  const client = useQueryClient()
  const pending = shallowRef(false)
  const error = shallowRef<ApiError | null>(null)
  let active = true
  onScopeDispose(() => {
    active = false
  })
  async function submit<T>(write: (program: string) => Promise<T>, saved?: (data: T) => void) {
    const program = scope.program.value
    if (!program || pending.value) return
    const generation = authSession.generation
    const audience = scope.audience.value
    const snapshot = scope.store.snapshot
    const current = () =>
      active &&
      authSession.generation === generation &&
      scope.program.value === program &&
      scope.audience.value === audience
    const refresh = () => client.invalidateQueries({ queryKey: queryKeys.memory.all(snapshot) })
    pending.value = true
    error.value = null
    try {
      const data = await write(program)
      if (authSession.generation === generation) await refresh()
      if (current()) saved?.(data)
    } catch (failure) {
      if (!current()) return
      error.value =
        failure instanceof ApiError ? failure : new ApiError({ code: 'client.network_error' })
      await refresh()
    } finally {
      if (active) pending.value = false
    }
  }
  return { scope, pending, error, submit }
}
