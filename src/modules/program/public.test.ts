import { describe, expect, it } from 'vitest'

import * as program from './public'

describe('program modülü dış yüzü', () => {
  it('yalnız rota kaydı ve yetki yüzü (bileşen yok)', () => {
    expect(Object.keys(program).sort()).toEqual([
      'PROGRAMS_ROUTE',
      'PROGRAM_CAPABILITIES',
      'canProgram',
      'programFacts',
      'programRoutes',
    ])
    expect(program.PROGRAMS_ROUTE).toEqual({ name: 'program.programs', path: '/programlar' })
  })
})
