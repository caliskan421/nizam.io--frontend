import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from './error-codes.gen'
import { OPERATIONS } from './operations.gen'

// Üretilmiş haritanın sözleşme ilkeleriyle tutarlılığı (C1: S2 → program başlığı,
// S3 → program + departman; yazma → CSRF; S0 → kimliksiz).
describe('operations.gen', () => {
  const entries = Object.entries(OPERATIONS)

  it('v0.28.0-api sözleşmesinin 297 ucu üretildi', () => {
    expect(entries).toHaveLength(297)
  })

  it('v0.27/v0.28 yeni dört uç üretildi (kapsam sınıfı sözleşmeden)', () => {
    const scopes = (id: string) =>
      entries.filter(([, meta]) => (meta as { operationId: string }).operationId === id)
    expect(
      scopes('getFileThumbnail').map(([key, meta]) => [key, (meta as { scope: string }).scope]),
    ).toEqual([['GET /v1/files/{id}/thumbnail', 'S3']])
    for (const [id, path] of [
      ['summarizeAuditEntries', '/v1/audit/summary'],
      ['listAuditActionTypes', '/v1/audit/action-types'],
      ['exportAuditEntries', '/v1/audit/export'],
    ] as const) {
      expect(scopes(id).map(([key, meta]) => [key, (meta as { scope: string }).scope])).toEqual([
        [`GET ${path}`, 'S1'],
      ])
    }
  })

  it.each(entries)('%s kapsam/CSRF/kimlik tutarlı', (key, meta) => {
    const op = meta as {
      scope: string
      programHeader: boolean
      departmentHeader: boolean
      csrf: boolean
      auth: boolean
    }
    const method = key.split(' ')[0]
    expect(op.programHeader).toBe(op.scope === 'S2' || op.scope === 'S3')
    expect(op.departmentHeader).toBe(op.scope === 'S3')
    // Sözleşme istisnası: dosya yükleme (multipart) CSRF başlığı istemez, taşıyıcı yalnız Bearer.
    expect(op.csrf).toBe(method !== 'GET' && key !== 'POST /v1/work-items/{id}/files')
    expect(op.auth).toBe(op.scope !== 'S0')
  })

  it('hata kataloğu 236 kod ve message_key = errors.<kod>', () => {
    const codes = Object.entries(ERROR_CODES)
    expect(codes).toHaveLength(236)
    for (const [code, entry] of codes) expect(entry.messageKey).toBe(`errors.${code}`)
  })
})
