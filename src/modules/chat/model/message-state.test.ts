import { describe, expect, it } from 'vitest'

import type { MutationOutcome } from '@/shared/http/mutation'
import { ApiError } from '@/shared/errors/api-error'

import { msg } from '../__tests__/fixtures'
import {
  classifySend,
  isValidClientMessageId,
  mentionsAll,
  newClientMessageId,
  reactionIntent,
  REACTION_KINDS,
  type SendContext,
} from './message-state'
import type { ChatMessage } from './types'

type Out = MutationOutcome<unknown, ChatMessage>
const failed = (code: string, status = 403): Out => ({
  kind: 'failed',
  error: new ApiError({ code, status }),
})
const GROUP: SendContext = { chatKind: 'group', body: {} }
const DIRECT: SendContext = { chatKind: 'direct', body: {} }

describe('istemci mesaj kimliği', () => {
  it('1–100 bayt yazdırılabilir ASCII, boşluksuz; her çağrı yeni', () => {
    const a = newClientMessageId()
    expect(isValidClientMessageId(a)).toBe(true)
    expect(a).not.toBe(newClientMessageId())
    expect(isValidClientMessageId('boş luk')).toBe(false)
    expect(isValidClientMessageId('')).toBe(false)
    expect(isValidClientMessageId('ş')).toBe(false)
    expect(isValidClientMessageId('x'.repeat(100))).toBe(true)
    expect(isValidClientMessageId('x'.repeat(101))).toBe(false)
  })
})

describe('classifySend', () => {
  it('başarı → sent (cevap mesajı)', () => {
    const message = msg(3)
    expect(classifySend({ kind: 'success', data: message } as Out, GROUP)).toEqual({
      state: 'sent',
      message,
    })
  })

  it('sonuç bilinmiyor: aynı kimlikle tekrar sunulur; retry yoksa sunulmaz', () => {
    const retry = () => Promise.resolve({ kind: 'success' } as Out)
    expect(classifySend({ kind: 'unknown_outcome', retry } as unknown as Out, GROUP)).toEqual({
      state: 'failed',
      reason: 'unknown',
      canRetry: true,
    })
    expect(
      classifySend({ kind: 'unknown_outcome', retry: null } as unknown as Out, GROUP),
    ).toMatchObject({ canRetry: false })
  })

  it('409 message_deleted: yeni kimlik üretilmez, taslak kullanıcıda', () => {
    expect(classifySend(failed('messaging.message_deleted', 409), GROUP)).toMatchObject({
      reason: 'deleted',
      canRetry: false,
    })
  })

  it('403 not_authorized birebirde: karşı taraf ayrıldı; grupta genel yetki hatası (CX-S-09)', () => {
    expect(classifySend(failed('messaging.not_authorized'), DIRECT)).toMatchObject({
      reason: 'peer_left',
    })
    expect(classifySend(failed('messaging.not_authorized'), GROUP)).toMatchObject({
      reason: 'other',
    })
  })

  it('403 + {kind:"all"} bahsetmesi: yalnız bahsetme reddi — birebir olsa bile "kişi ayrıldı" DENMEZ', () => {
    const withAll: SendContext = { chatKind: 'direct', body: { mentions: [{ kind: 'all' }] } }
    expect(classifySend(failed('messaging.not_authorized'), withAll)).toMatchObject({
      reason: 'mention_rejected',
    })
    const grouped: SendContext = { chatKind: 'group', body: { mentions: [{ kind: 'all' }] } }
    expect(classifySend(failed('messaging.not_authorized'), grouped)).toMatchObject({
      reason: 'mention_rejected',
    })
    expect(mentionsAll({ mentions: [{ kind: 'account', target_id: 'x' }] })).toBe(false)
    expect(mentionsAll({})).toBe(false)
  })

  it('404 message_not_found: yanıtlanan mesaj silinmiş; 429: Retry-After; diğerleri other', () => {
    expect(classifySend(failed('messaging.message_not_found', 404), GROUP)).toMatchObject({
      reason: 'reply_gone',
    })
    expect(classifySend({ kind: 'rate_limited', retryAfter: 7 } as unknown as Out, GROUP)).toEqual({
      state: 'failed',
      reason: 'rate_limited',
      canRetry: false,
      retryAfter: 7,
    })
    expect(classifySend(failed('messaging.input_invalid', 422), GROUP)).toMatchObject({
      reason: 'other',
    })
    expect(classifySend({ kind: 'conflict_retry' } as unknown as Out, GROUP)).toMatchObject({
      reason: 'other',
    })
  })
})

describe('tepki', () => {
  it('dört tür (👍 ❤️ ✅ ⭐); aynı türe dokunuş kaldırır, farklı tür yer değiştirir', () => {
    expect(REACTION_KINDS).toEqual(['like', 'heart', 'check', 'star'])
    const none = msg(1)
    const mineHeart = msg(1, {
      reactions: [
        { kind: 'like', count: 2, mine: false },
        { kind: 'heart', count: 1, mine: true },
      ],
    })
    expect(reactionIntent(none, 'like')).toBe('set')
    expect(reactionIntent(mineHeart, 'heart')).toBe('delete')
    expect(reactionIntent(mineHeart, 'like')).toBe('set')
  })
})
