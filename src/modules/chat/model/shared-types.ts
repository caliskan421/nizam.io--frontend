/** W184 (BE-083/084/085/028/027) okuma yüzleri: üretilmiş şemadan alias'lar (elle DTO yok). */
import type { MaybeRefOrGetter } from 'vue'

import type { components } from '@/shared/api/schema'

import type { ChatTarget } from './types'

type S = components['schemas']

export type ChatSharedCounts = S['ChatSharedCounts']
export type ChatAttachmentItem = S['ChatAttachmentItem']
export type ChatAttachmentList = S['ChatAttachmentList']
export type ChatTaskLink = S['ChatTaskLink']
export type ChatTaskLinkList = S['ChatTaskLinkList']
export type ChatMessageTaskList = S['ChatMessageTaskList']
export type ChatMessageTaskItem = ChatMessageTaskList['items'][number]
export type ChatMessageReceipts = S['ChatMessageReceipts']
export type ChatProgramRole = S['ChatProgramRole']
export type ChatNotificationLevelBody = S['ChatNotificationLevel']
export type ChatNotificationLevel = ChatNotificationLevelBody['level']

/** Okuyucu girdileri: sohbet/mesaj kimliği ve etkinlik kapısı. */
export type IdSource = MaybeRefOrGetter<string | null>
export type GateSource = MaybeRefOrGetter<boolean>

export interface SetNotificationLevelInput extends ChatTarget {
  level: ChatNotificationLevel
}
