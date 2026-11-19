<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'

import { outcomeMessage, reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { i18n } from '@/shared/i18n'
import { UiButton } from '@/shared/ui'

import { useCopyTable } from '../api/copy'
import { useCreateTable } from '../api/tables'
import type { TableResult, TableSummary, TableTarget } from '../model/types'
import { beginTableCreation, finishTableCreation } from '../model/create-guard'
import { validTableName } from '../model/structure'

const props = defineProps<{
  target: TableTarget
  guardKey: string
  source: TableSummary | null
  sourceAvailable: boolean
  areaLabel: string
  reload: () => Promise<boolean>
}>()
const emit = defineEmits<{ cancel: []; created: [tableId: string]; sourceLost: [] }>()
const create = useCreateTable(() => props.target)
const copy = useCopyTable(() => props.target)
const sourceLost = ref(false)
const forbidden = ref(false)
const done = ref(false)
const unavailable = computed(
  () => props.source !== null && (sourceLost.value || !props.sourceAvailable),
)
const name = ref('')
const input = ref<HTMLInputElement | null>(null)
const formError = ref('')
const busy = ref(false)
const uncertain = ref(false)
type Result = MutationOutcome<unknown, TableResult, unknown>
const resend = shallowRef<(() => Promise<Result>) | null>(null)

onMounted(() => input.value?.focus())

function failedWithStatus(result: Result, code: number) {
  return 'error' in result && result.error.status === code
}
function settle(result: Result) {
  if (!reachesOwner(result)) return
  if (result.kind === 'success') {
    done.value = true
    emit('created', result.data.table_id)
    return
  }
  if (uncertain.value || result.kind === 'unknown_outcome') {
    resend.value = !uncertain.value && result.kind === 'unknown_outcome' ? result.retry : null
    uncertain.value = true
    formError.value = resend.value
      ? 'Oluşturma sonucu doğrulanamadı. Aynı isteği bir kez daha gönderebilirsiniz.'
      : 'Oluşturma sonucu doğrulanamadı. Yeni bir tablo oluşturmadan önce listeyi kontrol edin.'
    if (result.kind !== 'unknown_outcome') formError.value += ' ' + resultMessage(result)
    return
  }
  if (props.source && failedWithStatus(result, 404)) {
    sourceLost.value = true
    emit('sourceLost')
    return
  }
  if (failedWithStatus(result, 403)) forbidden.value = true
  formError.value = resultMessage(result)
}

function resultMessage(result: Result) {
  const { key, params } = outcomeMessage(result)
  return i18n.global.t(key, params ?? {})
}

async function run(send: () => Promise<Result>) {
  if (busy.value || done.value || forbidden.value) return
  const key = props.guardKey
  const retrying = uncertain.value
  const ticket = beginTableCreation(key, retrying)
  if (!ticket) return
  busy.value = true
  try {
    const result = await send()
    finishTableCreation(
      key,
      ticket,
      result.kind === 'unknown_outcome' || (retrying && result.kind !== 'success'),
    )
    settle(result)
  } catch {
    finishTableCreation(key, ticket, true)
    uncertain.value = true
    resend.value = null
    formError.value =
      'Oluşturma sonucu doğrulanamadı. Yeni bir tablo oluşturmadan önce listeyi kontrol edin.'
  } finally {
    busy.value = false
  }
}

async function checkList() {
  if (busy.value || !uncertain.value) return
  busy.value = true
  try {
    if (await props.reload()) emit('cancel')
    else formError.value = 'Güncel liste okunamadı. İlk oluşturma işleminin sonucu hâlâ belirsiz.'
  } finally {
    busy.value = false
  }
}

async function submit() {
  if (uncertain.value || busy.value || unavailable.value) return
  const title = name.value.trim()
  const source = props.source
  if ((!source || title) && !validTableName(title)) {
    formError.value = '1–200 karakterlik bir tablo adı girin.'
    return
  }
  formError.value = ''
  await run(() => (source ? copy(source, title) : create(props.target, title)))
}
</script>

<template>
  <form
    class="t-card tables-create"
    @submit.prevent="submit"
    @keydown.esc.prevent="!busy && !uncertain && !done && emit('cancel')"
  >
    <h2>{{ source ? 'Şablondan oluştur' : 'Boş tablo oluştur' }}</h2>
    <template v-if="source">
      <p v-if="unavailable" role="status">
        Şablon artık kullanılamıyor. Listeye dönüp güncel şablonları seçin.
      </p>
      <template v-else>
        <p>{{ source.name }} · {{ areaLabel }}</p>
        <p class="tables-muted">
          Yalnızca sütun yapısı alınır. Satırlar ve paylaşım izinleri taşınmaz.
        </p>
      </template>
    </template>
    <label class="tables-field">
      {{ source ? 'Tablo adı (isteğe bağlı)' : 'Tablo adı' }}
      <input
        ref="input"
        v-model="name"
        class="t-input"
        :disabled="busy || uncertain || unavailable || forbidden || done"
        :placeholder="source && !unavailable ? source.name : undefined"
        :aria-invalid="!!formError && !uncertain"
        :aria-describedby="formError ? 'tables-create-error' : undefined"
      />
    </label>
    <p v-if="formError" id="tables-create-error" role="alert">{{ formError }}</p>
    <div class="tables-actions">
      <UiButton v-if="uncertain" variant="ghost" :disabled="busy" @click="checkList">
        Listeyi yenile ve dön
      </UiButton>
      <UiButton v-else variant="ghost" :disabled="busy || done" @click="emit('cancel')"
        >Vazgeç</UiButton
      >
      <UiButton
        v-if="!uncertain && !unavailable && !forbidden && !done"
        variant="primary"
        type="submit"
        :disabled="busy"
        >{{ busy ? 'Oluşturuluyor…' : 'Oluştur' }}</UiButton
      >
      <UiButton v-else-if="resend" variant="primary" :disabled="busy" @click="run(resend)">{{
        busy ? 'Gönderiliyor…' : 'Aynı isteği gönder'
      }}</UiButton>
    </div>
  </form>
</template>
