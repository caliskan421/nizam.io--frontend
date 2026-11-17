import type { components } from '@/shared/api/schema'

export type NotificationItem = components['schemas']['Notification']
export type NotificationPage = components['schemas']['NotificationList']
export type PushPublicKeyInfo = components['schemas']['PushPublicKey']
export type RegisterTargetRequest = components['schemas']['RegisterTargetRequest']
export type PushTargetResult = components['schemas']['TargetResult']
export type MarkedCount = components['schemas']['MarkedCount']
export type NotificationCounts = components['schemas']['NotificationUnreadCount']
export type NotificationActionInfo = components['schemas']['NotificationAction']
export type NotificationSubjectMute = components['schemas']['NotificationSubjectMute']
export type NotificationSubjectMutePage = components['schemas']['NotificationSubjectMuteList']
export type MutableSubjectKind = NotificationSubjectMute['subject_kind']

/** `dismissNotification` değişkeni. */
export interface DismissInput {
  id: string
}

/** `muteNotificationSubject` / `unmuteNotificationSubject` değişkeni (`kind` yalnız görev/toplantı). */
export interface SubjectMuteInput {
  kind: MutableSubjectKind
  id: string
}

/** `markNotificationRead` değişkeni. */
export interface MarkReadInput {
  id: string
}

/** `unregisterPushTarget` değişkeni. */
export interface UnregisterTargetInput {
  targetId: string
}
