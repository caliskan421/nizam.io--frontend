import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import type { ArchiveDownloadResult } from '../../model/types'
import { zipFailureText } from './zip-status'

const failed = (code: string, retryAfter: number | null = null): ArchiveDownloadResult => ({
  kind: 'failed',
  error: new ApiError({ code }),
  retryAfter,
})

describe('zipFailureText', () => {
  it('başarı ve söküm için metin yok', () => {
    expect(zipFailureText({ kind: 'saved', fileName: 'a.zip' }, 'folder')).toBeNull()
    expect(zipFailureText({ kind: 'disposed' }, 'folder')).toBeNull()
  })

  it.each([['records.too_many_files'], ['records.too_large']])(
    '422 %s → ZIP için "çok büyük" (kapsama göre)',
    (code) => {
      expect(zipFailureText(failed(code), 'folder')).toBe(
        'Bu klasör tek ZIP için çok büyük; görevlerden tek tek indirin.',
      )
      expect(zipFailureText(failed(code), 'period')).toMatch(/Dönem arşivi tek ZIP için çok büyük/)
    },
  )

  it('429 Retry-After: saniye, dakika ve süresiz; sunucu iletisi yok', () => {
    expect(zipFailureText(failed('records.busy', 7), 'folder')).toBe(
      'Çok fazla istek gönderildi; 7 saniye sonra yeniden deneyin.',
    )
    expect(zipFailureText(failed('platform.rate_limited', 90), 'period')).toBe(
      'Çok fazla istek gönderildi; 2 dakika sonra yeniden deneyin.',
    )
    expect(zipFailureText(failed('platform.rate_limited'), 'folder')).toBe(
      'Çok fazla istek gönderildi; biraz bekleyip yeniden deneyin.',
    )
  })

  it('akış ortasında kopma: yarım indirme, tekrar deneyin (GAP-041)', () => {
    expect(zipFailureText(failed('client.network_error'), 'folder')).toBe(
      'Bağlantı kesildi; indirme yarım kalmış olabilir. Tekrar deneyin.',
    )
  })

  it('diğer kodlar ortak hata metni', () => {
    expect(zipFailureText(failed('records.not_authorized'), 'folder')).toBe(
      'Bu işlem için yetkiniz yok.',
    )
    expect(zipFailureText(failed('identity.download_ticket_invalid'), 'folder')).toMatch(
      /süresi dolmuş/,
    )
  })

  it('bilet üretimi başarısız: ortak sonuç metni; sahip söküldü → metin yok', () => {
    expect(
      zipFailureText(
        {
          kind: 'ticket_failed',
          outcome: {
            kind: 'rate_limited',
            error: new ApiError({ code: 'platform.rate_limited' }),
            retryAfter: 60,
          } as never,
        },
        'folder',
      ),
    ).toBe('Çok fazla istek gönderildi; 1 dakika sonra yeniden deneyin.')
    expect(
      zipFailureText(
        { kind: 'ticket_failed', outcome: { kind: 'owner_disposed' } as never },
        'folder',
      ),
    ).toBeNull()
  })
})
