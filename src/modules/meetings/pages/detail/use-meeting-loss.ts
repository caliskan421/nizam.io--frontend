import { useQueryClient } from '@tanstack/vue-query'
import { onScopeDispose, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authSession } from '@/shared/http'
import { ApiError } from '@/shared/errors/api-error'
import { invalidateStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { listQuery } from './list-query'

export function isMeetingAccessLoss(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

/** Yetki/kayıt kaybında standing tazelenir; eski sayfanın geç sonucu gezinme başlatmaz. */
export function useMeetingLoss(error: Ref<unknown>, id: Ref<string | null>): void {
  const client = useQueryClient()
  const scope = useScopeStore()
  const route = useRoute()
  const router = useRouter()
  let alive = true
  let scopeVersion = 0
  const offScope = scope.onChange(() => {
    scopeVersion += 1
  })
  onScopeDispose(() => {
    alive = false
    offScope()
  })
  watch(
    error,
    async (value, _previous, onCleanup) => {
      if (!isMeetingAccessLoss(value)) return
      let current = true
      onCleanup(() => {
        current = false
      })
      const snapshot = { ...scope.snapshot }
      const version = scopeVersion
      const meetingId = id.value
      const generation = authSession.generation
      await invalidateStanding(client)
      const now = scope.snapshot
      if (
        !alive ||
        !current ||
        error.value !== value ||
        version !== scopeVersion ||
        generation !== authSession.generation ||
        meetingId !== id.value ||
        snapshot.programId !== now.programId ||
        snapshot.departmentId !== now.departmentId ||
        snapshot.lens !== now.lens
      )
        return
      void router.push({ name: 'collaboration.meetings', query: listQuery(route.query) })
    },
    { immediate: true },
  )
}
