import { describe, expect, it } from 'vitest'

import { EMPTY_REASON_STATES, resolveShellContent } from './resolve'

describe('kabuk içeriği (K7)', () => {
  it('boş neden → açık durum (S1+ ve eşleşmeyen rota)', () => {
    for (const routeScope of ['S1', 'S2', 'S3', undefined] as const) {
      expect(
        resolveShellContent({ status: 'empty', emptyReason: 'membership_required', routeScope }),
      ).toEqual({ kind: 'open-state', name: 'state.membership-pending' })
    }
    expect(EMPTY_REASON_STATES).toEqual({
      membership_required: 'state.membership-pending',
      no_program: 'state.no-program',
      no_lens: 'state.no-department',
    })
  })

  it('kapsamlı rotada (S2/S3) kapsam hazır değilse içerik yerine durum', () => {
    const at = (status: Parameters<typeof resolveShellContent>[0]['status']) =>
      resolveShellContent({ status, emptyReason: null, routeScope: 'S2' }).kind
    expect(at('ready')).toBe('content')
    expect(at('selecting')).toBe('selecting')
    expect(at('error')).toBe('error')
    expect(at('loading')).toBe('loading')
    expect(at('idle')).toBe('loading')
  })

  it('S0 rotası (açık kimlik sayfası) açık durumla örtülmez', () => {
    expect(
      resolveShellContent({ status: 'empty', emptyReason: 'no_program', routeScope: 'S0' }),
    ).toEqual({ kind: 'content' })
  })

  it('S0/S1 rotada kapsam beklenmez', () => {
    for (const routeScope of ['S0', 'S1', undefined] as const) {
      expect(resolveShellContent({ status: 'selecting', emptyReason: null, routeScope }).kind).toBe(
        'content',
      )
    }
  })
})
