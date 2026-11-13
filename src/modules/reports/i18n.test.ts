import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'
import { trReports } from '@/shared/i18n/tr/reports'

import { REPORT_FAILURE_KINDS, REPORT_KINDS } from './model/types'
import { classifyFailure } from './model/failure'
import { ApiError } from '@/shared/errors/api-error'

const walk = (node: Record<string, unknown>, prefix: string): [string, string][] =>
  Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string'
      ? [[`${prefix}${k}`, v] as [string, string]]
      : walk(v as Record<string, unknown>, `${prefix}${k}.`),
  )

describe('trReports (tek kök ağaç)', () => {
  it('kök yalnız reports; her yaprak statik ağaçta çözülür', () => {
    expect(Object.keys(trReports)).toEqual(['reports'])
    const g = i18n.global
    for (const [key, text] of walk(trReports, '')) {
      expect(g.te(key), key).toBe(true)
      expect(g.tm(key), key).toBe(text)
    }
  })

  it('dört rapor türünün düğme etiketi var', () => {
    for (const kind of REPORT_KINDS) {
      expect(i18n.global.te(`reports.action.label.${kind}`), kind).toBe(true)
    }
  })

  it('her hata sınıfının metni çözülür (kendi metni ya da errors.*)', () => {
    const codes: Record<string, string> = {
      export_in_progress: 'reporting.export_in_progress',
      rate_limited: 'platform.rate_limited',
      capacity_full: 'reporting.capacity_full',
      not_authorized: 'reporting.not_authorized',
      not_found: 'reporting.not_found',
      input_invalid: 'reporting.input_invalid',
      too_large: 'platform.body_too_large',
      ticket_invalid: 'identity.download_ticket_invalid',
      retry: 'platform.conflict_retry',
      report_failed: 'audit.entry_rejected',
      unavailable: 'identity.unavailable',
      network: 'client.network_error',
      other: 'records.busy',
    }
    for (const kind of REPORT_FAILURE_KINDS) {
      const failure = classifyFailure(new ApiError({ code: codes[kind]! }), null)
      expect(failure.kind).toBe(kind)
      expect(i18n.global.te(failure.messageKey), `${kind}: ${failure.messageKey}`).toBe(true)
    }
  })
})
