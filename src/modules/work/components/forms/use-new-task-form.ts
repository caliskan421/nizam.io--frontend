/**
 * Yeni görev formu durumu (E-03-57; K11 vee-validate + zod; K5 yazma protokolü).
 *
 *  - Form her açılışta sıfırlanır; koordinatörlük çağıranın önseçimi (kapsamdan) ya da tek
 *    seçenekse o (ortak-kurallar §1); seçenek dışı önseçim düşer.
 *  - Gönder = yeni kullanıcı eylemi → yeni `Idempotency-Key` (`useCreateWorkItemWithAssignees`;
 *    düzeltip yeniden gönderme yeni anahtar). Ağ tekrarı yalnız "sonuç bilinmiyor" bildirimindeki
 *    "Yeniden gönder" ile, aynı anahtar + aynı gövde (`UiOutcomeNotice`).
 *  - Başarı: liste/görev geçersizlemesi veri katmanında; `created` → çağıran paneli açar.
 *    Kısmi başarı (ek atama başarısız) gerçek durumu söyler (ortak-kurallar §7, CX-S-03).
 *  - 422 alan hataları ilgili alana (kod → i18n); diğer hatalar ortak bildirim.
 */
import { useForm } from 'vee-validate'
import { computed, shallowRef, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useCreateWorkItemWithAssignees } from '../../api'
import { createPartialText, workText } from '../../model/messages'
import { departmentTarget } from '../../model/target'
import type { WorkItem } from '../../model/types'
import { formsText } from './messages'
import {
  emptyNewTask,
  fieldErrorsOf,
  newTaskSchema,
  toCreateBody,
  toTypedSchema,
  type NewTaskValues,
} from './new-task-schema'
import { useAssigneeCandidates } from './use-assignee-candidates'
import { useTaskDepartments } from './use-task-departments'

export interface NewTaskFormHooks {
  open: () => boolean
  departmentId: () => string | null | undefined
  created: (item: WorkItem) => void
  close: () => void
}

type CreateOutcome = MutationOutcome<unknown, WorkItem, unknown>

function pickDepartment(current: string, preferred: string, options: readonly { value: string }[]) {
  const has = (id: string) => id !== '' && options.some((o) => o.value === id)
  if (has(current)) return current
  if (has(preferred)) return preferred
  return options.length === 1 ? options[0]!.value : ''
}

export function useNewTaskForm(hooks: NewTaskFormHooks) {
  const store = useScopeStore()
  const form = useForm<NewTaskValues>({
    validationSchema: toTypedSchema(newTaskSchema()),
    initialValues: emptyNewTask(null),
  })
  const departments = useTaskDepartments(() => form.values.departmentId)
  const members = useAssigneeCandidates(() =>
    hooks.open() ? departmentTarget(store.snapshot, form.values.departmentId || null) : null,
  )
  const extraCandidates = computed(() =>
    members.candidates.value.filter((c) => c.accountId !== form.values.assignee),
  )

  watch(
    hooks.open,
    (isOpen) => {
      if (isOpen) form.resetForm({ values: emptyNewTask(hooks.departmentId() ?? null) })
    },
    { immediate: true },
  )
  watch(
    [hooks.open, departments.options],
    ([isOpen, options]) => {
      if (!isOpen || options.length === 0) return
      const next = pickDepartment(form.values.departmentId, hooks.departmentId() ?? '', options)
      if (next !== form.values.departmentId) form.setFieldValue('departmentId', next)
    },
    { immediate: true },
  )
  watch(
    () => form.values.departmentId,
    () => {
      form.setFieldValue('assignee', '')
      form.setFieldValue('extra', [])
    },
  )
  watch(
    () => form.values.assignee,
    (id) =>
      form.setFieldValue(
        'extra',
        form.values.extra.filter((x) => x !== id),
      ),
  )

  const submitting = useNewTaskSubmit(form, departments.canAssignExtra, hooks)

  function toggleExtra(accountId: string, on: boolean): void {
    const rest = form.values.extra.filter((id) => id !== accountId)
    form.setFieldValue('extra', on ? [...rest, accountId] : rest)
  }

  return { form, departments, members, extraCandidates, toggleExtra, ...submitting }
}

function useNewTaskSubmit(
  form: ReturnType<typeof useForm<NewTaskValues>>,
  canAssignExtra: { value: boolean },
  hooks: NewTaskFormHooks,
) {
  const store = useScopeStore()
  const create = useCreateWorkItemWithAssignees()
  const notice = shallowRef<CreateOutcome | null>(null)
  let requestedExtra = false

  function finish(item: WorkItem, partial: string | null): void {
    useToast().push(
      partial
        ? { message: partial, tone: 'danger' }
        : { message: formsText('workForms.create.done') },
    )
    hooks.created(item)
    hooks.close()
  }

  function fail(outcome: CreateOutcome): void {
    if (outcome.kind === 'failed') {
      const errors = fieldErrorsOf(outcome.error)
      if (Object.keys(errors).length > 0) return form.setErrors(errors)
    }
    if (outcome.kind === 'unknown_outcome') {
      notice.value = outcome
      return
    }
    notifyOutcome(outcome)
  }

  const submit = form.handleSubmit(async (values) => {
    const target = departmentTarget(store.snapshot, values.departmentId)
    if (!target) return
    notice.value = null
    const extra = canAssignExtra.value ? values.extra : []
    requestedExtra = extra.some((id) => id !== values.assignee)
    const result = await create.submit({
      target,
      body: toCreateBody(values),
      extraAssignees: extra,
    })
    if (result.kind === 'primary_failed') return fail(result.primary)
    finish(result.primary.data, createPartialText(result))
  })

  /** "Yeniden gönder" sonucu (aynı anahtar): ek atama adımı bu yolda koşmaz → kısmi metin. */
  function resolved(outcome: MutationOutcome<unknown, unknown, unknown>): void {
    const result = outcome as CreateOutcome
    notice.value = null
    if (result.kind !== 'success') return fail(result)
    finish(result.data, requestedExtra ? workText('work.create.partial') : null)
  }

  return { submit, resolved, notice, isPending: create.isPending }
}
