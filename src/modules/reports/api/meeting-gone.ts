/**
 * 01g kayıp-kayıt akışı (E-13-73; 13 `mekanizma.md` §2): önizleme okuması ya da PDF indirmesi 404
 * `reporting.not_found` verdiğinde önizleme kapanır (toplantı listesine `replace`), toplantı
 * okumaları geçersizlenir ve TEK bildirim çıkar. Aynı kayıt için tekrar tetiklenmez; başka
 * toplantıya geçilince yeniden silahlanır. Bildirim `useToast()` KURULUMDA alınır (KESİN 26a).
 */
import { useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { t } from '../components/text'

export const NOT_FOUND_CODE = 'reporting.not_found'

export function useMeetingGone() {
  const router = useRouter()
  const client = useQueryClient()
  const scope = useScopeStore()
  const toast = useToast()
  let handled: string | null = null

  return function gone(meetingId: string): void {
    if (handled === meetingId) return
    handled = meetingId
    toast.push({ message: t('reports.states.notFound'), tone: 'danger' })
    void client.invalidateQueries({ queryKey: queryKeys.meetings.all(scope.snapshot) })
    void router.replace({ name: 'collaboration.meetings' })
  }
}
