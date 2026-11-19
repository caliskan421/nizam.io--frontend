<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'

import { reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'
import { UiButton } from '@/shared/ui'

import { useCreateTable } from '../api/tables'
import type { TableResult, TableTarget } from '../model/types'
import { validTableName } from '../model/structure'

const props = defineProps<{ target: TableTarget; reload: () => Promise<boolean> }>()
const emit = defineEmits<{ cancel: []; created: [tableId: string] }>()
const create = useCreateTable(() => props.target)
const name = ref('')
const input = ref<HTMLInputElement | null>(null)
const formError = ref('')
const busy = ref(false)
const uncertain = ref(false)
type Result = MutationOutcome<unknown, TableResult, unknown>
const resend = shallowRef<(() => Promise<Result>) | null>(null)

onMounted(() => input.value?.focus())

function settle(result: Result) {
  if (!reachesOwner(result)) return
  if (result.kind === 'success') {
    emit('created', result.data.table_id)
    return
  }
  if (uncertain.value || result.kind === 'unknown_outcome') {
    resend.value = !uncertain.value && result.kind === 'unknown_outcome' ? result.retry : null
    uncertain.value = true
    formError.value = resend.value
      ? 'Oluşturma sonucu doğrulanamadı. Aynı isteği bir kez daha gönderebilirsiniz.'
      : 'Oluşturma sonucu doğrulanamadı. Yeni bir tablo oluşturmadan önce listeyi kontrol edin.'
    return
  }
  formError.value = 'error' in result ? errorText(result.error) : 'Tablo oluşturulamadı.'
}

async function run(send: () => Promise<Result>) {
  if (busy.value) return
  busy.value = true
  try {
    settle(await send())
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
  if (uncertain.value || busy.value) return
  const title = name.value.trim()
  if (!validTableName(title)) {
    formError.value = '1–200 karakterlik bir tablo adı girin.'
    return
  }
  formError.value = ''
  await run(() => create(props.target, title))
}
</script>

<template>
  <form
    class="t-card tables-create"
    @submit.prevent="submit"
    @keydown.esc.prevent="!busy && !uncertain && emit('cancel')"
  >
    <h2>Boş tablo oluştur</h2>
    <label class="tables-field">
      Tablo adı
      <input
        ref="input"
        v-model="name"
        class="t-input"
        :disabled="busy || uncertain"
        :aria-invalid="!!formError && !uncertain"
        :aria-describedby="formError ? 'tables-create-error' : undefined"
      />
    </label>
    <p v-if="formError" id="tables-create-error" role="alert">{{ formError }}</p>
    <div class="tables-actions">
      <UiButton v-if="uncertain" variant="ghost" :disabled="busy" @click="checkList">
        Listeyi yenile ve dön
      </UiButton>
      <UiButton v-else variant="ghost" :disabled="busy" @click="emit('cancel')">Vazgeç</UiButton>
      <UiButton v-if="!uncertain" variant="primary" type="submit" :disabled="busy">{{
        busy ? 'Oluşturuluyor…' : 'Oluştur'
      }}</UiButton>
      <UiButton v-else-if="resend" variant="primary" :disabled="busy" @click="run(resend)">{{
        busy ? 'Gönderiliyor…' : 'Aynı isteği gönder'
      }}</UiButton>
    </div>
  </form>
</template>
