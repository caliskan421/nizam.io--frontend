/**
 * Koordinatörlük düzenleme (E-08-63 Ayarlar, E-08-70 "Düzenle"). Açılışta program bağı ve
 * katalog TAZE okunur (son yazan kazanır, `expected_revision` yok). Programdaki ad
 * (`renameDepartmentLink`, S2) ve katalog kod/açıklama/tür (`updateDepartment`, S1 — "tüm
 * sezonlarda geçerli") yalnız değiştiyse ve AYRI sonuçla gönderilir; tek kullanıcı eylemi
 * olduğundan ikinci istek ilk isteğin bağlamını taşır (KESİN 20: arada kapsam/oturum değiştiyse ya
 * da sahip söküldüyse gönderilmez). Başarılı parça korunur; yeniden gönderim yalnız kalanı yollar.
 * Katalog kaydı okunamazsa (liste sınırı) yalnız programdaki ad düzenlenir.
 */
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'

import type { ActionContext } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import { useCatalogDepartments, useRenameDepartmentLink, useUpdateDepartment } from '../../api'
import type {
  Department,
  DepartmentKind,
  ProgramDepartment,
  UpdateDepartmentRequest,
} from '../../model/types'
import {
  CATALOG_CODES,
  catalogChanges,
  CREATE_FIELDS,
  editSchema,
  LINK_NAME_CODES,
  normalizeCode,
  type EditValues,
} from './department-schema'
import type { AnyOutcome, DepartmentFormContext } from './department-types'
import { serverFieldErrors, toTypedSchema } from './form-kit'
import { orgText } from './messages'

export type EditLoad = 'loading' | 'ready' | 'missing' | 'error'
export type EditStep = 'rename' | 'catalog'

interface StepOutcome {
  name: EditStep
  outcome: AnyOutcome
}

const EMPTY: EditValues = { displayName: '', kind: 'koordinatorluk', code: '', description: '' }

function editValuesOf(linked: ProgramDepartment, record: Department | undefined): EditValues {
  return {
    displayName: linked.display_name,
    kind: (record?.kind as DepartmentKind | undefined) ?? 'koordinatorluk',
    code: record?.code ?? '',
    description: record?.description ?? '',
  }
}

function contextOf(outcome: AnyOutcome): ActionContext | undefined {
  return 'context' in outcome ? outcome.context : undefined
}

const STEP_TEXT = {
  rename: {
    ok: 'forms.department.edit.nameDone',
    fail: 'forms.department.edit.nameFailed',
  },
  catalog: {
    ok: 'forms.department.edit.catalogDone',
    fail: 'forms.department.edit.catalogFailed',
  },
} as const

export function stepText(name: EditStep, ok: boolean): string {
  return orgText(ok ? STEP_TEXT[name].ok : STEP_TEXT[name].fail)
}

/** Açılışta taze okuma (her açılışta yeni nesil; geç gelen eski okuma yok sayılır). */
function useEditLoad(
  ctx: DepartmentFormContext,
  editing: { value: boolean },
  apply: (values: EditValues) => void,
) {
  const catalog = useCatalogDepartments(() => ctx.hooks.open() && editing.value)
  const load = ref<EditLoad>('loading')
  const catalogMissing = ref(false)
  let generation = 0

  async function fresh(): Promise<void> {
    const id = ctx.hooks.departmentId()
    const mine = ++generation
    load.value = 'loading'
    if (!id) return
    const [links, entries] = await Promise.all([ctx.index.query.refetch(), catalog.query.refetch()])
    if (mine !== generation || !ctx.dialog.alive()) return
    const linked = links.data?.departments.find((d) => d.department_id === id)
    if (!linked) {
      load.value = links.isError ? 'error' : 'missing'
      return
    }
    const record = entries.data?.departments.find((d) => d.department_id === id)
    catalogMissing.value = !record
    apply(editValuesOf(linked, record))
    load.value = 'ready'
  }

  watch(
    [ctx.hooks.open, () => ctx.hooks.departmentId()],
    ([isOpen]) => {
      if (isOpen && editing.value) void fresh()
      else generation += 1
    },
    { immediate: true },
  )

  return { load, catalogMissing, fresh }
}

interface EditPlan {
  id: string
  programId: string
  /** `null` → programdaki ad değişmedi (istek yok). */
  displayName: string | null
  /** `null` → katalog değişmedi (istek yok). */
  changes: UpdateDepartmentRequest | null
}

/** Sıralı iki istek; ikincisi ilk isteğin bağlamıyla (tek kullanıcı eylemi). */
async function sendSteps(
  rename: ReturnType<typeof useRenameDepartmentLink>,
  update: ReturnType<typeof useUpdateDepartment>,
  plan: EditPlan,
): Promise<StepOutcome[]> {
  const steps: StepOutcome[] = []
  let context: ActionContext | undefined
  if (plan.displayName !== null) {
    const outcome = await rename.submit({
      programId: plan.programId,
      departmentId: plan.id,
      displayName: plan.displayName,
    })
    context = contextOf(outcome)
    steps.push({ name: 'rename', outcome })
  }
  if (plan.changes !== null) {
    const outcome = await update.submit(
      { departmentId: plan.id, changes: plan.changes },
      { context },
    )
    steps.push({ name: 'catalog', outcome })
  }
  return steps
}

/** Başarısız adımların alan hataları; eşlenemeyen sonuç ortak bildirime. */
function stepFieldErrors(
  steps: readonly StepOutcome[],
  report: (outcome: AnyOutcome) => void,
): Partial<Record<keyof EditValues, string>> {
  const fieldErrors: Partial<Record<keyof EditValues, string>> = {}
  for (const { name, outcome } of steps) {
    if (outcome.kind === 'success' || outcome.kind === 'owner_disposed') continue
    if (outcome.kind !== 'failed') {
      report(outcome)
      continue
    }
    const found =
      name === 'rename'
        ? serverFieldErrors(
            outcome.error,
            { display_name: 'displayName' as const },
            LINK_NAME_CODES,
          )
        : serverFieldErrors(outcome.error, CREATE_FIELDS, CATALOG_CODES)
    if (Object.keys(found).length > 0) Object.assign(fieldErrors, found)
    else report(outcome)
  }
  return fieldErrors
}

/** Yalnız değişen parçalar (`null` → istek yok). */
function planEdit(
  before: EditValues,
  values: EditValues,
  catalogMissing: boolean,
): Pick<EditPlan, 'displayName' | 'changes'> {
  const displayName = values.displayName.trim()
  const changes = catalogMissing ? {} : catalogChanges(before, values)
  return {
    displayName: displayName !== before.displayName ? displayName : null,
    changes: Object.keys(changes).length > 0 ? changes : null,
  }
}

/** Başarılı parça yeni taban olur (yeniden gönderim yalnız kalanı yollar). */
function keptValues(before: EditValues, values: EditValues, steps: readonly StepOutcome[]) {
  const ok = (name: EditStep) => steps.some((s) => s.name === name && s.outcome.kind === 'success')
  return {
    ...(ok('catalog') ? values : before),
    displayName: ok('rename') ? values.displayName.trim() : before.displayName,
  }
}

export function useEditMode(ctx: DepartmentFormContext, editing: { value: boolean }) {
  const store = useScopeStore()
  const rename = useRenameDepartmentLink()
  const update = useUpdateDepartment()
  const original = ref<EditValues | null>(null)
  const form = useForm<EditValues>({
    validationSchema: toTypedSchema<EditValues, EditValues>(
      editSchema(() => normalizeCode(original.value?.code ?? '') !== ''),
    ),
    initialValues: { ...EMPTY },
  })
  const loader = useEditLoad(ctx, editing, (values) => {
    original.value = values
    form.resetForm({ values: { ...values } })
  })
  /** Son gönderimin uç başına sonucu (ayrı sonuç; E-08-63). */
  const results = ref<{ name: EditStep; ok: boolean }[]>([])

  function settle(id: string, values: EditValues, before: EditValues, steps: StepOutcome[]) {
    results.value = steps.map((s) => ({ name: s.name, ok: s.outcome.kind === 'success' }))
    original.value = keptValues(before, values, steps)
    if (steps.some((s) => s.outcome.kind === 'success')) ctx.hooks.saved(id)
    if (steps.every((s) => s.outcome.kind === 'success')) {
      for (const s of steps) ctx.toast.push({ message: stepText(s.name, true) })
      ctx.hooks.close()
      return
    }
    const fieldErrors = stepFieldErrors(steps, ctx.report)
    if (Object.keys(fieldErrors).length > 0) form.setErrors(fieldErrors)
  }

  const handle = form.handleSubmit(async (values) => {
    const id = ctx.hooks.departmentId()
    const programId = store.snapshot.programId
    const before = original.value
    if (!id || !programId || !before) return
    ctx.clearNotice()
    results.value = []
    const plan = planEdit(before, values, loader.catalogMissing.value)
    if (plan.displayName === null && plan.changes === null) {
      ctx.toast.push({ message: orgText('forms.department.edit.noChange') })
      return ctx.hooks.close()
    }
    const steps = await sendSteps(rename, update, { id, programId, ...plan })
    if (!ctx.dialog.alive() || steps.every((s) => s.outcome.kind === 'owner_disposed')) return
    settle(id, values, before, steps)
  })

  return {
    form,
    load: loader.load,
    catalogMissing: loader.catalogMissing,
    results,
    retry: () => void loader.fresh(),
    submit: () => ctx.dialog.once(() => handle()),
    pending: computed(() => rename.isPending.value || update.isPending.value),
  }
}
