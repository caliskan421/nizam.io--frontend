import { ref, shallowReactive, toRefs, type Ref } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import { reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'

import { useTableWrite } from '../api/writes'
import type { TableResult, TableTarget, TableWrite } from '../model/types'

type Result = MutationOutcome<unknown, TableResult, unknown>

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
  const initial = {
    message: '',
    conflict: false,
    uncertain: false,
    retry: null as (() => Promise<Result>) | null,
  }
  const status = shallowReactive({ ...initial })
  const reset = () => Object.assign(status, initial)

  function report(result: Result, operation: TableWrite) {
    if (!reachesOwner(result)) return
    if (result.kind === 'success') {
      reset()
      hooks.success(operation)
      return
    }
    if (result.kind === 'unknown_outcome') {
      status.uncertain = true
      status.retry = result.retry
      status.message = 'İşlemin sonucu doğrulanamadı. Yeni bir yazmadan önce tabloyu kontrol edin.'
      return
    }
    status.uncertain = false
    status.retry = null
    if (!('error' in result)) return
    const { error } = result
    status.conflict =
      error.code === 'tables.cell_conflict' || error.code === 'tables.schema_conflict'
    status.message = status.conflict
      ? 'Tablo siz düzenlerken değişti. Düzenlemeniz bu ekranda duruyor.'
      : operationError(error)
    if (error.status === 403) hooks.denied()
    if (error.status === 403 || error.status === 404) void hooks.reload()
  }

  async function run(operation: TableWrite, resend?: () => Promise<Result>) {
    if (busy.value || (status.uncertain && !resend) || status.conflict) return
    status.message = ''
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
      else status.message = 'Güncel tablo okundu. Yeni bir işlem için önce bu düzenlemeyi kapatın.'
      return true
    })
  }

  return { busy, ...toRefs(status), reset, run, reload }
}
