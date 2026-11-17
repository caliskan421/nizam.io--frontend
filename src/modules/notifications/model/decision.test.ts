import { describe, expect, it } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'

import { decisionOf, resolvedText, taskTarget } from './decision'
import { muteKindOf } from './mute'
import type { NotificationItem } from './types'

const pending = (kind: 'review_date_request' | 'approve_task', request_id: string | null) => ({
  kind,
  request_id,
  state: 'pending' as const,
  resolution: null,
})
const row = (over: Partial<NotificationItem>) => makeNotification(over)

describe('decisionOf (kabiliyet backend action alanından)', () => {
  it('action yok → karar yüzü yok; bekleyen + tam bağlam → ready', () => {
    expect(decisionOf(row({ action: null }))).toBeNull()
    expect(decisionOf(row({ action: pending('review_date_request', 'r1') }))).toBe('ready')
    expect(
      decisionOf(
        row({ action: pending('approve_task', null), program_id: 'p', department_id: 'd' }),
      ),
    ).toBe('ready')
  })

  it('bağlam eksik → unavailable (seçili programdan tahmin yok)', () => {
    expect(decisionOf(row({ action: pending('review_date_request', null) }))).toBe('unavailable')
    expect(decisionOf(row({ action: pending('approve_task', null), program_id: 'p' }))).toBe(
      'unavailable',
    )
    expect(
      decisionOf(
        row({
          action: pending('approve_task', null),
          program_id: 'p',
          department_id: 'd',
          subject_ref: { kind: 'meeting', id: 'm' },
        }),
      ),
    ).toBe('unavailable')
    expect(taskTarget(row({ program_id: 'p', department_id: null }))).toBeNull()
  })
})

describe('resolvedText', () => {
  const resolved = (by: { account_id: string; full_name: string | null } | null) =>
    row({
      action: {
        kind: 'approve_task',
        request_id: null,
        state: 'resolved',
        resolution: { outcome: 'returned', decided_by: by, decided_at: null },
      },
    })
  it('ben / başkası / adsız / karar sahibi yok', () => {
    expect(resolvedText(resolved({ account_id: 'me', full_name: 'Ben' }), 'me')).toBe(
      'İade edildi · sen',
    )
    expect(resolvedText(resolved({ account_id: 'x', full_name: 'Can Er' }), 'me')).toBe(
      'İade edildi · Can Er',
    )
    expect(resolvedText(resolved({ account_id: 'x', full_name: null }), 'me')).toBe('İade edildi')
    expect(resolvedText(resolved(null), 'me')).toBe('İade edildi')
    expect(resolvedText(row({ action: pending('approve_task', null) }), 'me')).toBeNull()
  })
})

describe('muteKindOf', () => {
  it('yalnız görev ve toplantı (sohbet/üyelik/özet değil)', () => {
    const kind = (k: string) => muteKindOf({ subject_ref: { kind: k, id: 'x' } })
    expect([kind('work_item'), kind('meeting')]).toEqual(['work_item', 'meeting'])
    expect([kind('chat'), kind('membership'), kind('program'), kind('x')]).toEqual([
      null,
      null,
      null,
      null,
    ])
  })
})
