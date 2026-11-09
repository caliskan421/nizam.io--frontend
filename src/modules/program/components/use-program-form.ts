/**
 * Program formu davranışı (oluştur / düzenle; P3). Düzenleme açılınca kayıt `readProgram` ile
 * bir kez okunur (açıklama `['programs']` önbelleğinde yok; kullanıcının açtığı tek kayıt,
 * ortak-kurallar §9) — istek pencere kapanınca/sökülünce iptal edilir. Gönderim tek uçuştur;
 * sunucu alan hataları forma, diğer sonuçlar ortak bildirime düşer. `createProgram` aynı adlı
 * program varsa mevcut programı 200 ile döndürür (`created: false`) — kullanıcıya söylenir.
 */
import { useForm } from 'vee-validate'
import { onBeforeUnmount, ref, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'

import { fetchProgram, useCreateProgram, useUpdateProgram } from '../api'
import { programText } from '../model/messages'
import {
  createInput,
  emptyValues,
  programFieldErrors,
  programFormSchema,
  type ProgramFormValues,
  updateInput,
  valuesOf,
} from '../model/program-form'
import type { Program } from '../model/types'
import { toTypedSchema, useDialogLife } from './dialog-life'

export type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export interface ProgramFormOptions {
  open: () => boolean
  programId: () => string | null
  close: () => void
  saved: (programId: string) => void
}

type ProgramForm = ReturnType<typeof useForm<ProgramFormValues>>

/** Düzenlenen kaydın tek okuması (`readProgram`); yeni açılış/kapanışta önceki istek iptal. */
function useRecordLoader(form: ProgramForm, opts: ProgramFormOptions) {
  const load = ref<LoadState>('idle')
  const record = ref<Program | null>(null)
  let abort: AbortController | null = null

  async function read(programId: string): Promise<void> {
    abort?.abort()
    const controller = new AbortController()
    abort = controller
    load.value = 'loading'
    try {
      const program = await fetchProgram(programId, controller.signal)
      if (controller.signal.aborted) return
      record.value = program
      form.resetForm({ values: valuesOf(program) })
      load.value = 'ready'
    } catch {
      if (!controller.signal.aborted) load.value = 'error'
    }
  }

  function prepare(): void {
    abort?.abort()
    record.value = null
    form.resetForm({ values: emptyValues() })
    const id = opts.programId()
    load.value = id ? 'loading' : 'idle'
    if (id && opts.open()) void read(id)
  }

  watch(() => [opts.open(), opts.programId()] as const, prepare, { immediate: true })
  onBeforeUnmount(() => abort?.abort())

  return {
    load,
    record,
    retry: () => {
      const id = opts.programId()
      if (id) void read(id)
    },
    stop: () => abort?.abort(),
  }
}

export function useProgramForm(opts: ProgramFormOptions) {
  const toast = useToast()
  const create = useCreateProgram()
  const update = useUpdateProgram()
  const dialog = useDialogLife({ open: opts.open, close: opts.close })
  const form = useForm<ProgramFormValues>({
    validationSchema: toTypedSchema<ProgramFormValues, ProgramFormValues>(programFormSchema()),
    initialValues: emptyValues(),
  })
  const loader = useRecordLoader(form, opts)

  function report(outcome: MutationOutcome<unknown, unknown, unknown>): void {
    if (outcome.kind === 'failed') {
      const fields = programFieldErrors(outcome.error)
      if (Object.keys(fields).length > 0) return form.setErrors(fields)
    }
    notifyOutcome(outcome)
  }

  async function submitCreate(values: ProgramFormValues): Promise<void> {
    const outcome = await create.submit(createInput(values))
    if (!dialog.alive() || outcome.kind === 'owner_disposed') return
    if (outcome.kind !== 'success') return report(outcome)
    const existed = outcome.data.created === false
    toast.push({ message: programText(existed ? 'form.existing' : 'form.created') })
    opts.saved(outcome.data.program_id)
  }

  async function submitUpdate(program: Program, values: ProgramFormValues): Promise<void> {
    const input = updateInput(program, values)
    if (!input) return opts.saved(program.program_id)
    const outcome = await update.submit(input)
    if (!dialog.alive() || outcome.kind === 'owner_disposed') return
    if (outcome.kind !== 'success') return report(outcome)
    toast.push({ message: programText('form.saved') })
    opts.saved(program.program_id)
  }

  const handle = form.handleSubmit(async (values) => {
    if (!opts.programId()) return submitCreate(values)
    const record = loader.record.value
    if (record) return submitUpdate(record, values)
  })

  return {
    form,
    load: loader.load,
    record: loader.record,
    busy: dialog.busy,
    retry: loader.retry,
    stop: loader.stop,
    submit: () => dialog.once(() => handle()),
  }
}
