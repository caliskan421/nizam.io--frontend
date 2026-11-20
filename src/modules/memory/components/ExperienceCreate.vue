<script setup lang="ts">
import { computed, ref } from 'vue'

import { generateIdempotencyKey } from '@/shared/http/mutation'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { UiButton, UiErrorState } from '@/shared/ui'

import { addExperience } from '../api/memory'
import { AREAS, type ExperienceCreate, type Source } from '../model/types'
import { useMemoryWrite } from '../model/write'

const props = defineProps<{ source?: Source; sourceLabel?: string; defaultUnit?: string }>()
const emit = defineEmits<{ saved: [string]; close: [] }>()
const write = useMemoryWrite()
const departments = useProgramDepartments(() => !!write.scope.program.value).query
const options = computed(() => departments.data.value?.departments ?? [])
const title = ref('')
const impact = ref('')
const suggestion = ref('')
const area = ref<ExperienceCreate['area']>('volunteers')
const unit = ref(props.defaultUnit ?? write.scope.store.departmentId ?? '')
const event = ref('')
const replay = ref<{ body: ExperienceCreate; key: string }>()
const hasUnknown = computed(
  () => write.error.value && (!write.error.value.status || write.error.value.status >= 500),
)

function save() {
  if (!title.value.trim() || !options.value.some((dep) => dep.department_id === unit.value)) return
  const body: ExperienceCreate = {
    title: title.value.trim(),
    impact: impact.value.trim(),
    suggestion: suggestion.value.trim() || undefined,
    area: area.value,
    department_id: unit.value,
    event_program_id: event.value || undefined,
    source: props.source,
  }
  const attempt = replay.value ?? { body, key: generateIdempotencyKey() }
  replay.value = attempt
  return write.submit(
    (program) => addExperience(program, attempt.body, attempt.key),
    (result) => emit('saved', result.id),
  )
}

function submit() {
  if (write.pending.value) return
  if (!hasUnknown.value) replay.value = undefined
  return save()
}
</script>

<template>
  <form class="memory-panel t-card" @submit.prevent="submit">
    <h2>Yeni deneyim</h2>
    <p v-if="sourceLabel" class="memory-muted">Kaynak · {{ sourceLabel }}</p>
    <fieldset :disabled="write.pending.value || !!hasUnknown">
      <label>Ne yaşadık? <input v-model="title" class="t-input" required /></label>
      <label>Etkisi ne oldu? <textarea v-model="impact" class="t-input" rows="3" /></label>
      <label>Önerimiz / çözüm <textarea v-model="suggestion" class="t-input" rows="3" /></label>
      <label
        >Alan
        <select v-model="area" class="t-select">
          <option v-for="(label, key) in AREAS" :key="key" :value="key">{{ label }}</option>
        </select></label
      >
      <label
        >Koordinatörlük
        <select v-model="unit" class="t-select" required>
          <option value="" disabled>Koordinatörlük seçin</option>
          <option v-for="dep in options" :key="dep.department_id" :value="dep.department_id">
            {{ dep.display_name }}
          </option>
        </select></label
      >
      <label
        >Etkinlik
        <select v-model="event" class="t-select">
          <option value="">Seçili program</option>
          <option
            v-for="program in write.scope.programs.value ?? []"
            :key="program.programId"
            :value="program.programId"
          >
            {{ program.name }}
          </option>
        </select></label
      >
    </fieldset>
    <UiErrorState
      v-if="write.error.value"
      :error="write.error.value"
      title="Deneyim kaydedilemedi"
    />
    <p v-if="hasUnknown" role="status">
      İşlem sonucu doğrulanamadı. Aynı istek güvenle yeniden gönderilebilir.
    </p>
    <div class="memory-controls">
      <UiButton :disabled="write.pending.value" @click="emit('close')">Vazgeç</UiButton>
      <UiButton
        type="submit"
        variant="primary"
        :disabled="write.pending.value || !title.trim() || !unit"
        >{{ hasUnknown ? 'Aynı isteği yeniden gönder' : 'Hafızaya ekle' }}</UiButton
      >
    </div>
  </form>
</template>
