/** Pencerelerin yetki olguları için çağıran (`ChatActor`): standing + seçili program (mercek hariç). */
import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import type { ChatActor } from '../../model/capabilities'

export function useChatActor() {
  const store = useScopeStore()
  const { standing } = useStanding()
  const actor = computed<ChatActor>(() => ({
    standing: standing.value,
    programId: store.programId,
  }))
  return { actor, standing }
}
