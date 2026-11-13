import { describe, expect, it, vi } from 'vitest'

import type { DownloadResult } from '@/shared/download'
import { ApiError } from '@/shared/errors/api-error'

import { settleDownload } from './settle'
import type { ReportRequest } from './types'

type R = DownloadResult<ReportRequest>
const hooks = () => ({ saved: vi.fn(), consumeError: vi.fn(), cooldown: vi.fn() })
const err = (code: string, status: number) => new ApiError({ code, status })

describe('indirme sonucu → rapor sonucu', () => {
  it('kaydedildi: bildirim kancası, sayaç yok', () => {
    const h = hooks()
    expect(settleDownload({ kind: 'saved', fileName: 'a.pdf' }, h)).toEqual({
      kind: 'saved',
      fileName: 'a.pdf',
    })
    expect(h.saved).toHaveBeenCalledWith('a.pdf')
    expect(h.cooldown).not.toHaveBeenCalled()
  })

  it('tüketimde 429 export_in_progress + Retry-After: ortak yetki kanalı + sayaç', () => {
    const h = hooks()
    const e = err('reporting.export_in_progress', 429)
    const out = settleDownload({ kind: 'failed', error: e, retryAfter: 1 } satisfies R, h)
    expect(out).toMatchObject({ kind: 'failed', failure: { kind: 'export_in_progress' } })
    expect(h.consumeError).toHaveBeenCalledWith(e)
    expect(h.cooldown).toHaveBeenCalledWith(1)
  })

  it('503 capacity_full: sayaç yok', () => {
    const h = hooks()
    settleDownload(
      { kind: 'failed', error: err('reporting.capacity_full', 503), retryAfter: null },
      h,
    )
    expect(h.cooldown).not.toHaveBeenCalled()
  })

  it('başlıksız export_in_progress: sayaç yok (BE-135)', () => {
    const h = hooks()
    settleDownload(
      { kind: 'failed', error: err('reporting.export_in_progress', 429), retryAfter: null },
      h,
    )
    expect(h.cooldown).not.toHaveBeenCalled()
  })

  it('bilet üretimi 429 platform.rate_limited: sayaç', () => {
    const h = hooks()
    const out = settleDownload(
      {
        kind: 'ticket_failed',
        outcome: {
          kind: 'rate_limited',
          error: err('platform.rate_limited', 429),
          retryAfter: 60,
        },
      },
      h,
    )
    expect(out).toMatchObject({ kind: 'failed', failure: { kind: 'rate_limited', retryAfter: 60 } })
    expect(h.cooldown).toHaveBeenCalledWith(60)
    // Bilet üretimi hatası yetki kanalına tüketim kancasından gitmez (motor kendisi yayınlar).
    expect(h.consumeError).not.toHaveBeenCalled()
  })

  it('disposed ve sessiz bilet sonuçları iptal sayılır', () => {
    const h = hooks()
    expect(settleDownload({ kind: 'disposed' }, h)).toEqual({ kind: 'cancelled' })
    expect(
      settleDownload(
        {
          kind: 'ticket_failed',
          outcome: { kind: 'scope_changed' } as never,
        },
        h,
      ),
    ).toEqual({ kind: 'cancelled' })
  })
})
