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
  onScopeDispose(() => {
    alive = false
  })
  watch(error, async (value) => {
    if (!isMeetingAccessLoss(value)) return
    const program = scope.programId
    const meetingId = id.value
    const generation = authSession.generation
    await invalidateStanding(client)
    if (
      !alive ||
      generation !== authSession.generation ||
      program !== scope.programId ||
      meetingId !== id.value
    )
      return
    void router.push({ name: 'collaboration.meetings', query: listQuery(route.query) })
  })
}
