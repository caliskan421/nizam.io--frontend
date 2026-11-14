/**
 * `registerPushTarget` sonucu → kutu iletisi anahtarı (E-14-78). Sunucu `message` alanı
 * kullanılmaz; hata KODU → i18n (`notifications.push.errors.*`).
 */
import type { MutationOutcome } from '@/shared/http/mutation'

import type { PushTargetResult, RegisterTargetRequest } from '../../model/types'

export type PushErrorKey = 'targetInvalid' | 'ownerConflict' | 'invalid' | 'generic'

const REGISTER_ERRORS: Readonly<Record<string, PushErrorKey>> = {
  'notifications.target_invalid': 'targetInvalid',
  'notifications.subscription_owner_conflict': 'ownerConflict',
  'notifications.input_invalid': 'invalid',
  'platform.body_invalid': 'invalid',
}

/** `success` | `owner_disposed` (sahip söküldü, istek gitmedi) | kutu iletisi anahtarı. */
export function registrationResult(
  outcome: MutationOutcome<RegisterTargetRequest, PushTargetResult>,
): 'success' | 'owner_disposed' | PushErrorKey {
  if (outcome.kind === 'success' || outcome.kind === 'owner_disposed') return outcome.kind
  const code = outcome.kind === 'failed' ? outcome.error.code : ''
  return REGISTER_ERRORS[code] ?? 'generic'
}
