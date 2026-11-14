/**
 * Mesaj eylemleri (E-10-38/41/43/47/35): tepki, sabit, sil, oy, anket bitirme, bağlantı kopyalama,
 * dosya indirme. Hepsi `useProtectedMutation` kapısındadır (K5); iyimser güncelleme yoktur —
 * satır yalnız sunucu cevabıyla/`around` okumasıyla değişir, işlem sürerken ilgili mesaj meşguldür.
 * Başarısızlık ortak bildirimle (`notifyOutcome`, hata kodu → i18n; sunucu `message` gösterilmez)
 * bildirilir. Silme ve anketi bitirme ortak onaydan (`confirmWrite`) geçer.
 */
import { inject, nextTick, provide, ref, type InjectionKey, type Ref } from 'vue'

import { errorText } from '@/shared/i18n'
import { confirmText, notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useChatDownload } from '../../api/attachments'
import {
  useCloseChatPoll,
  useDeleteChatMessage,
  useDeleteChatReaction,
  usePinChatMessage,
  useSetChatReaction,
  useUnpinChatMessage,
  useVoteChatPoll,
} from '../../api/writes'
import { reactionIntent } from '../../model/message-state'
import type {
  ChatDownloadRequest,
  ChatMessage,
  MessageTarget,
  ReactionKind,
} from '../../model/types'
import { chatText } from '../../messages'
import type { ThreadContext } from './use-thread'

export interface MessageActions {
  /** İşlemi süren mesaj kimlikleri (tepki/sabit/oy/sil). */
  pending: Readonly<Ref<ReadonlySet<string>>>
  /** İndirme 404 verdi: kartın "artık yok" hâli (öğe kimliği). */
  gone: Readonly<Ref<ReadonlySet<string>>>
  react: (message: ChatMessage, kind: ReactionKind) => Promise<void>
  togglePin: (message: ChatMessage) => Promise<void>
  remove: (message: ChatMessage) => Promise<void>
  vote: (message: ChatMessage, optionIndexes: number[]) => Promise<void>
  closePoll: (message: ChatMessage) => Promise<void>
  copyLink: (message: ChatMessage) => Promise<void>
  download: (request: ChatDownloadRequest) => Promise<void>
}

export const ACTIONS_KEY: InjectionKey<MessageActions> = Symbol('chat-thread-actions')

export function useActions(): MessageActions {
  const actions = inject(ACTIONS_KEY, null)
  if (actions === null) throw new Error('useActions yalnız ConversationPane altında kullanılır')
  return actions
}

const GONE_CODES = ['messaging.message_not_found', 'messaging.ref_not_found']

type AnyOutcome = Parameters<typeof notifyOutcome>[0]

/** İşlem süren mesaj kimlikleri: `guarded` işlem boyunca kimliği meşgul işaretler. */
function useGuard() {
  const pending = ref<ReadonlySet<string>>(new Set())
  async function guarded(id: string, run: () => Promise<AnyOutcome | null>): Promise<void> {
    pending.value = new Set(pending.value).add(id)
    try {
      const outcome = await run()
      if (outcome) notifyOutcome(outcome)
    } finally {
      const next = new Set(pending.value)
      next.delete(id)
      pending.value = next
    }
  }
  return { pending, guarded }
}

function useTarget(ctx: ThreadContext) {
  return (m: ChatMessage): MessageTarget => ({
    programId: ctx.programId.value,
    chatId: ctx.chatId.value,
    messageId: m.message_id,
    seq: m.seq,
  })
}

/** Tepki, sabit, oy: sunucu cevabı + `around` okuması (yazma katmanı) — iyimser değişiklik yok. */
function useLightWrites(ctx: ThreadContext, guard: ReturnType<typeof useGuard>) {
  const set = useSetChatReaction()
  const unset = useDeleteChatReaction()
  const pin = usePinChatMessage()
  const unpin = useUnpinChatMessage()
  const vote = useVoteChatPoll()
  const target = useTarget(ctx)
  return {
    react: (message: ChatMessage, kind: ReactionKind) =>
      guard.guarded(message.message_id, () =>
        reactionIntent(message, kind) === 'set'
          ? set.submit({ ...target(message), kind })
          : unset.submit(target(message)),
      ),
    togglePin: (message: ChatMessage) =>
      guard.guarded(message.message_id, () =>
        (message.pinned_at === null ? pin : unpin).submit(target(message)),
      ),
    vote: (message: ChatMessage, optionIndexes: number[]) =>
      guard.guarded(message.message_id, () => vote.submit({ ...target(message), optionIndexes })),
  }
}

/** Silme ve anketi bitirme: ortak onaydan geçer (`confirmWrite`; bağlam yakalanır). */
function useConfirmedWrites(ctx: ThreadContext, guard: ReturnType<typeof useGuard>) {
  const { confirmWrite } = useConfirm()
  const del = useDeleteChatMessage()
  const close = useCloseChatPoll()
  const target = useTarget(ctx)
  const cancelLabel = () => confirmText('confirm.cancel')
  return {
    remove: async (message: ChatMessage) => {
      await guard.guarded(message.message_id, () =>
        confirmWrite(
          {
            title: chatText('chat.thread.confirm.deleteTitle'),
            description: chatText('chat.thread.confirm.deleteBody'),
            confirmLabel: chatText('chat.thread.confirm.deleteConfirm'),
            cancelLabel: cancelLabel(),
            tone: 'danger',
          },
          (context) => del.submit(target(message), { context }),
        ),
      )
      // Satır sökülünce onay penceresi odağı sökülmüş tetikleyiciye iade eder: akışa taşı.
      if (!document.activeElement || document.activeElement === document.body) {
        await nextTick()
        ctx.listEl.value?.focus()
      }
    },
    closePoll: (message: ChatMessage) =>
      guard.guarded(message.message_id, () =>
        confirmWrite(
          {
            title: chatText('chat.thread.confirm.closePollTitle'),
            description: chatText('chat.thread.confirm.closePollBody'),
            confirmLabel: chatText('chat.thread.confirm.closePollConfirm'),
            cancelLabel: cancelLabel(),
          },
          (context) => close.submit(target(message), { context }),
        ),
      ),
  }
}

/** Bağlantı kopyalama ve dosya indirme (bilet akışı). */
function useLinkAndDownload(ctx: ThreadContext) {
  const toast = useToast()
  const downloads = useChatDownload()
  const gone = ref<ReadonlySet<string>>(new Set())
  return {
    gone,
    async copyLink(message: ChatMessage): Promise<void> {
      const url = new URL(`/mesajlar/${encodeURIComponent(ctx.chatId.value)}`, location.origin)
      url.searchParams.set('mesaj', String(message.seq))
      try {
        await navigator.clipboard.writeText(url.toString())
        toast.push({ message: chatText('chat.thread.linkCopied') })
      } catch {
        toast.push({ message: chatText('chat.thread.linkFailed'), tone: 'danger' })
      }
    },
    async download(request: ChatDownloadRequest): Promise<void> {
      const result = await downloads.start(request)
      if (result.kind === 'failed') {
        if (GONE_CODES.includes(result.error.code)) gone.value = new Set(gone.value).add(request.id)
        toast.push({ message: errorText(result.error), tone: 'danger' })
      } else if (result.kind === 'ticket_failed') {
        // Bilet aşamasında 404 (mesaj silindi / üyelik düştü): kart "artık yok" olur.
        const o = result.outcome
        if (o.kind === 'failed' && GONE_CODES.includes(o.error.code)) {
          gone.value = new Set(gone.value).add(request.id)
        }
        notifyOutcome(o)
      }
    },
  }
}

export function createActions(ctx: ThreadContext): MessageActions {
  const guard = useGuard()
  return {
    pending: guard.pending,
    ...useLightWrites(ctx, guard),
    ...useConfirmedWrites(ctx, guard),
    ...useLinkAndDownload(ctx),
  }
}

export function provideActions(ctx: ThreadContext): MessageActions {
  const actions = createActions(ctx)
  provide(ACTIONS_KEY, actions)
  return actions
}
