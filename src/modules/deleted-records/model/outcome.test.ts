import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'

import { interpretOutcome } from './outcome'

const TASK = { kind: 'gorev', title: 'Saha pano montajı' } as const
const ACCOUNT = { kind: 'kullanici', title: 'Ayşe' } as const

const failed = (code: string, status = 409): MutationOutcome<unknown, unknown, unknown> => ({
  kind: 'failed',
  error: new ApiError({ code, status }),
})
const success = (data: unknown): MutationOutcome<unknown, unknown, unknown> => ({
  kind: 'success',
  data,
  status: 200,
  replayed: false,
  idempotencyKey: '',
})

describe('yaşam döngüsü sonucu yorumu', () => {
  it('başarı: geri yüklendi / kalıcı silindi (+ files_deleted)', () => {
    expect(interpretOutcome('restore', TASK, success({}))).toEqual({
      kind: 'done',
      message: 'Saha pano montajı geri yüklendi.',
    })
    expect(interpretOutcome('purge', TASK, success({ files_deleted: 0 }))).toEqual({
      kind: 'done',
      message: 'Saha pano montajı kalıcı olarak silindi.',
    })
    expect(interpretOutcome('purge', TASK, success({ files_deleted: 3 }))).toEqual({
      kind: 'done',
      message: 'Saha pano montajı kalıcı olarak silindi, 3 dosya da silindi.',
    })
  })

  it.each([
    'work.not_deleted',
    'collaboration.not_deleted',
    'organization.not_deleted',
    'identity.not_deleted',
  ])('409 %s → zaten geri yüklenmiş (başarı gibi, yenile)', (code) => {
    expect(interpretOutcome('restore', TASK, failed(code))).toEqual({
      kind: 'gone',
      message: 'Kayıt zaten geri yüklenmiş.',
    })
  })

  it.each([
    'work.item_not_found',
    'collaboration.meeting_not_found',
    'organization.department_not_found',
    'identity.account_not_found',
    'organization.account_not_found',
  ])('404 %s: geri yüklemede "bulunamadı" + yenile; kalıcı silmede başarı gibi', (code) => {
    expect(interpretOutcome('restore', ACCOUNT, failed(code, 404))).toEqual({
      kind: 'refresh',
      message: 'Kayıt bulunamadı.',
    })
    expect(interpretOutcome('purge', ACCOUNT, failed(code, 404))).toEqual({
      kind: 'gone',
      message: 'Kayıt zaten silinmiş.',
    })
  })

  it.each([
    'work.permanent_requires_deleted',
    'collaboration.permanent_requires_deleted',
    'organization.permanent_requires_deleted',
    'identity.permanent_requires_deleted',
  ])('409 %s → silinmiş değil + yenile', (code) => {
    expect(interpretOutcome('purge', TASK, failed(code))).toEqual({
      kind: 'refresh',
      message: 'Kayıt silinmiş durumda değil.',
    })
  })

  it('409 work.department_unavailable → satır içi bildirim + Koordinatörlük yolu', () => {
    expect(interpretOutcome('restore', TASK, failed('work.department_unavailable'))).toEqual({
      kind: 'notice',
      message: expect.stringContaining('Koordinatörlük sekmesinden geri yükleyin'),
      departmentsLink: true,
    })
  })

  it.each([
    ['work.constraint_violation', 'kullanılıyor'],
    ['identity.account_referenced', 'kullanılıyor'],
    ['organization.department_in_use', 'görevleri veya program katılımı'],
    ['provisioning.write_not_allowed', 'kapalı'],
  ])('409 %s → hata bildirimi (%s)', (code, fragment) => {
    const result = interpretOutcome('purge', TASK, failed(code))
    expect(result).toMatchObject({ kind: 'error', refresh: false })
    expect(result && 'message' in result && result.message).toContain(fragment)
  })

  it('görev kalıcı silmede 5xx (sonuç bilinmiyor): silme tamamlanamadı + yenile (GAP-052)', () => {
    const unknown = {
      kind: 'unknown_outcome',
      error: new ApiError({ code: 'platform.internal', status: 500 }),
      reason: 'server',
      draft: {},
      idempotencyKey: '',
      firstSentAt: 0,
      retry: null,
    } as MutationOutcome<unknown, unknown, unknown>
    expect(interpretOutcome('purge', TASK, unknown)).toEqual({
      kind: 'error',
      message: 'Silme tamamlanamadı, yeniden deneyin.',
      refresh: true,
    })
    expect(interpretOutcome('purge', ACCOUNT, unknown)).toBeNull()
    expect(interpretOutcome('restore', TASK, unknown)).toBeNull()
  })

  it('diğer hatalar ortak bildirime bırakılır', () => {
    expect(interpretOutcome('restore', TASK, failed('platform.unauthenticated', 401))).toBeNull()
    expect(interpretOutcome('restore', TASK, failed('work.not_authorized', 403))).toBeNull()
  })
})
