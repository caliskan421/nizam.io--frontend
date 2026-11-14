/**
 * Konuşma bağlamı: açık sohbetin tek okuma kümesi (sohbet, üyeler, birimler, kimlik, yetkiler) bir
 * kez kurulur, alt bileşenlere `THREAD_KEY` ile verilir (her satır kendi sorgusunu açmaz).
 * Eylem görünürlüğü `chatCapabilities` üzerindendir (rol dizesi yok; mercek ≠ yetki, P1).
 */
import {
  computed,
  inject,
  onScopeDispose,
  provide,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'

import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'

import { useChat, useChatMembers } from '../../api/queries'
import {
  chatCapabilities,
  coordinatorDepartments,
  type ChatActor,
  type ChatCapabilities,
} from '../../model/capabilities'
import { useChatPage } from '../../model/context'
import type { DialogRequest } from '../../model/dialogs'
import type { Chat, ChatMember, ChatMessage } from '../../model/types'
import { chatDrafts, draftKey, editBase } from '../composer/drafts'
import { useDialogOpener } from './dialog-opener'

export interface ThreadContext {
  chatId: ComputedRef<string>
  programId: ComputedRef<string>
  meId: ComputedRef<string | null>
  chat: Ref<Chat | undefined>
  /** `getChat` durumu: 404 → "Bu konuşma bulunamadı". */
  chatPending: Ref<boolean>
  chatError: Ref<unknown>
  isGroup: ComputedRef<boolean>
  actor: ComputedRef<ChatActor>
  caps: ComputedRef<ChatCapabilities | null>
  members: ComputedRef<readonly ChatMember[]>
  /** Hesap kimliğinden ad (üye listesi; yoksa `null`). */
  memberName: (accountId: string | null | undefined) => string | null
  /** Programın koordinatörlükleri (bahsetme önerisi). */
  departments: ComputedRef<readonly { department_id: string; name: string }[]>
  departmentName: (departmentId: string) => string | null
  departmentCode: (departmentId: string) => string | null
  /** Beni kapsayan koordinatörlük kimlikleri (bahsetme vurgusu). */
  myDepartments: ComputedRef<readonly string[]>
  peerReadSeq: ComputedRef<number | null>
  /** Odak vurgusu (alıntı/sabit/bağlantı hedefi, 2 sn). */
  highlightSeq: Ref<number | null>
  /** Yazma çubuğu odak isteği (yanıtla/düzenle sonrası). */
  focusRequest: Ref<number>
  /** Kendi gönderimimden sonra akış en alta iner (sayaç; `MessageList` izler). */
  stickBottom: Ref<number>
  /** Akış bölgesi (odak yedeği: eylem sonrası söküm gövdeye düşmesin, KESİN 27). */
  listEl: Ref<HTMLElement | null>
  draftKey: ComputedRef<string>
  openDialog: (request: DialogRequest) => void
  findMessage: (messageId: string) => ChatMessage | null
  startReply: (message: ChatMessage) => void
  startEdit: (message: ChatMessage) => void
  goTo: (seq: number) => Promise<void>
  /** Alıntı hedefi (`seq` yok, BE-162): yüklü pencerede ara, yoksa en çok 3 `before` sayfası. */
  goToMessage: (messageId: string) => Promise<void>
}

export const THREAD_KEY: InjectionKey<ThreadContext> = Symbol('chat-thread')

export function useThread(): ThreadContext {
  const context = inject(THREAD_KEY, null)
  if (context === null) throw new Error('useThread yalnız ConversationPane altında kullanılır')
  return context
}

const HIGHLIGHT_MS = 2000
/** Alıntı hedefi için en çok bu kadar ek `before` sayfası okunur (BE-162). */
export const QUOTE_LOOKUP_PAGES = 3

/** Sohbet, üyeler, birimler, kimlik ve yetkiler (okuma kümesi). */
function useThreadData(id: ComputedRef<string>) {
  const scope = useScopeStore()
  const session = useSessionStore()
  const chatQuery = useChat(id)
  const chat = chatQuery.data as Ref<Chat | undefined>
  const membersQuery = useChatMembers(id)
  const departments = useProgramDepartments()
  const { standing } = useStanding()
  const members = computed<readonly ChatMember[]>(() => membersQuery.data.value?.items ?? [])
  const byAccount = computed(() => new Map(members.value.map((m) => [m.account_id, m.full_name])))
  const actor = computed<ChatActor>(() => ({
    standing: standing.value,
    programId: scope.programId,
  }))
  const caps = computed(() => {
    const c = chat.value
    if (c === undefined) return null
    return chatCapabilities(actor.value, {
      kind: c.kind,
      role: c.role ?? 'member',
      autoKind: c.auto_kind,
      source: c.source,
    })
  })
  const byId = departments.byId
  return {
    programId: computed(() => scope.programId ?? ''),
    meId: computed(() => session.accountId),
    chat,
    chatPending: chatQuery.isPending,
    chatError: chatQuery.error,
    isGroup: computed(() => chat.value?.kind === 'group'),
    actor,
    caps,
    members,
    memberName: (accountId: string | null | undefined) =>
      accountId ? (byAccount.value.get(accountId) ?? null) : null,
    departments: computed(() =>
      [...byId.value.values()].map((d) => ({
        department_id: d.department_id,
        name: d.display_name,
      })),
    ),
    departmentName: (departmentId: string) => byId.value.get(departmentId)?.display_name ?? null,
    departmentCode: (departmentId: string) => byId.value.get(departmentId)?.code ?? null,
    myDepartments: computed(() => coordinatorDepartments(actor.value)),
    draftKey: computed(() => draftKey(session.accountId, scope.programId, id.value)),
  }
}

/** Vurgu, odak isteği, yanıt/düzenleme başlatma ve mesaja gitme. */
function useThreadNav(key: ComputedRef<string>) {
  const page = useChatPage()
  const highlightSeq = ref<number | null>(null)
  const focusRequest = ref(0)
  const stickBottom = ref(0)
  const listEl = ref<HTMLElement | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  function highlight(seq: number): void {
    highlightSeq.value = seq
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      highlightSeq.value = null
      timer = null
    }, HIGHLIGHT_MS)
  }
  onScopeDispose(() => {
    if (timer !== null) clearTimeout(timer)
  })
  const find = (messageId: string): ChatMessage | null =>
    page.messages.window.value.items.find((m) => m.message_id === messageId) ?? null

  return {
    highlightSeq,
    focusRequest,
    stickBottom,
    listEl,
    peerReadSeq: computed(() => page.messages.window.value.peerReadSeq),
    findMessage: find,
    startReply(message: ChatMessage): void {
      chatDrafts.endEdit(key.value)
      chatDrafts.setReplyTo(key.value, message.message_id)
      focusRequest.value += 1
    },
    startEdit(message: ChatMessage): void {
      editBase.set(key.value, message.body)
      chatDrafts.startEdit(key.value, {
        messageId: message.message_id,
        body: message.body,
        expectedRevision: message.edit_revision,
      })
      focusRequest.value += 1
    },
    async goTo(seq: number): Promise<void> {
      const loaded = page.messages.window.value.items.some((m) => m.seq === seq)
      if (!loaded) await page.messages.jumpTo(seq)
      highlight(seq)
    },
    async goToMessage(messageId: string): Promise<void> {
      for (let pages = 0; find(messageId) === null && pages < QUOTE_LOOKUP_PAGES; pages += 1) {
        await page.messages.loadOlder()
      }
      const target = find(messageId)
      if (target !== null) highlight(target.seq)
    },
  }
}

export function createThread(chatId: () => string): ThreadContext {
  const id = computed(chatId)
  const data = useThreadData(id)
  const nav = useThreadNav(data.draftKey)
  const direct = computed(() => data.chat.value?.kind === 'direct')
  return {
    chatId: id,
    ...data,
    ...nav,
    // Tik yalnız birebirde (grupta kim okudu BE-028): grupta karşı imleç yoktur.
    peerReadSeq: computed(() => (direct.value ? nav.peerReadSeq.value : null)),
    openDialog: useDialogOpener(),
  }
}

export function provideThread(chatId: () => string): ThreadContext {
  const context = createThread(chatId)
  provide(THREAD_KEY, context)
  return context
}
