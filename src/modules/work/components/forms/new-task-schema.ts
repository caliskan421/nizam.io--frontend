/**
 * Yeni görev formu (E-03-57; K11 vee-validate + zod) — saf model: alan kümesi
 * `CreateWorkItemRequest` (03 `backend.md` §2), zod şeması, vee-validate bağdaştırıcısı, gövde
 * kurucu ve sunucu alan hatası eşlemesi.
 *
 *  - Kanıt bayrağı varsayılanı `true` (ADR-0024; form kapalı göstermez).
 *  - Öncelik varsayılanı `orta` (sözleşme varsayılanı).
 *  - Tek atanan `assignee_account_id`; ek atananlar ikinci adım (`addAssignments`, yalnız
 *    koordinatör — s.140) ve gövdeye girmez.
 *  - "Yönetici dışında `start_on` en çok 40 gün geçmiş" kuralı sunucudadır (422
 *    `work.input_invalid` + alan); istemci yalnız biçim ve aralık sırasını denetler.
 */
import type { TypedSchema, TypedSchemaError } from 'vee-validate'
import { z } from 'zod'

import type { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'

import type { CreateWorkItemBody, WorkItemPriority } from '../../model/types'
import { formsText } from './messages'

// CSP (`script-src` eval yok): zod v4'ün JIT yoklaması (`new Function('')`) yakalansa da üretim
// CSP'sinde `securitypolicyviolation` raporlar. JIT kapalı; ilk şema/ayrıştırmadan önce (K11:
// zod yalnız bu form katmanında). O5 görsel doğrulama, W63.
z.config({ jitless: true })

/** Sözleşme sırası (`CreateWorkItemRequest.priority` enum). */
export const PRIORITIES = [
  'dusuk',
  'orta',
  'yuksek',
  'acil',
] as const satisfies readonly WorkItemPriority[]

const DAY = /^\d{4}-\d{2}-\d{2}$/

export interface NewTaskValues {
  title: string
  departmentId: string
  /** Boş dize = atamasız. */
  assignee: string
  /** Ek atananlar (yalnız koordinatör; `addAssignments`). */
  extra: string[]
  startOn: string
  endOn: string
  priority: WorkItemPriority
  description: string
  evidence: boolean
}

export type NewTaskField = keyof NewTaskValues

export function emptyNewTask(departmentId: string | null): NewTaskValues {
  return {
    title: '',
    departmentId: departmentId ?? '',
    assignee: '',
    extra: [],
    startOn: '',
    endOn: '',
    priority: 'orta',
    description: '',
    evidence: true,
  }
}

/** zod şeması (metinler çağrı anında i18n'den). */
export function newTaskSchema() {
  const day = z.string().regex(DAY, formsText('workForms.create.error.date'))
  return z
    .object({
      title: z.string().trim().min(1, formsText('workForms.create.error.title')),
      departmentId: z.string().min(1, formsText('workForms.create.error.department')),
      assignee: z.string(),
      extra: z.array(z.string()),
      startOn: day,
      endOn: day,
      priority: z.enum(PRIORITIES),
      description: z.string(),
      evidence: z.boolean(),
    })
    .refine((v) => !DAY.test(v.startOn) || !DAY.test(v.endOn) || v.endOn >= v.startOn, {
      path: ['endOn'],
      message: formsText('workForms.create.error.range'),
    })
}

/** zod → vee-validate `TypedSchema` (yerel bağdaştırıcı; ek paket yok). */
export function toTypedSchema<O>(schema: z.ZodType<O>): TypedSchema<NewTaskValues, O> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values)
      if (result.success) return { value: result.data, errors: [] }
      const byPath = new Map<string, string[]>()
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        byPath.set(path, [...(byPath.get(path) ?? []), issue.message])
      }
      const errors: TypedSchemaError[] = [...byPath].map(([path, list]) => ({ path, errors: list }))
      return { errors }
    },
  }
}

/** Form değerlerinden istek gövdesi (boş isteğe bağlı alanlar gönderilmez). */
export function toCreateBody(values: NewTaskValues): CreateWorkItemBody {
  const description = values.description.trim()
  return {
    title: values.title.trim(),
    start_on: values.startOn,
    end_on: values.endOn,
    priority: values.priority,
    completion_evidence_required: values.evidence,
    ...(values.assignee ? { assignee_account_id: values.assignee } : {}),
    ...(description ? { description } : {}),
  }
}

/** Sunucu alan adı → form alanı (`fields[].field`). */
const SERVER_FIELDS: Readonly<Record<string, NewTaskField>> = {
  title: 'title',
  start_on: 'startOn',
  end_on: 'endOn',
  priority: 'priority',
  description: 'description',
  assignee_account_id: 'assignee',
  completion_evidence_required: 'evidence',
}

/**
 * 422 hatasından alan hataları (metin kod → i18n). `work.assignee_not_member` alan listesi
 * olmadan da atanan alanına bağlanır (03 `backend.md` §2). Eşlenemeyen hata boş döner.
 */
export function fieldErrorsOf(error: ApiError): Partial<Record<NewTaskField, string>> {
  const out: Partial<Record<NewTaskField, string>> = {}
  for (const f of error.fields) {
    const field = SERVER_FIELDS[f.field]
    if (field && !out[field]) out[field] = errorText(f)
  }
  if (error.code === 'work.assignee_not_member' && !out.assignee) {
    out.assignee = errorText(error)
  }
  return out
}
