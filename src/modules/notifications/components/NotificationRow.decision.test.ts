// Satır içi karar yüzü (BE-146; P88) — satır bileşeni düzeyi.
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'

import NotificationRow from './NotificationRow.vue'
import type { NotificationItem } from '../model/types'

const NOW = new Date('2026-11-14T09:00:00Z')
const TZ = 'Europe/Istanbul'
const AYSE = { account_id: 'a1', full_name: 'Ayşe Kaya' }

function item(over: Partial<NotificationItem> = {}): NotificationItem {
  return makeNotification(over)
}

function mountRow(over: Partial<NotificationItem> = {}, pending = false, deciding = false) {
  return mount(NotificationRow, {
    props: {
      item: item(over),
      group: 'today',
      now: NOW,
      timeZone: TZ,
      pending,
      deciding,
      me: 'me-1',
    },
  })
}

describe('NotificationRow — satır içi karar', () => {
  it('tarih talebi: "İncele" + bekleyen kararda canlı Onayla/Reddet (stub yok)', async () => {
    const wrapper = mountRow({
      type: 'work.date_change.requested',
      action: { kind: 'review_date_request', request_id: 'r1', state: 'pending', resolution: null },
    })
    const buttons = wrapper.findAll('.nb-acts button')
    expect(buttons.map((b) => b.text())).toEqual(['İncele', 'Onayla', 'Reddet'])
    expect(buttons.every((b) => b.attributes('disabled') === undefined)).toBe(true)
    expect(wrapper.find('[data-design-stub]').exists()).toBe(false)
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')
    await buttons[2]!.trigger('click')
    expect([
      wrapper.emitted('activate')?.length,
      wrapper.emitted('approve')?.length,
      wrapper.emitted('reject')?.length,
    ]).toEqual([1, 1, 1])
  })

  it('karar yüzü: action yoksa çizilmez; karar sürerken devre dışı; bağlam eksikse devre dışı + neden', () => {
    expect(
      mountRow({ type: 'work.date_change.requested' })
        .find('[data-testid="notification-decision"]')
        .exists(),
    ).toBe(false)
    const pendingAction = {
      kind: 'approve_task' as const,
      request_id: null,
      state: 'pending' as const,
      resolution: null,
    }
    const busy = mountRow(
      {
        action: pendingAction,
        program_id: 'p1',
        department_id: 'd1',
        subject_ref: { kind: 'work_item', id: 'w1' },
      },
      false,
      true,
    )
    expect(
      busy
        .findAll('[data-testid="notification-decision"] button')
        .every((b) => b.attributes('disabled') !== undefined),
    ).toBe(true)
    const missing = mountRow({ action: pendingAction, program_id: 'p1', department_id: null })
    expect(
      missing
        .findAll('[data-testid="notification-decision"] button')
        .every((b) => b.attributes('disabled') !== undefined),
    ).toBe(true)
    expect(missing.get('.nb-dec__note').text()).toBe('Bu karar buradan verilemiyor')
  })

  it('sonuçlanmış karar: sonuç + kim; başkası karar verdiyse adı, ben verdiysem "sen"; geri al yok', () => {
    const resolved = (
      decided_by: typeof AYSE | null,
      outcome: 'approved' | 'deleted' = 'approved',
    ) =>
      mountRow({
        action: {
          kind: 'review_date_request',
          request_id: 'r1',
          state: 'resolved',
          resolution: { outcome, decided_by, decided_at: '2026-11-14T08:58:00Z' },
        },
      })
    expect(resolved(AYSE).get('[data-testid="notification-resolved"]').text()).toBe(
      'Onaylandı · Ayşe Kaya',
    )
    expect(
      resolved({ account_id: 'me-1', full_name: 'Ben' })
        .get('[data-testid="notification-resolved"]')
        .text(),
    ).toBe('Onaylandı · sen')
    expect(resolved(null, 'deleted').get('[data-testid="notification-resolved"]').text()).toBe(
      'Görev silindi',
    )
    expect(resolved(AYSE).find('[data-testid="notification-decision"]').exists()).toBe(false)
    expect(resolved(AYSE).text()).not.toContain('Geri al')
  })
})
