import type { components } from '@/shared/api/schema'

export type NotificationItem = components['schemas']['Notification']
export type NotificationPage = components['schemas']['NotificationList']
export type PushPublicKeyInfo = components['schemas']['PushPublicKey']
export type RegisterTargetRequest = components['schemas']['RegisterTargetRequest']
export type PushTargetResult = components['schemas']['TargetResult']
export type MarkedCount = components['schemas']['MarkedCount']

/** `markNotificationRead` değişkeni. */
export interface MarkReadInput {
  id: string
}

/** `unregisterPushTarget` değişkeni. */
export interface UnregisterTargetInput {
  targetId: string
}
