import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from '@/shared/api/error-codes.gen'
import { i18n } from '@/shared/i18n'

import { CHAT_FAILURES, chatFailure } from './failure'

const MESSAGING = Object.entries(ERROR_CODES).filter(([code]) => code.startsWith('messaging.'))

describe('messaging.* hata sınıflaması', () => {
  it('katalogdaki 18 zarf kodu + 4 alan kodu = 22 kod; hepsi kayıtlı', () => {
    const envelope = MESSAGING.map(([code]) => code)
    const fieldCodes = MESSAGING.flatMap(([, entry]) => entry.fields as readonly string[]).filter(
      (code) => code.startsWith('messaging.'),
    )
    const all = new Set([...envelope, ...fieldCodes])
    expect(envelope).toHaveLength(18)
    expect(all.size).toBe(22)
    expect([...all].sort()).toEqual(Object.keys(CHAT_FAILURES).sort())
  })

  it('her kodun i18n anahtarı çözülür (sunucu message alanı gösterilmez)', () => {
    for (const code of Object.keys(CHAT_FAILURES)) {
      const failure = chatFailure(code)!
      expect(failure.messageKey, code).toBe(`errors.${code}`)
      expect(i18n.global.te(failure.messageKey), code).toBe(true)
    }
  })

  it('pin v0.23.0-api: messaging.auto_group_protected çakışma sınıfı, genel etki', () => {
    expect(chatFailure('messaging.auto_group_protected')).toMatchObject({
      class: 'conflict',
      messageKey: 'errors.messaging.auto_group_protected',
      effect: 'generic',
    })
  })

  it('sınıf/etki ayrımı: gone, conflict, cursor, deleted, forbidden', () => {
    expect(chatFailure('messaging.chat_not_found')).toMatchObject({
      class: 'gone',
      effect: 'close_chat',
    })
    expect(chatFailure('messaging.message_not_found')).toMatchObject({
      class: 'gone',
      effect: 'drop_local_message',
    })
    expect(chatFailure('messaging.edit_conflict')).toMatchObject({
      class: 'conflict',
      effect: 'reread_message',
    })
    expect(chatFailure('messaging.invalid_cursor')).toMatchObject({
      class: 'cursor',
      effect: 'reset_cursor',
    })
    expect(chatFailure('messaging.message_deleted')).toMatchObject({
      class: 'deleted',
      effect: 'keep_draft',
    })
    expect(chatFailure('messaging.not_authorized')).toMatchObject({ class: 'forbidden' })
    expect(chatFailure('messaging.poll_closed')).toMatchObject({ effect: 'mark_poll_closed' })
    expect(chatFailure('messaging.ref_not_found')).toMatchObject({ effect: 'mark_card_gone' })
    expect(chatFailure('messaging.file_too_large')).toMatchObject({ class: 'field' })
  })

  it('bilinmeyen / Object.prototype kodları null', () => {
    expect(chatFailure('messaging.yeni_kod')).toBeNull()
    expect(chatFailure('constructor')).toBeNull()
  })
})
