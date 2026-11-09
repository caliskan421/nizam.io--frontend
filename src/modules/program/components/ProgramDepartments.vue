<script setup lang="ts">
import './program.css'

import { computed } from 'vue'

import { useProgramDepartmentIndex } from '@/modules/organization/public'
import { toApiError } from '@/shared/errors/api-error'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiCard, UiErrorState, UiHint } from '@/shared/ui'

import { programText } from '../model/messages'

/**
 * Seçili programın bağlı departmanları (`listProgramDepartments`, S2; anahtar
 * `scoped(['departments'])` — kabuğun K7 tespitiyle aynı istek) + "Departman bağla". Program
 * seçili değilse yalnız not.
 */
defineProps<{ canLink: boolean }>()
const emit = defineEmits<{ link: [] }>()

const store = useScopeStore()
const index = useProgramDepartmentIndex(() => store.programId !== null)
const list = computed(() => index.departments.value)
const error = computed(() =>
  index.query.isError.value && list.value.length === 0 ? toApiError(index.query.error.value) : null,
)
const countText = computed(() =>
  programText(index.truncated.value ? 'departments.countTruncated' : 'departments.count', {
    n: list.value.length,
  }),
)
</script>

<template>
  <UiCard class="pg-card" :title="programText('departments.title')" data-testid="pg-departments">
    <UiHint v-if="!store.programId">{{ programText('departments.noProgram') }}</UiHint>
    <template v-else>
      <UiErrorState
        v-if="error"
        :error="error"
        :title="programText('departments.loadError')"
        retryable
        :retrying="index.query.isFetching.value"
        @retry="index.query.refetch()"
      />
      <UiHint v-else-if="index.query.isPending.value">
        {{ programText('departments.loading') }}
      </UiHint>
      <template v-else>
        <p class="pg-cap" data-testid="pg-dept-count">{{ countText }}</p>
        <UiHint v-if="list.length === 0">{{ programText('departments.empty') }}</UiHint>
        <ul v-else class="pg-chips">
          <li
            v-for="d in list"
            :key="d.department_id"
            class="t-chip"
            :data-department="d.department_id"
          >
            {{ d.display_name }}
          </li>
        </ul>
      </template>
      <div v-if="canLink" class="pg-actions">
        <UiButton icon="plus" data-testid="pg-link" @click="emit('link')">
          {{ programText('departments.link') }}
        </UiButton>
      </div>
    </template>
  </UiCard>
</template>
