/**
 * "Programa departman bağla" (`linkDepartment`, S2; PROGRAM-K11/K39). W74 `DepartmentForm`
 * prop'ları kopya kaynağı (`copy_members_from_program_id`) seçtirmediği için bu küçük form
 * program modülündedir; yazma organizasyon `api`'sinden (`public.ts`). "Ekibi şu sezondan kopyala"
 * yalnız o departmanın ekibini rolleriyle kopyalar, görev taşımaz (P17); toplu yapı kopyası ucu
 * yoktur (eylem kurulmaz). Hedef program eylem anındaki seçili programdır; seçim değişince pencere
 * kapanır. Bağ sunucuda idempotenttir; anahtarsız uç (sonuç bilinmiyorsa liste yeniden okunur).
 */
import { computed, ref, watch } from 'vue'

import {
  useCatalogDepartments,
  useLinkDepartment,
  useProgramDepartmentIndex,
} from '@/modules/organization/public'
import type { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useProgramList } from '../api'
import { programText } from '../model/messages'
import { useDialogLife } from './dialog-life'

export type LinkField = 'department' | 'displayName' | 'copyFrom'

const FIELD_CODES: Readonly<Record<string, LinkField>> = {
  'program.department_link_name_exists': 'displayName',
  'program.copy_source_not_linked': 'copyFrom',
  'program.invalid_copy_source': 'copyFrom',
  'program.department_not_found': 'department',
}

function fieldErrors(error: ApiError): Partial<Record<LinkField, string>> {
  const out: Partial<Record<LinkField, string>> = {}
  for (const f of error.fields) {
    const field = FIELD_CODES[f.code]
    if (field && !out[field]) out[field] = errorText(f)
  }
  const byCode = FIELD_CODES[error.code]
  if (byCode && !out[byCode]) out[byCode] = errorText(error)
  return out
}

function validate(departmentId: string, name: string): Partial<Record<LinkField, string>> {
  const out: Partial<Record<LinkField, string>> = {}
  if (!departmentId) out.department = programText('link.departmentRequired')
  if (name && (name.length < 2 || name.length > 120))
    out.displayName = programText('link.nameLength')
  return out
}

export interface LinkOptions {
  open: () => boolean
  close: () => void
  linked: (departmentId: string) => void
}

/** Seçenekler: bu programa bağlı olmayan katalog departmanları; kopya kaynağı diğer programlar. */
function useLinkChoices(open: () => boolean) {
  const store = useScopeStore()
  const catalog = useCatalogDepartments(open)
  const linkedIndex = useProgramDepartmentIndex(open)
  const { programs } = useProgramList()
  const departmentOptions = computed(() =>
    catalog.departments.value
      .filter((d) => !linkedIndex.byId.value.has(d.department_id))
      .map((d) => ({ value: d.department_id, label: d.code ? `${d.name} · ${d.code}` : d.name })),
  )
  const copyOptions = computed(() => [
    { value: '', label: programText('link.copyNone') },
    ...programs.value
      .filter((p) => p.programId !== store.programId)
      .map((p) => ({ value: p.programId, label: p.year ? `${p.name} · ${p.year}` : p.name })),
  ])
  return { catalog, departmentOptions, copyOptions }
}

export function useDepartmentLink(opts: LinkOptions) {
  const store = useScopeStore()
  const toast = useToast()
  const mutation = useLinkDepartment()
  const dialog = useDialogLife({ open: opts.open, close: opts.close })
  const choices = useLinkChoices(opts.open)

  const departmentId = ref('')
  const displayName = ref('')
  const copyFrom = ref('')
  const errors = ref<Partial<Record<LinkField, string>>>({})

  watch(opts.open, () => {
    departmentId.value = ''
    displayName.value = ''
    copyFrom.value = ''
    errors.value = {}
  })

  async function send(programId: string): Promise<void> {
    const name = displayName.value.trim()
    const chosen = departmentId.value
    const outcome = await mutation.submit({
      programId,
      departmentId: chosen,
      ...(name ? { displayName: name } : {}),
      ...(copyFrom.value ? { copyMembersFromProgramId: copyFrom.value } : {}),
    })
    if (!dialog.alive() || outcome.kind === 'owner_disposed') return
    if (outcome.kind === 'success') {
      const n = outcome.data.copied_member_count
      toast.push({
        message: n > 0 ? programText('link.doneCopied', { n }) : programText('link.done'),
      })
      return opts.linked(chosen)
    }
    const found = outcome.kind === 'failed' ? fieldErrors(outcome.error) : {}
    if (Object.keys(found).length > 0) errors.value = found
    else notifyOutcome(outcome)
  }

  function submit(): Promise<void> {
    return dialog.once(async () => {
      const programId = store.snapshot.programId
      if (!programId) return
      errors.value = validate(departmentId.value, displayName.value.trim())
      if (Object.keys(errors.value).length > 0) return
      await send(programId)
    })
  }

  return {
    departmentId,
    displayName,
    copyFrom,
    errors,
    ...choices,
    busy: dialog.busy,
    submit,
  }
}
