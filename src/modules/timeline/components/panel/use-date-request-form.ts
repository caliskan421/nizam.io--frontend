/**
 * Tarih talebi formunun mantığı (E-03C-64; 03 E-03-54/63 ile AYNI form). Gönderim
 * `requestDateChange` (eylem başına `Idempotency-Key`, K5; BE-056): istek sürerken tekrar
 * gönderilmez (`isPending` kilidi), sonuç bilinmiyorsa aynı anahtarla TEK tekrar yapılır (veri
 * katmanı), o da bilinmiyorsa görev/Gantt/talepler yeniden okunur ve taslak korunur. Kullanıcının
 * gördüğü `dates_revision` (taze görev) `expected_dates_revision` olarak gider. Geçerli tarihler taze `getWorkItem`'dan (03 ile ortak anahtar); okunamazsa
 * açılıştaki değerler. Sahibi sökülmüş sonuç ekrana özgü iş başlatmaz (`reachesOwner`, Ö-07).
 */
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch, type Ref } from 'vue'

import { useWorkItem } from '@/modules/work/public'
import { reachesOwner } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useRequestDateChange } from '../../api'
import type { RequestDateChangeInput } from '../../model/types'
import type { DateRequestFormProps } from '../index'
import { checkDraft, formatInputDay } from './date-input'
import { panelText } from './messages'
import { failedCode, failedText, needsReread, rereadItem } from './outcomes'

/** Form alanları: açılışta `startOn`/`endOn` ile tohumlanır, her açılışta sıfırlanır. */
function useRequestFields(props: DateRequestFormProps, open: Ref<boolean>) {
  const start = ref('')
  const end = ref('')
  const reason = ref('')
  const formError = ref<string | null>(null)
  const touched = ref(false)

  watch(
    open,
    (isOpen) => {
      if (!isOpen) return
      start.value = formatInputDay(props.startOn)
      end.value = formatInputDay(props.endOn)
      reason.value = ''
      formError.value = null
      touched.value = false
    },
    { immediate: true },
  )

  const check = computed(() => checkDraft(start.value, end.value))
  const errors = computed(() => ({
    start:
      touched.value && check.value.start ? panelText(`errors.${check.value.start}`) : undefined,
    end: touched.value && check.value.end ? panelText(`errors.${check.value.end}`) : undefined,
  }))
  return { start, end, reason, formError, touched, check, errors }
}

/** Satır içi hata: bekleyen talep var → kendi metni; diğer `failed` kod metni; kalanı ortak bildirim. */
function reportFailure(formError: Ref<string | null>, outcome: Parameters<typeof failedText>[0]) {
  const pendingExists = failedCode(outcome) === 'work.date_request_pending_exists'
  formError.value = pendingExists ? panelText('errors.pendingExists') : failedText(outcome)
  if (formError.value === null) notifyOutcome(outcome)
}

/** Gönderilecek yazma değişkenleri; `revision` kullanıcının gördüğü `dates_revision` (varsa). */
function requestVars(
  props: DateRequestFormProps,
  value: { startOn: string; endOn: string },
  reason: string,
  revision: number | undefined,
): RequestDateChangeInput {
  return {
    target: { ...props.target },
    workItemId: props.workItemId,
    newStartOn: value.startOn,
    newEndOn: value.endOn,
    ...(reason ? { reason } : {}),
    ...(revision !== undefined ? { expectedDatesRevision: revision } : {}),
  }
}

export function useDateRequestForm(
  props: DateRequestFormProps,
  open: Ref<boolean>,
  onSent: (requestId: string) => void,
) {
  const client = useQueryClient()
  const store = useScopeStore()
  const toast = useToast() // kurulumda: sökülmüş sahibin geç sonucu bildirim üretmez
  const request = useRequestDateChange()
  const item = useWorkItem(
    () => (open.value ? props.workItemId : null),
    () => props.target,
  )
  const fields = useRequestFields(props, open)

  const current = computed(() => ({
    start: item.data.value?.start_on ?? props.startOn,
    end: item.data.value?.end_on ?? props.endOn,
  }))
  const currentRange = computed(
    () => `${formatInputDay(current.value.start)} → ${formatInputDay(current.value.end)}`,
  )

  async function submit(): Promise<void> {
    if (request.isPending.value) return
    fields.touched.value = true
    fields.formError.value = null
    const value = fields.check.value.value
    if (!value) return
    if (value.startOn === current.value.start && value.endOn === current.value.end) {
      fields.formError.value = panelText('errors.unchanged')
      return
    }
    const outcome = await request.submit(
      requestVars(props, value, fields.reason.value.trim(), item.data.value?.dates_revision),
    )
    if (!reachesOwner(outcome)) return
    if (outcome.kind === 'success') {
      toast.push({ message: panelText('request.sent') })
      open.value = false
      onSent(outcome.data.request_id)
      return
    }
    if (needsReread(outcome)) rereadItem(client, store.snapshot, outcome, props.workItemId)
    reportFailure(fields.formError, outcome)
  }

  return {
    start: fields.start,
    end: fields.end,
    reason: fields.reason,
    errors: fields.errors,
    formError: fields.formError,
    currentRange,
    pending: request.isPending,
    submit,
  }
}
