import { computed, ref, shallowReactive, toRefs, type Ref } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import { reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'

import { useTableWrite } from '../api/writes'
import type { TableResult, TableTarget, TableWrite } from '../model/types'

type Result = MutationOutcome<unknown, TableResult, unknown>

const INITIAL_STATUS = {
  message: '',
  conflict: false,
  uncertain: false,
  reconciled: false,
  retry: null as (() => Promise<Result>) | null,
}

function unknownMessage(result: Result): string {
  const base = 'İlk isteğin sonucu doğrulanamadı. Yeni bir yazmadan önce güncel tabloyu okuyun.'
  return 'error' in result && result.kind !== 'unknown_outcome'
    ? `${base} ${operationError(result.error)}`
    : base
}

interface Hooks {
  scope: () => TableTarget
  success: (operation: TableWrite) => void
  denied: () => void
  reload: () => Promise<boolean>
}

function operationError(error: ApiError): string {
  const count = error.fields.find(
    (field) => field.field === 'lossy_cells' && field.code === 'tables.conversion_lossy',
  )?.value
  if (error.code === 'tables.conversion_lossy' && count && /^[1-9]\d{0,5}$/u.test(count)) {
    return `${count} hücre yeni tipe dönüştürülemedi. Sütun ve hücreler değişmedi.`
  }
  return errorText(error)
}

function checkAccess(result: Result, hooks: Hooks) {
  if (!('error' in result)) return
  if (result.error.status === 403) hooks.denied()
  if (result.error.status === 403 || result.error.status === 404) void hooks.reload()
}

async function whileBusy<T>(busy: Ref<boolean>, task: () => Promise<T>): Promise<T> {
  busy.value = true
  try {
    return await task()
  } finally {
    busy.value = false
  }
}

export function useTableOperation(hooks: Hooks) {
  const write = useTableWrite(hooks.scope)
  const busy = ref(false)
  const status = shallowReactive({ ...INITIAL_STATUS })
  const reset = () => Object.assign(status, INITIAL_STATUS)
  const canClose = computed(() => !busy.value && (!status.uncertain || status.reconciled))

  function report(result: Result, operation: TableWrite) {
    if (!reachesOwner(result)) return
    if (result.kind === 'success') {
      reset()
      hooks.success(operation)
      return
    }
    if (status.uncertain || result.kind === 'unknown_outcome') {
      // Tekrarın reddedilmesi ilk isteğin işlenip işlenmediğini kanıtlamaz.
      status.retry = !status.uncertain && result.kind === 'unknown_outcome' ? result.retry : null
      status.uncertain = true
      status.message = unknownMessage(result)
      checkAccess(result, hooks)
      return
    }
    if (!('error' in result)) {
      status.message = 'Çalışma alanı değiştiği için işlem gönderilmedi.'
      return
    }
    const { error } = result
    status.conflict =
      error.code === 'tables.cell_conflict' || error.code === 'tables.schema_conflict'
    status.message = status.conflict
      ? 'Tablo siz düzenlerken değişti. Düzenlemeniz bu ekranda duruyor.'
      : operationError(error)
    checkAccess(result, hooks)
  }

  async function run(operation: TableWrite, resend?: () => Promise<Result>) {
    if (busy.value || (status.uncertain && !resend) || status.conflict) return
    status.message = ''
    status.reconciled = false
    await whileBusy(busy, async () => {
      report(await (resend ? resend() : write(operation)), operation)
    })
  }

  async function reload(): Promise<boolean> {
    if (busy.value) return false
    return whileBusy(busy, async () => {
      if (!(await hooks.reload())) {
        status.message = 'Güncel tablo okunamadı. Düzenlemeniz korunuyor.'
        return false
      }
      if (!status.uncertain) reset()
      else {
        status.reconciled = true
        status.message =
          'Güncel tablo okundu. İlk işlemin sonucunu kontrol edip bu düzenlemeyi kapatabilirsiniz.'
      }
      return true
    })
  }

  return { busy, canClose, ...toRefs(status), reset, run, reload }
}
