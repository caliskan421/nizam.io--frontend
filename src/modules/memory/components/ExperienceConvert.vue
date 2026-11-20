<script setup lang="ts">
import { computed, ref } from 'vue'

import { useProgramDepartments } from '@/shared/scope/program-departments'
import { UiButton, UiErrorState, UiModal } from '@/shared/ui'

import { convertExperience } from '../api/memory'
import type { ExperienceDetail } from '../model/types'
import { useMemoryWrite } from '../model/write'

const props = defineProps<{ item: ExperienceDetail }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [] }>()
const write = useMemoryWrite()
const title = ref('')
const target = ref(props.item.department.id)
const start = ref('')
const end = ref('')
const departments = useProgramDepartments(() => open.value).query
const targets = computed(() =>
  (departments.data.value?.departments ?? []).filter(
    (dep) =>
      write.scope.admin.value ||
      write.scope.conversionDepartments.value.includes(dep.department_id),
  ),
)
const uncertain = computed(() => {
  const error = write.error.value
  return !!error && (!error.status || error.status >= 500)
})
const eligible = computed(
  () => props.item.can.convert && !!props.item.suggestion && !props.item.converted_work_item,
)
const valid = computed(
  () =>
    targets.value.some((dep) => dep.department_id === target.value) &&
    ((!start.value && !end.value) || (start.value && end.value && start.value <= end.value)),
)

function save() {
  if (!eligible.value || !valid.value) return
  return write.submit(
    (program) =>
      convertExperience(program, props.item.id, {
        title: title.value.trim() || undefined,
        department_id: target.value,
        start_date: start.value || undefined,
        end_date: end.value || undefined,
      }),
    () => {
      emit('saved')
      open.value = false
    },
  )
}
</script>

<template>
  <UiModal v-model:open="open" title="Öneriyi göreve dönüştür" :dismissible="!write.pending.value">
    <UiErrorState
      v-if="write.error.value && !uncertain"
      :error="write.error.value"
      title="Dönüştürme reddedildi"
    />
    <p v-if="uncertain" role="status">
      Dönüştürme sonucu doğrulanamadı. Güncel deneyimi ve görevleri kontrol edin.
    </p>
    <form v-if="eligible && !uncertain" class="memory-panel memory-plain" @submit.prevent="save">
      <label
        >Görev başlığı <input v-model="title" class="t-input" :placeholder="item.suggestion ?? ''"
      /></label>
      <label
        >Hedef koordinatörlük
        <select v-model="target" class="t-select">
          <option value="" disabled>Koordinatörlük seçin</option>
          <option v-for="dep in targets" :key="dep.department_id" :value="dep.department_id">
            {{ dep.display_name }}
          </option>
        </select></label
      >
      <label>Başlangıç <input v-model="start" type="date" class="t-input" /></label>
      <label>Bitiş <input v-model="end" type="date" class="t-input" /></label>
      <p class="memory-muted">
        Tarihleri boş bırakırsanız görev bugün başlar ve 14 gün sonra biter.
      </p>
      <UiButton type="submit" variant="primary" :disabled="write.pending.value || !valid"
        >Görev oluştur</UiButton
      >
    </form>
    <p v-else-if="!write.error.value">Bu deneyim şu anda dönüştürülemiyor.</p>
  </UiModal>
</template>
