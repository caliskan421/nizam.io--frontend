import { describe, expect, it } from 'vitest'

import type { DateChangeRequest } from '@/modules/timeline/public'

import { requestParts } from './request-parts'

const TZ = 'Europe/Istanbul'

function request(over: Partial<DateChangeRequest> = {}): DateChangeRequest {
  return {
    request_id: 'r1',
    work_item_id: 'w1',
    status: 'pending',
    old_start_on: '2026-09-01',
    old_end_on: '2026-09-30',
    new_start_on: '2026-09-01',
    new_end_on: '2026-10-31',
    created_at: '2026-10-19T08:30:00Z',
    requested_by: { account_id: 'a', full_name: 'Ayşe' },
    reviewed_at: null,
    reviewed_by: null,
    ...over,
  }
}

describe('tarih talebi satır parçaları (BE-140)', () => {
  it('bekleyen talep: yalnız gönderim günü; karar zamanı ve not yok', () => {
    expect(requestParts(request(), TZ)).toEqual({
      sent: '19.10 gönderildi',
      decided: null,
      note: null,
    })
  })

  it('kararlı talep: karar günü ve not; gün sınırı kurulum diliminde', () => {
    const decided = request({
      status: 'rejected',
      // 20 Ekim 23:30 UTC = 21 Ekim 02:30 İstanbul
      reviewed_at: '2026-10-20T23:30:00Z',
      review_reason: '  tedarik\n belgesi eksik ',
    })
    expect(requestParts(decided, TZ)).toEqual({
      sent: '19.10 gönderildi',
      decided: '21.10 karar verildi',
      note: 'Yönetici notu: tedarik belgesi eksik',
    })
  })

  it('uzun not kırpılır; biçimsiz zaman → parça yok (uydurma yok)', () => {
    const long = requestParts(request({ review_reason: 'a'.repeat(300) }), TZ).note!
    expect([...long]).toHaveLength('Yönetici notu: '.length + 201)
    expect(requestParts(request({ created_at: 'x' }), TZ).sent).toBeNull()
  })
})
