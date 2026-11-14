/**
 * SSE olayının uygulanması: `model/events.ts` planını önbelleğe ve okumalara çevirir. Olay
 * içeriği ASLA önbelleğe yazılmaz; yalnız (a) `message.deleted` kimlikli yerel kaldırma ve (b)
 * içeriksiz sorgu geçersizleme + pencere okumaları (`after`, `around`). Sahip sökülmüşse ek okuma
 * başlamaz (KESİN 26a).
 */
import { toValue } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { sameScope } from '@/shared/http/mutation'
import { queryKeys, resourceFilter } from '@/shared/http/query-keys'
import type { CoalescedEvent } from '@/shared/sse'

import type { EventPlan } from '../model/events'
import { planFor } from '../model/events'
import type { ApplyDeps, DispatchDeps } from '../model/types'
import { removeMessage, seqOf } from '../model/window'
import { patchWindow } from './window-cache'

/** Plan bayrağı → §6 kaynağı (`perChat`: yalnız olayın sohbeti). */
const FLAGS = [
  { flag: 'invalidateList', resource: 'chats.list', perChat: false },
  { flag: 'invalidateOverview', resource: 'chats.unreadOverview', perChat: false },
  { flag: 'invalidateDetail', resource: 'chats.detail', perChat: true },
  { flag: 'invalidateMembers', resource: 'chats.members', perChat: true },
  { flag: 'invalidateCandidates', resource: 'chats.candidates', perChat: false },
  { flag: 'invalidatePins', resource: 'chats.pins', perChat: true },
  { flag: 'invalidateRefs', resource: 'chats.refs', perChat: true },
] as const

function invalidate(deps: ApplyDeps, event: CoalescedEvent, plan: EventPlan): Promise<unknown> {
  const jobs: Array<Promise<unknown>> = []
  for (const { flag, resource, perChat } of FLAGS) {
    if (!plan[flag]) continue
    const filter = resourceFilter(resource, deps.scope, perChat ? { chatId: event.chatId } : {})
    if (filter) jobs.push(deps.client.invalidateQueries(filter))
  }
  return Promise.all(jobs)
}

async function recheck(deps: ApplyDeps, event: CoalescedEvent): Promise<void> {
  const key = queryKeys.chats.detail(deps.scope, event.chatId)
  await deps.client.invalidateQueries({ queryKey: key, exact: true })
  // Gecikmiş denetim: kapsam bu arada değiştiyse sonuç eski kapsama aittir, güncel ekrana uygulanmaz.
  if (!deps.alive() || !sameScope(deps.scope, deps.currentScope())) return
  // Planın yakaladığı açık sohbet artık açık değilse (A → B) sonuç A'ya aittir; B'ye uygulanmaz.
  if (deps.currentOpenChatId() !== event.chatId) return
  const error = deps.client.getQueryState(key)?.error
  if (error instanceof ApiError && error.code === 'messaging.chat_not_found') {
    deps.onChatLost(event.chatId)
  }
}

async function openChatReads(deps: ApplyDeps, event: CoalescedEvent, plan: EventPlan) {
  const messages = deps.messages
  if (!plan.open || messages === null || !deps.alive()) return
  const jobs: Array<Promise<unknown>> = []
  if (plan.readNewer) jobs.push(messages.loadNewer())
  const seqs = new Set<number>()
  for (const id of plan.refreshMessageIds) {
    const seq = seqOf(messages.window.value, id)
    if (seq !== null) seqs.add(seq)
  }
  for (const seq of seqs) jobs.push(messages.refreshMessage(seq))
  if (plan.refreshPeerRead) jobs.push(messages.refreshPeerRead())
  if (plan.recheckAccess) jobs.push(recheck(deps, event))
  // Okuma ağ hatasıyla düşerse mesaj bir sonraki olaya dek görünmez kalmasın: "bekleyen uzlaştırma"
  // bayrağı kalkar (`useChatStream`: online / odak / yeniden bağlanma → tek `reconcile`).
  const results = await Promise.allSettled(jobs)
  if (results.some((r) => r.status === 'rejected')) deps.onReadFailed()
}

export async function applyPlan(
  deps: ApplyDeps,
  event: CoalescedEvent,
  plan: EventPlan,
): Promise<void> {
  for (const id of plan.removeMessageIds) {
    patchWindow(deps.client, deps.scope, event.chatId, (w) => removeMessage(w, id))
  }
  await invalidate(deps, event, plan)
  await openChatReads(deps, event, plan)
}

/** Birleştirilmiş SSE olayı → plan → uygulama (açık sohbet bağlamıyla). */
export function dispatchEvent(deps: DispatchDeps, event: CoalescedEvent): void {
  const open = toValue(deps.options.chatId)
  const messages = deps.options.messages
  const plan = planFor(event, {
    openChatId: open,
    meAccountId: deps.meAccountId,
    hasLocal: (id) => messages !== null && seqOf(messages.window.value, id) !== null,
  })
  const applyDeps: ApplyDeps = {
    client: deps.client,
    scope: { ...deps.scope() },
    currentScope: deps.scope,
    openChatId: open,
    currentOpenChatId: () => toValue(deps.options.chatId),
    messages,
    alive: deps.alive,
    onChatLost: (id) => deps.options.onChatLost?.(id),
    onReadFailed: deps.onReadFailed,
  }
  // Reddedilen plan yakalanmamış red olmaz (`pageerror` yok); sessizce bekleyen uzlaştırmaya döner.
  applyPlan(applyDeps, event, plan).catch(() => deps.onReadFailed())
}
