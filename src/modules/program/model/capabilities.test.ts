import { describe, expect, it } from 'vitest'

import type { Standing } from '@/shared/scope/standing-facts'

import { canProgram, PROGRAM_CAPABILITIES, programFacts } from './capabilities'

const standing = (companyAdmin: boolean) => ({ companyAdmin, rows: [] }) as unknown as Standing

describe('program yetkileri (E-00-25; P1)', () => {
  it('yalnız şirket yöneticisi; standing yoksa her şey kapalı', () => {
    for (const cap of Object.keys(PROGRAM_CAPABILITIES) as (keyof typeof PROGRAM_CAPABILITIES)[]) {
      expect(canProgram(cap, programFacts(standing(true))), cap).toBe(true)
      expect(canProgram(cap, programFacts(standing(false))), cap).toBe(false)
      expect(canProgram(cap, programFacts(null)), cap).toBe(false)
    }
  })

  it('olgu mercekten bağımsızdır (girdi yalnız companyAdmin)', () => {
    expect(programFacts(standing(true))).toEqual({ ready: true, companyAdmin: true })
    expect(programFacts(null)).toEqual({ ready: false, companyAdmin: false })
  })
})
