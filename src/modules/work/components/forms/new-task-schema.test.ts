import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import {
  emptyNewTask,
  fieldErrorsOf,
  newTaskSchema,
  toCreateBody,
  toTypedSchema,
  type NewTaskValues,
} from './new-task-schema'

const valid: NewTaskValues = {
  ...emptyNewTask('d1'),
  title: '  Rapor  ',
  startOn: '2026-11-10',
  endOn: '2026-11-12',
}

function apiError(code: string, fields: Array<{ field: string; code: string }> = []) {
  return new ApiError({
    code,
    status: 422,
    requestId: 'r',
    fields: fields.map((f) => ({ ...f, messageKey: `errors.${f.code}` })),
  })
}

describe('yeni görev şeması (K11 zod)', () => {
  it('varsayılanlar: kanıt bayrağı true (ADR-0024), öncelik orta, atamasız', () => {
    expect(emptyNewTask(null)).toMatchObject({
      departmentId: '',
      assignee: '',
      extra: [],
      priority: 'orta',
      evidence: true,
    })
    expect(emptyNewTask('d9').departmentId).toBe('d9')
  })

  it('geçerli değer; başlık kırpılır', async () => {
    const r = await newTaskSchema().safeParseAsync(valid)
    expect(r.success).toBe(true)
    expect(r.data?.title).toBe('Rapor')
  })

  it.each([
    ['boş başlık', { title: '   ' }, 'title'],
    ['koordinatörlük yok', { departmentId: '' }, 'departmentId'],
    ['başlangıç yok', { startOn: '' }, 'startOn'],
    ['bitiş biçimsiz', { endOn: '12.11.2026' }, 'endOn'],
    ['bitiş başlangıçtan önce', { endOn: '2026-11-09' }, 'endOn'],
  ])('%s → %s alanında hata', async (_name, patch, path) => {
    const parsed = await toTypedSchema(newTaskSchema()).parse({ ...valid, ...patch })
    expect(parsed.value).toBeUndefined()
    expect(parsed.errors.map((e) => e.path)).toEqual([path])
    expect(parsed.errors[0]!.errors[0]).toBeTruthy()
  })

  it('aynı gün başlangıç = bitiş geçerli', async () => {
    const parsed = await toTypedSchema(newTaskSchema()).parse({ ...valid, endOn: valid.startOn })
    expect(parsed.errors).toEqual([])
  })
})

describe('istek gövdesi (CreateWorkItemRequest)', () => {
  it('boş isteğe bağlı alanlar gönderilmez; kanıt bayrağı her zaman açık yazılır', () => {
    expect(toCreateBody(valid)).toEqual({
      title: 'Rapor',
      start_on: '2026-11-10',
      end_on: '2026-11-12',
      priority: 'orta',
      completion_evidence_required: true,
    })
  })

  it('tek atanan + açıklama; ek atananlar gövdeye girmez', () => {
    const body = toCreateBody({
      ...valid,
      assignee: 'acc-1',
      extra: ['acc-2'],
      description: ' not ',
      evidence: false,
    })
    expect(body).toMatchObject({
      assignee_account_id: 'acc-1',
      description: 'not',
      completion_evidence_required: false,
    })
    expect(JSON.stringify(body)).not.toContain('acc-2')
  })
})

describe('sunucu alan hataları', () => {
  it('fields[] → form alanı (kod → i18n, sunucu message yok)', () => {
    const errors = fieldErrorsOf(
      apiError('work.input_invalid', [
        { field: 'start_on', code: 'work.input_invalid' },
        { field: 'bilinmeyen', code: 'work.input_invalid' },
      ]),
    )
    expect(Object.keys(errors)).toEqual(['startOn'])
    expect(errors.startOn).toBe('Girilen bilgiler geçersiz.')
  })

  it('work.assignee_not_member alan listesi olmadan da atanan alanına', () => {
    expect(fieldErrorsOf(apiError('work.assignee_not_member')).assignee).toBe(
      'Atanan kişi bu departmanın üyesi değil.',
    )
  })

  it('eşlenemeyen hata boş döner', () => {
    expect(fieldErrorsOf(apiError('work.not_authorized'))).toEqual({})
  })
})
