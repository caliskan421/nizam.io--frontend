import { expect, it } from 'vitest'

import type { ScopeSnapshot } from '@/shared/scope/scope'

import { resolveView } from './views'

const scope: ScopeSnapshot = { programId: 'p1', departmentId: null, lens: 'admin' }
const today = '2026-11-20'
const meeting = (from?: string, to?: string) =>
  resolveView(
    {
      gorunum: 'toplantilar',
      filtre: { program: 'p1', departman: 'd1', baslangic: from, bitis: to },
    },
    scope,
    true,
    today,
  )

it('geçmiş toplantı aralığını tarih ve birimle Geçmiş sekmesine yönlendirir', () => {
  expect(meeting('2026-11-10', '2026-11-19')?.to).toEqual({
    name: 'collaboration.meetings',
    query: { koordinatorluk: 'd1', from: '2026-11-10', to: '2026-11-19', zaman: 'gecmis' },
  })
})

it('bugünden başlayan aralığı yaklaşan sekmesine bırakır, iki sekmeye yayılanı gizler', () => {
  expect(meeting('2026-11-20', '2026-11-22')?.to).toEqual({
    name: 'collaboration.meetings',
    query: { koordinatorluk: 'd1', from: '2026-11-20', to: '2026-11-22' },
  })
  expect(meeting('2026-11-19', '2026-11-20')).toBeNull()
  expect(meeting(undefined, '2026-11-20')).toBeNull()
})
