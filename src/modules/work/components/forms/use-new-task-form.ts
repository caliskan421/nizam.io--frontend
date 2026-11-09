/**
 * Yeni görev formu durumu (E-03-57; K11 vee-validate + zod; K5 yazma protokolü).
 *
 *  - Form her açılışta sıfırlanır; koordinatörlük çağıranın önseçimi (kapsamdan) ya da tek
 *    seçenekse o (ortak-kurallar §1); seçenek dışı önseçim düşer.
 *  - Gönder = yeni kullanıcı eylemi → yeni `Idempotency-Key` (`useCreateWorkItemWithAssignees`;
 *    düzeltip yeniden gönderme yeni anahtar). Ağ tekrarı yalnız "sonuç bilinmiyor" bildirimindeki
 *    "Yeniden gönder" ile, aynı anahtar + aynı gövde (`UiOutcomeNotice`); başarıyla biterse ek
 *    atama adımı (`addAssignments`) o zaman koşar.
 *  - Atanan adayları `useDepartmentMembers` (`listMembers`; yalnız görev ataması).
 *  - Başarı: liste/görev geçersizlemesi veri katmanında; `created` → çağıran paneli açar.
 *    Kısmi başarı (ek atama başarısız) gerçek durumu söyler (ortak-kurallar §7, CX-S-03).
 *  - 422 alan hataları ilgili alana (kod → i18n); diğer hatalar ortak bildirim.
 *  - Form gönderim beklerken söküldüyse (CX-F1-Ö-07): bildirim, `created`/`close` ve hata akışı
 *    yok — tek istisna KISMİ sonuç (görev oluşturuldu, ek atama yapılamadı): kullanıcı bunu başka
 *    hiçbir ekrandan öğrenemez; uygulama düzeyi bildirim (`pushAppNotice`, aynı oturum neslinde).
 */
import { useForm } from 'vee-validate'
import { computed, ref, shallowRef, watch } from 'vue'

import {
  ownerLife,
  runWithFollowUps,
  type ActionContext,
  type MutationOutcome,
  type MutationSuccess,
} from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome } from '@/shared/ui/confirm'
import { pushAppNotice, useToast } from '@/shared/ui'

import { useAddAssignments, useCreateWorkItemWithAssignees } from '../../api'
import { useDepartmentMembers } from '../../api/members'
import { createPartialText } from '../../model/messages'
import { departmentTarget, targetOf } from '../../model/target'
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
import { useTaskDepartments } from './use-task-departments'

export interface NewTaskFormHooks {
  open: () => boolean
  departmentId: () => string | null | undefined
  /** URL girişinden hedef birim (W76); yetkili seçenekler dışındaysa yok sayılır. */
  presetDepartment?: () => string | null | undefined
  /** URL girişinden ön atanan (W76); formun birimindeki ekipte değilse yok sayılır. */
  assignee?: () => string | null | undefined
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
  const form = useForm<NewTaskValues>({
    validationSchema: toTypedSchema(newTaskSchema()),
    initialValues: emptyNewTask(null),
  })
  const departments = useTaskDepartments(() => form.values.departmentId)
  const members = useDepartmentMembers(() =>
    hooks.open() ? form.values.departmentId || null : null,
  )
  const extraCandidates = computed(() =>
    members.members.value.filter((c) => c.accountId !== form.values.assignee),
  )

  /** URL hedefi (W76) bekliyor: departman listesi gelene dek ya da hedef uygulanana dek. */
  const presetPending = ref(false)
  watch(
    hooks.open,
    (isOpen) => {
      presetPending.value = isOpen && Boolean(hooks.presetDepartment?.())
      if (isOpen) form.resetForm({ values: emptyNewTask(hooks.departmentId() ?? null) })
    },
    { immediate: true },
  )
  watch(
    [hooks.open, departments.options, departments.settled],
    ([isOpen, options, settled]) => {
      if (!isOpen || options.length === 0) return
      // URL hedefi (W76) yalnız yetkili seçenekler arasındaysa; liste gelmeden karar verilmez.
      const preset = presetPending.value ? (hooks.presetDepartment?.() ?? '') : ''
      const found = preset !== '' && options.some((o) => o.value === preset)
      if (found || settled) presetPending.value = false
      const current = found ? preset : form.values.departmentId
      const next = pickDepartment(current, hooks.departmentId() ?? '', options)
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

  useAssigneePreset(form, members, hooks, presetPending)

  const submitting = useNewTaskSubmit(form, departments.canAssignExtra, hooks)

  function toggleExtra(accountId: string, on: boolean): void {
    const rest = form.values.extra.filter((id) => id !== accountId)
    form.setFieldValue('extra', on ? [...rest, accountId] : rest)
  }

  return { form, departments, members, extraCandidates, toggleExtra, ...submitting }
}

/**
 * Ön atanan (W76): açılışta bir kez alınır; formun birimi için ekip listesi hazır olunca kişi
 * ekipteyse atanan alanı dolar, değilse sessizce düşer. Birim değişimi sıfırlaması (yukarıdaki
 * izleyici) önce çalışır; bu izleyici ondan SONRA kaydedilir.
 */
function useAssigneePreset(
  form: ReturnType<typeof useForm<NewTaskValues>>,
  members: ReturnType<typeof useDepartmentMembers>,
  hooks: NewTaskFormHooks,
  departmentPending: { value: boolean },
) {
  let pending: string | null = null
  watch(
    hooks.open,
    (isOpen) => {
      pending = isOpen ? (hooks.assignee?.() ?? null) : null
    },
    { immediate: true },
  )
  watch(
    [hooks.open, members.status, members.members, () => departmentPending.value],
    ([isOpen, status, list, waiting]) => {
      if (!isOpen || waiting || pending === null || form.values.departmentId === '') return
      if (status === 'loading' || status === 'idle') return
      const id = pending
      pending = null
      if (status === 'ready' && list.some((m) => m.accountId === id)) {
        form.setFieldValue('assignee', id)
      }
    },
    { immediate: true },
  )
}

/**
 * Ek atama adımı (`addAssignments`, görevin KENDİ kapsamı); ek atanan yoksa adım yok. Adım
 * oluşturma eyleminin bağlamıyla (kapsam + oturum nesli) gönderilir (CX-F1-E-03).
 */
function assignmentSteps(assign: ReturnType<typeof useAddAssignments>, extra: readonly string[]) {
  return (item: WorkItem, context: ActionContext | undefined) =>
    extra.length === 0
      ? []
      : [
          {
            name: 'assignments',
            run: () =>
              assign.submit(
                { target: targetOf(item), workItemId: item.work_item_id, accountIds: extra },
                { context },
              ),
          },
        ]
}

/**
 * Oluşturma sonucu (CX-F1-Ö-07): form canlıysa bildirim + `created` + `close`; söküldüyse yalnız
 * KISMİ sonuç uygulama düzeyinde bildirilir (ilk yazma gerçek, ardıl adım yapılamadı).
 */
function useCreateFinish(hooks: NewTaskFormHooks) {
  const toast = useToast() // kurulumda alınır: form sökülünce bildirim düşer
  const owner = ownerLife()

  function finish(primary: MutationSuccess<WorkItem>, partial: string | null): void {
    if (!owner.alive()) {
      if (partial) pushAppNotice({ message: partial, tone: 'danger' }, primary.context?.generation)
      return
    }
    toast.push(
      partial
        ? { message: partial, tone: 'danger' }
        : { message: formsText('workForms.create.done') },
    )
    hooks.created(primary.data)
    hooks.close()
  }

  return { owner, finish }
}

function useNewTaskSubmit(
  form: ReturnType<typeof useForm<NewTaskValues>>,
  canAssignExtra: { value: boolean },
  hooks: NewTaskFormHooks,
) {
  const store = useScopeStore()
  const create = useCreateWorkItemWithAssignees()
  const assign = useAddAssignments()
  const notice = shallowRef<CreateOutcome | null>(null)
  /** Son gönderimin ek atananları (ana atanan hariç) — "Yeniden gönder" başarısında koşar. */
  let pendingExtra: string[] = []

  const { owner, finish } = useCreateFinish(hooks)

  function fail(outcome: CreateOutcome): void {
    if (!owner.alive()) return
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
    pendingExtra = [...new Set(extra)].filter((id) => id !== values.assignee)
    const result = await create.submit({
      target,
      body: toCreateBody(values),
      extraAssignees: extra,
    })
    if (result.kind === 'primary_failed') return fail(result.primary)
    finish(result.primary, createPartialText(result))
  })

  /**
   * "Yeniden gönder" sonucu (aynı anahtar). Başarıda ek atama adımı şimdi koşar — tekrar edilen
   * İLK eylemin bağlamıyla (`result.context`; CX-F1-E-03); kısmi metin yalnız ek atama
   * gerçekten başarısızsa (ortak-kurallar §7).
   */
  async function resolved(outcome: MutationOutcome<unknown, unknown, unknown>): Promise<void> {
    const result = outcome as CreateOutcome
    notice.value = null
    if (result.kind !== 'success') return fail(result)
    const composite = await runWithFollowUps(
      () => Promise.resolve(result),
      assignmentSteps(assign, pendingExtra),
    )
    if (composite.kind === 'primary_failed') return fail(composite.primary)
    finish(composite.primary, createPartialText(composite))
  }

  const isPending = computed(() => create.isPending.value || assign.isPending.value)
  return { submit, resolved, notice, isPending }
}
