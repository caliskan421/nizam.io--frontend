import { describe, expect, it } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'
import type { components } from '@/shared/api/schema'

import { decisionOf, resolvedText, taskTarget } from './decision'
import { muteKindOf } from './mute'
import type { NotificationItem } from './types'

const pending = (
  kind: components['schemas']['NotificationAction']['kind'],
  request_id: string | null,
) => ({
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

  it('taşıma önerisini görev kararı olarak çalıştırmaz', () => {
    for (const kind of ['table_proposal', 'work_item']) {
      expect(
        decisionOf(
          row({
            action: pending('review_table_move', 'r1'),
            subject_ref: { kind, id: 'r1' },
            program_id: 'p',
            department_id: 'd',
          }),
        ),
      ).toBe('unavailable')
    }
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
  const outcomes = {
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    completed: 'Onaylandı',
    returned: 'İade edildi',
    changed: 'Durum başka yolla değişti',
    deleted: 'Görev silindi',
    withdrawn: 'Geri çekildi',
  } satisfies Record<components['schemas']['NotificationResolution']['outcome'], string>

  it.each(Object.entries(outcomes) as Array<[keyof typeof outcomes, string]>)(
    '%s sonucu Türkçe görünür',
    (outcome, label) => {
      expect(
        resolvedText(
          row({
            action: {
              kind: outcome === 'withdrawn' ? 'review_table_move' : 'approve_task',
              request_id: null,
              state: 'resolved',
              resolution: { outcome, decided_by: null, decided_at: null },
            },
          }),
          'me',
        ),
      ).toBe(label)
    },
  )

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
