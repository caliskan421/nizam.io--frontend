/**
 * Sohbet yazmaları (10 `backend.md` §2). Hepsi `useProtectedMutation` (K5); iyimser güncelleme
 * YOK: pencere yamaları ve `around` okumaları yalnız sunucu cevabından sonra çalışır.
 *  - İşlem anahtarı türleri: mesaj/ek → gövde/sorgu alanı `client_message_id` (başlık DEĞİL;
 *    ağ tekrarında AYNI kimlik + AYNI gövde); `createGroupChat`, `createTaskFromChatMessage` →
 *    `Idempotency-Key` başlığı (K45); diğer uçlar anahtarsızdır.
 *  - Düzenleme `expected_revision` taşır; 409 `messaging.edit_conflict` ortak çakışma kalıbıdır
 *    (`readCurrent` güncel mesajı `around` ile okur, kullanıcı karar verir, otomatik tekrar yok).
 *  - Tepki/oy/sabit/anket bitirme 204 döner: doğrulama `around=<seq>` okumasıdır.
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import { removeMessage, upsertMessage } from '../model/window'
import { refreshAround } from '../model/window-io'
import type {
  Chat,
  ChatMessage,
  ChatMessageTaskCreated,
  CreateGroupInput,
  EditMessageInput,
  MarkReadInput,
  MemberTarget,
  MembersInput,
  MessageTarget,
  OpenDirectInput,
  ProgramTarget,
  ReactInput,
  SendMessageInput,
  TaskFromMessageInput,
  UpdateChatInput,
  VoteInput,
  ChatTarget,
} from '../model/types'
import { fetchMessages } from './fetchers'
import { programHeaders } from './http'
import { messageReader } from './message-window'
import { withEffects, type EffectBase, type WriteEffects } from '../model/effects'
import { patchWindow, windowStore } from './window-cache'

const NOT_FOUND = 'messaging.message_not_found'

/** `message.updated` benzeri: yerel `seq` çevresini okuyup yereli günceller (sahip yaşıyorsa). */
async function refreshMessage<V extends MessageTarget>(fx: EffectBase<V>): Promise<void> {
  if (!fx.alive()) return
  const scopeStore = useScopeStore()
  const store = windowStore(
    fx.client,
    fx.scope,
    fx.vars.chatId,
    () => scopeStore.snapshot,
    fx.alive,
  )
  if (store.get().items.length === 0) return
  const read = messageReader(fx.scope.programId!, fx.vars.chatId, new AbortController().signal)
  await refreshAround(read, store, fx.vars.seq)
}

function upsert<V extends ChatTarget>(fx: WriteEffects<V, ChatMessage>): void {
  patchWindow(fx.client, fx.scope, fx.vars.chatId, (w) => upsertMessage(w, fx.data))
}

/** Mesaj gönder (düz metin; yanıt/bahsetme/ref/anket gövdede). Aynı kimlik = aynı gönderim. */
export function useSendChatMessage() {
  return withEffects(
    useProtectedMutation<SendMessageInput, ChatMessage>({
      operation: 'sendChatMessage',
      send: (vars, ctx) =>
        api.POST('/v1/chats/{chatId}/messages', {
          params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
          body: vars.body,
          signal: ctx.signal,
        }),
    }),
    { onSuccess: upsert },
  )
}

/** Mesajı düzenle: yalnız gönderen; `expected_revision` zorunlu; gövde aynıysa 200. */
export function useEditChatMessage() {
  return withEffects(
    useProtectedMutation<EditMessageInput, ChatMessage, ChatMessage | null>({
      operation: 'editChatMessage',
      send: (vars, ctx) =>
        api.PATCH('/v1/chats/{chatId}/messages/{messageId}', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          body: { body: vars.body, expected_revision: vars.expectedRevision },
          signal: ctx.signal,
        }),
      readCurrent: async (vars) => {
        const page = await fetchMessages(vars.programId, vars.chatId, {
          around: vars.seq,
          limit: 1,
        })
        return page.items.find((m) => m.message_id === vars.messageId) ?? null
      },
    }),
    {
      onSuccess: upsert,
      onFailure: (fx) => {
        if (fx.code === NOT_FOUND) {
          patchWindow(fx.client, fx.scope, fx.vars.chatId, (w) =>
            removeMessage(w, fx.vars.messageId),
          )
        }
      },
    },
  )
}

/** Mesajı sil (gönderen; grupta yönetici): 204 → yerel kayıt kimlikle KALDIRILIR. */
export function useDeleteChatMessage() {
  const remove = <V extends MessageTarget>(fx: EffectBase<V>) =>
    patchWindow(fx.client, fx.scope, fx.vars.chatId, (w) => removeMessage(w, fx.vars.messageId))
  return withEffects(
    useProtectedMutation<MessageTarget, void>({
      operation: 'deleteChatMessage',
      send: (vars, ctx) =>
        api.DELETE('/v1/chats/{chatId}/messages/{messageId}', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          signal: ctx.signal,
        }),
    }),
    {
      onSuccess: remove,
      onFailure: (fx) => {
        if (fx.code === NOT_FOUND) remove(fx)
      },
    },
  )
}

/** Okundu imlecini mesaja ilerletir (geri gitmez); liste + rozet geçersizlenir. */
export function useMarkChatRead() {
  return useProtectedMutation<MarkReadInput, void>({
    operation: 'markChatRead',
    send: (vars, ctx) =>
      api.POST('/v1/chats/{chatId}/read', {
        params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
        body: { message_id: vars.messageId },
        signal: ctx.signal,
      }),
  })
}

export function useMarkAllChatsRead() {
  return useProtectedMutation<ProgramTarget, void>({
    operation: 'markAllChatsRead',
    send: (vars, ctx) =>
      api.POST('/v1/chats/read-all', {
        params: { header: programHeaders(vars) },
        signal: ctx.signal,
      }),
  })
}

/** Birebir aç: 201 yeni, 200 mevcut (ikisi de "sohbeti aç"); anahtarsız. */
export function useOpenDirectChat() {
  return useProtectedMutation<OpenDirectInput, Chat>({
    operation: 'openDirectChat',
    send: (vars, ctx) =>
      api.POST('/v1/chats/direct', {
        params: { header: programHeaders(vars) },
        body: { account_id: vars.accountId },
        signal: ctx.signal,
      }),
  })
}

/** Grup kur: `Idempotency-Key` (K45) kullanıcı eylemi başına bir kez. */
export function useCreateGroupChat() {
  return useProtectedMutation<CreateGroupInput, Chat>({
    operation: 'createGroupChat',
    send: (vars, ctx) =>
      api.POST('/v1/chats/groups', {
        params: { header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}

/** Ad/kaynak: sürüm yok, son yazan kazanır (§8). */
export function useUpdateChat() {
  return useProtectedMutation<UpdateChatInput, Chat>({
    operation: 'updateChat',
    send: (vars, ctx) =>
      api.PATCH('/v1/chats/{chatId}', {
        params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}

export function useDeleteChat() {
  return useProtectedMutation<ChatTarget, void>({
    operation: 'deleteChat',
    send: (vars, ctx) =>
      api.DELETE('/v1/chats/{chatId}', {
        params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
        signal: ctx.signal,
      }),
  })
}

/**
 * Üye ekle (en çok 200). Kaynaktan gelen üye çıkarılamaz/ayrılamaz: 409
 * `messaging.member_source_managed` (düğme zaten gizli olmalıydı, `capabilities.ts`).
 */
export function useAddChatMembers() {
  return useProtectedMutation<MembersInput, void>({
    operation: 'addChatMembers',
    send: (vars, ctx) =>
      api.POST('/v1/chats/{chatId}/members', {
        params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
        body: { account_ids: vars.accountIds },
        signal: ctx.signal,
      }),
  })
}

/** Üyeyi çıkar; `accountId` kendisi ise "gruptan ayrıl". */
export function useRemoveChatMember() {
  return useProtectedMutation<MemberTarget, void>({
    operation: 'removeChatMember',
    send: (vars, ctx) =>
      api.DELETE('/v1/chats/{chatId}/members/{accountId}', {
        params: {
          header: programHeaders(vars),
          path: { chatId: vars.chatId, accountId: vars.accountId },
        },
        signal: ctx.signal,
      }),
  })
}

export function useGrantChatAdmin() {
  return useProtectedMutation<MemberTarget, void>({
    operation: 'grantChatAdmin',
    send: (vars, ctx) =>
      api.PUT('/v1/chats/{chatId}/admins/{accountId}', {
        params: {
          header: programHeaders(vars),
          path: { chatId: vars.chatId, accountId: vars.accountId },
        },
        signal: ctx.signal,
      }),
  })
}

export function useRevokeChatAdmin() {
  return useProtectedMutation<MemberTarget, void>({
    operation: 'revokeChatAdmin',
    send: (vars, ctx) =>
      api.DELETE('/v1/chats/{chatId}/admins/{accountId}', {
        params: {
          header: programHeaders(vars),
          path: { chatId: vars.chatId, accountId: vars.accountId },
        },
        signal: ctx.signal,
      }),
  })
}

/** Tepki koy / yer değiştir (4 tür, kişi başına tek); 204 → `around` okuması. */
export function useSetChatReaction() {
  return withEffects(
    useProtectedMutation<ReactInput, void>({
      operation: 'setChatReaction',
      send: (vars, ctx) =>
        api.PUT('/v1/chats/{chatId}/messages/{messageId}/reaction', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          body: { kind: vars.kind },
          signal: ctx.signal,
        }),
    }),
    { onSuccess: refreshMessage },
  )
}

/** Tepkiyi kaldır (aynı türe dokunuş); yoksa da 204. */
export function useDeleteChatReaction() {
  return withEffects(
    useProtectedMutation<MessageTarget, void>({
      operation: 'deleteChatReaction',
      send: (vars, ctx) =>
        api.DELETE('/v1/chats/{chatId}/messages/{messageId}/reaction', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          signal: ctx.signal,
        }),
    }),
    { onSuccess: refreshMessage },
  )
}

function usePinWrite(pin: boolean) {
  const operation = pin ? 'pinChatMessage' : 'unpinChatMessage'
  return withEffects(
    useProtectedMutation<MessageTarget, void>({
      operation,
      send: (vars, ctx) => {
        const options = {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          signal: ctx.signal,
        }
        return pin
          ? api.PUT('/v1/chats/{chatId}/messages/{messageId}/pin', options)
          : api.DELETE('/v1/chats/{chatId}/messages/{messageId}/pin', options)
      },
    }),
    { onSuccess: refreshMessage },
  )
}

/** Sabitle (birebirde iki taraf, grupta yönetici/kurucu); şerit `listChatPins` geçersizlemesiyle. */
export const usePinChatMessage = () => usePinWrite(true)
export const useUnpinChatMessage = () => usePinWrite(false)

/** Oy ver / değiştir / geri çek (`[]`); kapanmış ankette 409 `messaging.poll_closed`. */
export function useVoteChatPoll() {
  return withEffects(
    useProtectedMutation<VoteInput, void>({
      operation: 'voteChatPoll',
      send: (vars, ctx) =>
        api.PUT('/v1/chats/{chatId}/messages/{messageId}/vote', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          body: { option_indexes: vars.optionIndexes },
          signal: ctx.signal,
        }),
    }),
    {
      onSuccess: refreshMessage,
      onFailure: refreshMessage,
    },
  )
}

/** Anketi bitir (yalnız açan). `poll_closed` sonrası da sonuç okunur. */
export function useCloseChatPoll() {
  return withEffects(
    useProtectedMutation<MessageTarget, void>({
      operation: 'closeChatPoll',
      send: (vars, ctx) =>
        api.POST('/v1/chats/{chatId}/messages/{messageId}/poll/close', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          signal: ctx.signal,
        }),
    }),
    {
      onSuccess: refreshMessage,
      onFailure: refreshMessage,
    },
  )
}

/**
 * Mesajdan görev (K8): `Idempotency-Key` zorunlu; aynı anahtar aynı görevi 200 ile döndürür.
 * Cevaptaki `message` (güncel `task_ids`) pencereyi günceller; görev listesi sorguları §6 ile
 * geçersizlenir (`WORK_ITEM_WRITES`).
 */
export function useCreateTaskFromChatMessage() {
  return withEffects(
    useProtectedMutation<TaskFromMessageInput, ChatMessageTaskCreated>({
      operation: 'createTaskFromChatMessage',
      send: (vars, ctx) =>
        api.POST('/v1/chats/{chatId}/messages/{messageId}/tasks', {
          params: {
            header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey },
            path: { chatId: vars.chatId, messageId: vars.messageId },
          },
          body: vars.body,
          signal: ctx.signal,
        }),
    }),
    {
      onSuccess: (fx) =>
        patchWindow(fx.client, fx.scope, fx.vars.chatId, (w) => upsertMessage(w, fx.data.message)),
    },
  )
}
