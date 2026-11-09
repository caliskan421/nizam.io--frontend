import { describe, expect, it } from 'vitest'

import { EMPTY_REASON_STATES, NO_DEPARTMENT_EXEMPT_ROUTES, resolveShellContent } from './resolve'

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

  it('yönetici departman boşluğu → "departman yok" (S1 ana sayfa dahil); S0 muaf', () => {
    const base = { status: 'ready', emptyReason: null } as const
    for (const routeScope of ['S1', 'S2', 'S3'] as const) {
      expect(
        resolveShellContent({ ...base, routeScope, routeName: 'home', departmentGap: 'empty' }),
      ).toEqual({ kind: 'open-state', name: 'state.no-department' })
    }
    expect(resolveShellContent({ ...base, routeScope: 'S0', departmentGap: 'empty' }).kind).toBe(
      'content',
    )
    expect(resolveShellContent({ ...base, routeScope: 'S1', departmentGap: 'checking' }).kind).toBe(
      'loading',
    )
    expect(resolveShellContent({ ...base, routeScope: 'S1', departmentGap: 'none' }).kind).toBe(
      'content',
    )
    expect(resolveShellContent({ ...base, routeScope: 'S1' }).kind).toBe('content')
  })

  it('boş neden departman boşluğundan önce gelir (muaf rotada da)', () => {
    expect(
      resolveShellContent({
        status: 'empty',
        emptyReason: 'no_program',
        routeScope: 'S1',
        departmentGap: 'empty',
      }),
    ).toEqual({ kind: 'open-state', name: 'state.no-program' })
    expect(
      resolveShellContent({
        status: 'empty',
        emptyReason: 'no_program',
        routeScope: 'S2',
        routeName: 'organization.coordinatorships',
        departmentGap: 'empty',
      }),
    ).toEqual({ kind: 'open-state', name: 'state.no-program' })
  })

  it('F2 yönetim rotaları "programa departman katılmamış" durumundan muaf (W22 devri)', () => {
    expect([...NO_DEPARTMENT_EXEMPT_ROUTES].sort()).toEqual([
      'organization.coordinatorship',
      'organization.coordinatorships',
      'organization.user',
      'organization.users',
      'program.programs',
    ])
    const base = { status: 'ready', emptyReason: null } as const
    for (const routeName of NO_DEPARTMENT_EXEMPT_ROUTES) {
      // Muaf rota içeriği çizilir (boşluk kontrol edilirken de: yükleniyor değil).
      for (const departmentGap of ['empty', 'checking'] as const) {
        expect(
          resolveShellContent({ ...base, routeScope: 'S2', routeName, departmentGap }),
          `${routeName} ${departmentGap}`,
        ).toEqual({ kind: 'content' })
      }
    }
    // Muaf olmayan rotalar durum ekranını görür.
    for (const routeName of ['home', 'work.tasks'] as const) {
      expect(
        resolveShellContent({ ...base, routeScope: 'S2', routeName, departmentGap: 'empty' }),
      ).toEqual({ kind: 'open-state', name: 'state.no-department' })
    }
  })
})
