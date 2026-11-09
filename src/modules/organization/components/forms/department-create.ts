/**
 * Yeni koordinatörlük (E-08-05): `useCreateCoordinatorship` = `createDepartment` →
 * `linkDepartment` (iki adım, atomik değil; ardıl adım ilk eylemin bağlamıyla — veri katmanı).
 *  - `complete` → bildirim + `saved` + kapanış;
 *  - `partial` (katalog kaydı kaldı, bağ kurulamadı) → kısmi başarı metni, `saved` (katalog kaydı
 *    oluştu) ve "Bu programa ekle" adımı aynı pencerede;
 *  - 409 `organization.department_exists` → mevcut departman ad eşleşmesiyle aranır
 *    (`listDepartments` / `listDeletedDepartments`, `tr` katlama; zarf kimlik taşımaz — BE-050):
 *    katalogda varsa "Bu programa ekle", bu programda zaten varsa bilgi, silinmişse geri yükleme
 *    gerektiği söylenir (geri yükleme bu formun işi değil);
 *  - alan hataları forma; sonuç bilinmiyorsa kör tekrar yok (veri katmanı listeyi yeniden okur).
 */
import { useForm } from 'vee-validate'
import { computed, ref, watch, type Ref } from 'vue'

import type { CompositeOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { pushAppNotice, type ToastInput } from '@/shared/ui'

import { useCatalogDepartments, useCreateCoordinatorship, useDeletedDepartments } from '../../api'
import type { CreateDepartmentInput, Department } from '../../model/types'
import {
  CATALOG_CODES,
  CREATE_FIELDS,
  createSchema,
  emptyCreate,
  foldName,
  normalizeCode,
  type CreateValues,
} from './department-schema'
import type { DepartmentFormContext, ExistsState } from './department-types'
import { serverFieldErrors, toTypedSchema } from './form-kit'
import type { useLinkStep } from './department-link'
import { orgText } from './messages'

/** `department_exists` eşleşme araması (yalnız hata alındıktan sonra açılır). */
function useExistsLookup(ctx: DepartmentFormContext, existsName: Ref<string | null>) {
  const enabled = () => ctx.hooks.open() && existsName.value !== null
  const catalog = useCatalogDepartments(enabled)
  const deleted = useDeletedDepartments(enabled)

  return computed<ExistsState | null>(() => {
    const name = existsName.value
    if (name === null) return null
    const key = foldName(name)
    const match = catalog.departments.value.find((d) => foldName(d.name) === key)
    if (match) {
      const linked = ctx.index.byId.value.get(match.department_id)
      if (linked) return { kind: 'linked', name: linked.display_name }
      return { kind: 'found', target: { departmentId: match.department_id, name: match.name } }
    }
    const gone = deleted.departments.value.find((d) => foldName(d.name) === key)
    if (gone) return { kind: 'deleted', name: gone.name }
    const settled = catalog.query.isFetched.value && deleted.query.isFetched.value
    return settled ? { kind: 'not_found' } : { kind: 'searching' }
  })
}

function toDepartmentInput(values: CreateValues): CreateDepartmentInput {
  const code = normalizeCode(values.code)
  const description = values.description.trim()
  return {
    name: values.name.trim(),
    kind: values.kind,
    ...(code ? { code } : {}),
    ...(description ? { description } : {}),
  }
}

const partialNotice = (): ToastInput => ({
  message: orgText('forms.department.partial'),
  tone: 'danger',
})

type CreateResult = CompositeOutcome<unknown, Department, unknown>

interface CreateSettle {
  ctx: DepartmentFormContext
  link: ReturnType<typeof useLinkStep>
  onPartial: () => void
  onExists: (name: string) => void
  setErrors: (errors: Partial<Record<keyof CreateValues, string>>) => void
}

function settleCreate(result: CreateResult, name: string, s: CreateSettle): void {
  if (result.kind === 'complete') {
    return s.ctx.done(orgText('forms.department.created'), result.primary.data.department_id)
  }
  if (result.kind === 'partial') {
    const created = result.primary.data
    s.onPartial()
    s.ctx.hooks.saved(created.department_id)
    // Pencere kapsam değişiminde kapandıysa kısmi sonuç yine söylenir (KESİN 20).
    if (!s.ctx.hooks.open()) s.ctx.toast.push(partialNotice())
    s.link.offer({ departmentId: created.department_id, name: created.name })
    return
  }
  const failed = result.primary
  if (failed.kind === 'owner_disposed') return
  if (failed.kind === 'failed') {
    if (failed.error.code === 'organization.department_exists') return s.onExists(name)
    const found = serverFieldErrors(failed.error, CREATE_FIELDS, CATALOG_CODES)
    if (Object.keys(found).length > 0) return s.setErrors(found)
  }
  s.ctx.report(failed)
}

export function useCreateMode(ctx: DepartmentFormContext, link: ReturnType<typeof useLinkStep>) {
  const store = useScopeStore()
  const mutation = useCreateCoordinatorship()
  const form = useForm<CreateValues>({
    validationSchema: toTypedSchema<CreateValues, CreateValues>(createSchema()),
    initialValues: emptyCreate(),
  })
  const partial = ref(false)
  const existsName = ref<string | null>(null)
  const exists = useExistsLookup(ctx, existsName)

  watch(exists, (state) => {
    if (state?.kind === 'found') link.offer(state.target)
  })
  watch(
    () => form.values.name,
    (name) => {
      if (existsName.value === null || foldName(name) === foldName(existsName.value)) return
      existsName.value = null
      link.reset()
    },
  )

  function reset(): void {
    form.resetForm({ values: emptyCreate() })
    partial.value = false
    existsName.value = null
  }

  const handle = form.handleSubmit(async (values) => {
    const programId = store.snapshot.programId
    if (!programId) return
    ctx.clearNotice()
    existsName.value = null
    partial.value = false
    link.reset()
    const department = toDepartmentInput(values)
    const result = await mutation.submit({ programId, department })
    if (!ctx.dialog.alive()) {
      // Form söküldü: tam başarı ve hatalar sessiz; KISMİ sonuç (katalog kaydı var, bağ yok)
      // gerçek sunucu durumudur → uygulama düzeyi bildirim, eylemin oturum neslinde (W82c).
      if (result.kind === 'partial')
        pushAppNotice(partialNotice(), result.primary.context?.generation)
      return
    }
    settleCreate(result, department.name, {
      ctx,
      link,
      onPartial: () => (partial.value = true),
      onExists: (name) => (existsName.value = name),
      setErrors: (errors) => form.setErrors(errors),
    })
  })

  return {
    form,
    partial,
    exists,
    reset,
    submit: () => ctx.dialog.once(() => handle()),
    pending: mutation.isPending,
  }
}
