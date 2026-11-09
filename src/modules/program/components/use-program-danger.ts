/**
 * Yıkıcı program eylemleri (sil / sıfırla; PROGRAM-K12): parola yeniden doğrulanır ve istemci
 * onayı ŞARTTIR — onaysız istek yok. Yazma `confirmWrite(options, (context) => …submit(vars,
 * { context }))` ile başlar (KESİN 20): onay vazgeçilirse / kapsam-oturum değişirse / bileşen
 * sökülürse istek gitmez. Parola yalnız bu yerel `ref`'te durur; sonuçta, önbellekte, günlükte
 * yoktur (KESİN 7) ve her açılış/kapanışta silinir. 401 `program.password_invalid` ve 422
 * parola alanı → parola alanına; diğer sonuçlar ortak bildirime.
 */
import { ref, watch } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'
import { useToast } from '@/shared/ui'
import { type ConfirmOptions, notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useDeleteProgram, useResetProgram } from '../api'
import { programText } from '../model/messages'
import type { PasswordConfirmedInput, ProgramResetResult } from '../model/types'
import { useDialogLife } from './dialog-life'

export type DangerMode = 'delete' | 'reset'

export interface DangerTarget {
  programId: string
  name: string
}

export interface DangerOptions {
  open: () => boolean
  mode: () => DangerMode
  target: () => DangerTarget | null
  close: () => void
  done: (mode: DangerMode, programId: string) => void
}

const PASSWORD_CODES: ReadonlySet<string> = new Set([
  'program.password_invalid',
  'program.password_required',
])

function passwordError(error: ApiError): string | null {
  if (PASSWORD_CODES.has(error.code)) return errorText(error)
  const field = error.fields.find((f) => PASSWORD_CODES.has(f.code))
  return field ? errorText(field) : null
}

function resetDone(data: ProgramResetResult): string {
  return programText('danger.reset.done', {
    tasks: data.tasks,
    files: data.files,
    meetings: data.meetings,
    messages: data.messages,
  })
}

function confirmOptions(mode: DangerMode, name: string): ConfirmOptions {
  const key = mode === 'delete' ? 'danger.delete' : 'danger.reset'
  return {
    title: programText(`${key}.confirmTitle`, { name }),
    body: [programText(`${key}.confirmBody`)],
    confirmLabel: programText(`${key}.confirm`),
    cancelLabel: programText('danger.cancel'),
    tone: 'danger',
  }
}

export function useProgramDanger(opts: DangerOptions) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const remove = useDeleteProgram()
  const reset = useResetProgram()
  const dialog = useDialogLife({ open: opts.open, close: opts.close })
  const password = ref('')
  const error = ref('')

  watch(opts.open, () => {
    password.value = ''
    error.value = ''
  })

  function finish<D>(
    outcome: MutationOutcome<PasswordConfirmedInput, D, unknown> | null,
    target: DangerTarget,
    mode: DangerMode,
    message: (data: D) => string,
  ): void {
    if (!outcome || !dialog.alive() || outcome.kind === 'owner_disposed') return
    if (outcome.kind === 'success') {
      password.value = ''
      toast.push({ message: message(outcome.data) })
      return opts.done(mode, target.programId)
    }
    const field = outcome.kind === 'failed' ? passwordError(outcome.error) : null
    if (field) error.value = field
    else notifyOutcome(outcome)
  }

  async function run(target: DangerTarget, mode: DangerMode): Promise<void> {
    const vars = { programId: target.programId, password: password.value }
    const options = confirmOptions(mode, target.name)
    if (mode === 'delete') {
      const outcome = await confirmWrite(options, (context) => remove.submit(vars, { context }))
      return finish(outcome, target, mode, () => programText('danger.delete.done'))
    }
    const outcome = await confirmWrite(options, (context) => reset.submit(vars, { context }))
    finish(outcome, target, mode, resetDone)
  }

  function submit(): Promise<void> {
    return dialog.once(async () => {
      const target = opts.target()
      if (!target) return
      if (password.value === '') {
        error.value = programText('danger.passwordRequired')
        return
      }
      error.value = ''
      await run(target, opts.mode())
    })
  }

  return { password, error, busy: dialog.busy, submit }
}
