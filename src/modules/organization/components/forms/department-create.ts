/**
 * Yeni koordinatörlük (E-08-05): `useCreateCoordinatorship` = `createDepartment` →
 * `linkDepartment` (iki adım, atomik değil; ardıl adım ilk eylemin bağlamıyla — veri katmanı).
 * Her iki adım isteğe bağlı `Idempotency-Key` taşır (BE-050, kullanıcı eylemi başına).
 *  - `complete` → bildirim + `saved` + kapanış;
 *  - `partial` (katalog kaydı kaldı, bağ kurulamadı) → kısmi başarı metni, `saved` (katalog kaydı
 *    oluştu) ve "Bu programa ekle" adımı aynı pencerede;
 *  - 409 `organization.department_exists` → mevcut departman zarftan okunur
 *    (`fields[department_id]`, `fields[deleted]`; BE-050): bu programda varsa bilgi, katalogda
 *    varsa "Bu programa ekle", silinmişse geri yükleme gerektiği söylenir (geri yükleme bu
 *    formun işi değil); ad eşleşmesiyle arama yok;
 *  - alan hataları forma; sonuç bilinmiyorsa AYNI anahtar + gövdeyle tek tekrar ("Yeniden
 *    gönder", `UiOutcomeNotice`); tekrar çözülünce bağ adımı ilk eylemin bağlamıyla sürer.
 */
import { useForm } from 'vee-validate'
import { computed, ref, watch, type Ref } from 'vue'

import type { CompositeOutcome, MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { pushAppNotice, type ToastInput } from '@/shared/ui'

import { existingDepartment, useCreateCoordinatorship } from '../../api'
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
import type { AnyOutcome, DepartmentFormContext, ExistsState } from './department-types'
import { serverFieldErrors, toTypedSchema } from './form-kit'
import type { useLinkStep } from './department-link'
import { orgText } from './messages'

interface ExistingRef {
  departmentId: string
  deleted: boolean
  /** Kullanıcının yazdığı ad (ad büyük/küçük harf duyarsız tekildir; gösterim için yeter). */
  name: string
}

/** `department_exists` durumu (zarftan; ek istek yok). */
function useExistsState(ctx: DepartmentFormContext, existing: Ref<ExistingRef | null>) {
  return computed<ExistsState | null>(() => {
    const found = existing.value
    if (found === null) return null
    if (found.deleted) return { kind: 'deleted', name: found.name }
    const linked = ctx.index.byId.value.get(found.departmentId)
    if (linked) return { kind: 'linked', name: linked.display_name }
    return { kind: 'found', target: { departmentId: found.departmentId, name: found.name } }
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
type CreateInput = Parameters<ReturnType<typeof useCreateCoordinatorship>['submit']>[0]

interface CreateSettle {
  ctx: DepartmentFormContext
  link: ReturnType<typeof useLinkStep>
  onPartial: () => void
  onExists: (existing: ExistingRef) => void
  setErrors: (errors: Partial<Record<keyof CreateValues, string>>) => void
  /** "Sonuç bilinmiyor" çözülünce (aynı anahtarla tekrar) akışın devamı. */
  resume: (outcome: AnyOutcome) => void
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
    const target = { departmentId: created.department_id, name: created.name }
    // Bağ yanıtı kayıpsa o adımın anahtarı/sonucu korunur: yeni teklif (yeni anahtar) değil,
    // aynı anahtarla tek tekrar (CX-P-Ö-01).
    const linkStep = result.steps.find((step) => step.name === 'link')
    if (linkStep?.outcome.kind === 'unknown_outcome') {
      s.link.reset()
      s.link.settle(linkStep.outcome, target)
      return
    }
    s.link.offer(target)
    return
  }
  const failed = result.primary
  if (failed.kind === 'owner_disposed') return
  if (failed.kind === 'failed') {
    const existing =
      failed.error.code === 'organization.department_exists'
        ? existingDepartment(failed.error)
        : null
    if (existing) return s.onExists({ ...existing, name })
    const found = serverFieldErrors(failed.error, CREATE_FIELDS, CATALOG_CODES)
    if (Object.keys(found).length > 0) return s.setErrors(found)
  }
  s.ctx.report(failed, s.resume)
}

/** Mevcut departman teklifi: bağ hedefini sunar; ad değişince teklif düşer. */
function watchExisting(
  values: { name: string },
  existing: Ref<ExistingRef | null>,
  exists: Ref<ExistsState | null>,
  link: ReturnType<typeof useLinkStep>,
): void {
  watch(exists, (state) => {
    if (state?.kind === 'found') link.offer(state.target)
  })
  watch(
    () => values.name,
    (name) => {
      const current = existing.value
      if (current === null || foldName(name) === foldName(current.name)) return
      existing.value = null
      link.reset()
    },
  )
}

export function useCreateMode(ctx: DepartmentFormContext, link: ReturnType<typeof useLinkStep>) {
  const store = useScopeStore()
  const mutation = useCreateCoordinatorship()
  const form = useForm<CreateValues>({
    validationSchema: toTypedSchema<CreateValues, CreateValues>(createSchema()),
    initialValues: emptyCreate(),
  })
  const partial = ref(false)
  const existing = ref<ExistingRef | null>(null)
  const exists = useExistsState(ctx, existing)

  watchExisting(form.values, existing, exists, link)

  function reset(): void {
    form.resetForm({ values: emptyCreate() })
    partial.value = false
    existing.value = null
  }

  /** Sonuç işleme (ilk gönderim ve "Yeniden gönder" sonrası ortak). */
  function finish(result: CreateResult, input: CreateInput): void {
    if (!ctx.dialog.alive()) {
      // Form söküldü: tam başarı ve hatalar sessiz; KISMİ sonuç (katalog kaydı var, bağ yok)
      // gerçek sunucu durumudur → uygulama düzeyi bildirim, eylemin oturum neslinde (W82c).
      if (result.kind === 'partial')
        pushAppNotice(partialNotice(), result.primary.context?.generation)
      return
    }
    settleCreate(result, input.department.name, {
      ctx,
      link,
      onPartial: () => (partial.value = true),
      onExists: (found) => (existing.value = found),
      setErrors: (errors) => form.setErrors(errors),
      resume: (outcome) => {
        void mutation
          .resume(input, outcome as MutationOutcome<CreateDepartmentInput, Department, unknown>)
          .then((next) => finish(next, input))
      },
    })
  }

  const handle = form.handleSubmit(async (values) => {
    const programId = store.snapshot.programId
    if (!programId) return
    ctx.clearNotice()
    existing.value = null
    partial.value = false
    link.reset()
    const input: CreateInput = { programId, department: toDepartmentInput(values) }
    finish(await mutation.submit(input), input)
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
