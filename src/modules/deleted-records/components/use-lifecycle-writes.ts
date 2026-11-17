/**
 * Tekil yaşam döngüsü yazmaları: gerçek tür × eylem → gönderici (dokuz tür). Göndericiler
 * `use-lifecycle-hub`tan gelir (kurulumda kurulmuş hook'lar); S2 hedefi eylem anında dondurulur
 * (program başlığı eylemin kapsamından gider), hesap uçları S1'dir. `Idempotency-Key`/
 * `expected_revision` yok. `pending`: herhangi bir yazma uçuşta. Toplantı yazmaları `meetings`
 * modülündendir.
 */
import { LIFECYCLE_KINDS, type LifecycleKind } from '../model/lifecycle'
import type { LifecycleAction } from '../model/outcome'
import type { DeletedRow } from '../model/types'
import { useScopeStore } from '@/shared/scope/store'
import type { ActionContext } from '@/shared/http/mutation'

import { useLifecycleHub, type LifecycleHub, type LifecycleOutcome } from './use-lifecycle-hub'

export type { LifecycleOutcome }
export type LifecycleSend = (row: DeletedRow, context: ActionContext) => Promise<LifecycleOutcome>

export function useLifecycleWrites(hub: LifecycleHub = useLifecycleHub()) {
  const scope = useScopeStore()
  const send =
    (kind: LifecycleKind, action: LifecycleAction): LifecycleSend =>
    (row, context) =>
      hub.single[kind][action](row.id, scope.programId ?? '', context)
  const senders = Object.fromEntries(
    LIFECYCLE_KINDS.map((kind) => [
      kind,
      { restore: send(kind, 'restore'), purge: send(kind, 'purge') },
    ]),
  ) as Record<LifecycleKind, Record<LifecycleAction, LifecycleSend>>
  return { senders, pending: hub.pending }
}
