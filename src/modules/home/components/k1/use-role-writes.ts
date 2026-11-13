/**
 * K1/Ü1 yazmaları (E-K1-17/22, E-Ü1-12/14/15): 03'ün durum geçişi ve atama yazmalarının aynı
 * koruması — hepsi `useProtectedMutation` (K5), iyimser güncelleme yok, sorgu anahtarları
 * geçersizleme listesinden. Yeni yazma ucu yoktur.
 *
 *  - `to = tamamlandi` + 409 `work.subtasks_open` → ortak onay (`confirmWrite`) → AYNI hedef
 *    `close_subtasks: true` yeni eylem, ilk eylemin bağlamıyla (CX-F1-E-02).
 *  - 422 `work.attachment_required` → "önce kanıt yükleyin" + `requestEvidence` (Ü1 yükleme
 *    penceresini açar).
 *  - 409 ailesi / sonuç bilinmiyor → görev ve listeler eylemin KENDİ kapsamında yeniden okunur;
 *    otomatik tekrar yok. Sahibi sökülmüş sonuç: bildirim/yeniden okuma yok (`reachesOwner`).
 * `useToast`/`useConfirm` kurulumda alınır (KESİN 26).
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'

import {
  targetOf,
  useAddAssignments,
  useOwnStatusWorkItem,
  useTransitionWorkItem,
  type WorkItem,
  type WorkItemStatus,
} from '@/modules/work/public'
import { reachesOwner, type ActionContext, type MutationOutcome } from '@/shared/http/mutation'
import { invalidationFilters } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { homeText } from '../../model/messages'

type Outcome = MutationOutcome<unknown, unknown, unknown>
type ConfirmWrite = ReturnType<typeof useConfirm>['confirmWrite']
export type MoveVia = 'transition' | 'own'
export type MoveSuccess =
  'home.k1.write.approved' | 'home.k1.write.returned' | 'home.u1.queue.wrote'

export interface RoleWriteHooks {
  /** `work.attachment_required`: kanıt yükleme penceresini açar (Ü1). */
  requestEvidence?: (item: WorkItem) => void
}

const codeOf = (o: Outcome) => (o.kind === 'failed' ? o.error.code : null)

function needsReread(o: Outcome): boolean {
  if (o.kind === 'unknown_outcome' || o.kind === 'conflict_retry') return true
  return o.kind === 'failed' && o.error.status === 409
}

/** 409 / sonuç bilinmiyor sonrası görev ve listeler eylemin KENDİ kapsamında yeniden okunur. */
function reread(client: QueryClient, o: Outcome, fallback: ScopeSnapshot, id: string): void {
  if (!needsReread(o)) return
  const scope = (o.kind === 'failed' && o.context?.scope) || fallback
  for (const filter of invalidationFilters('transitionWorkItem', scope, { workItemId: id })) {
    void client.invalidateQueries(filter)
  }
}

function confirmSubtasks(
  confirmWrite: ConfirmWrite,
  o: Outcome,
  resend: (context: ActionContext) => Promise<Outcome>,
): Promise<Outcome | null> {
  const first = o.kind === 'failed' ? o.context : undefined
  return confirmWrite(
    {
      title: homeText('home.k1.write.subtasksTitle'),
      body: [homeText('home.k1.write.subtasksBody')],
      confirmLabel: homeText('home.k1.write.subtasksConfirm'),
      tone: 'primary',
    },
    resend,
    { context: first },
  )
}

function useMoves(hooks: RoleWriteHooks) {
  const client = useQueryClient()
  const store = useScopeStore()
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const transition = useTransitionWorkItem()
  const own = useOwnStatusWorkItem()

  function send(
    item: WorkItem,
    to: WorkItemStatus,
    via: MoveVia,
    close: boolean,
    context?: ActionContext,
  ): Promise<Outcome> {
    return (via === 'own' ? own : transition).submit(
      {
        target: targetOf(item),
        workItemId: item.work_item_id,
        body: close ? { to, close_subtasks: true } : { to },
      },
      { context },
    )
  }

  async function settle(item: WorkItem, to: WorkItemStatus, via: MoveVia, o: Outcome) {
    const code = codeOf(o)
    if (code === 'work.subtasks_open' && to === 'tamamlandi') {
      const again = await confirmSubtasks(confirmWrite, o, (c) => send(item, to, via, true, c))
      if (again) return again
    } else if (code === 'work.attachment_required') {
      toast.push({ message: homeText('home.k1.write.evidence'), tone: 'danger' })
      hooks.requestEvidence?.(item)
      return o
    } else {
      notifyOutcome(o)
    }
    reread(client, o, store.snapshot, item.work_item_id)
    return o
  }

  /** Başarıda `true`; sahibi sökülmüş sonuçta bildirim/yeniden okuma yok. */
  async function run(item: WorkItem, to: WorkItemStatus, via: MoveVia, success: MoveSuccess) {
    const first = await send(item, to, via, false)
    if (!reachesOwner(first)) return false
    const final = first.kind === 'success' ? first : await settle(item, to, via, first)
    if (!reachesOwner(final)) return false
    if (final.kind === 'success') toast.push({ message: homeText(success) })
    return final.kind === 'success'
  }
  return run
}

function useClaim() {
  const client = useQueryClient()
  const store = useScopeStore()
  const toast = useToast()
  const assign = useAddAssignments()

  return async function claim(item: WorkItem, accountId: string): Promise<boolean> {
    const outcome = (await assign.submit({
      target: targetOf(item),
      workItemId: item.work_item_id,
      accountIds: [accountId],
    })) as Outcome
    if (!reachesOwner(outcome)) return false
    if (outcome.kind !== 'success') {
      notifyOutcome(outcome)
      reread(client, outcome, store.snapshot, item.work_item_id)
      return false
    }
    toast.push({ message: homeText('home.k1.write.claimed') })
    return true
  }
}

export function useRoleWrites(hooks: RoleWriteHooks = {}) {
  const run = useMoves(hooks)
  const doClaim = useClaim()
  /** Yazması süren görev (düğmeler devre dışı). */
  const pendingId = ref<string | null>(null)

  async function guarded<T>(id: string, work: () => Promise<T>): Promise<T> {
    pendingId.value = id
    try {
      return await work()
    } finally {
      pendingId.value = null
    }
  }

  return {
    pendingId,
    move: (item: WorkItem, to: WorkItemStatus, via: MoveVia, success: MoveSuccess) =>
      guarded(item.work_item_id, () => run(item, to, via, success)),
    claim: (item: WorkItem, accountId: string) =>
      guarded(item.work_item_id, () => doClaim(item, accountId)),
  }
}
