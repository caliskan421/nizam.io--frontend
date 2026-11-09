<script setup lang="ts">
import './program.css'

import { computed } from 'vue'

import { UiButton, UiField, UiHint, UiInput, UiModal, UiSelect } from '@/shared/ui'

import { programText } from '../model/messages'
import { useDepartmentLink } from './use-department-link'

/**
 * Programa departman bağla (E-00-25; P3, P17): katalogdan bağlı olmayan bir departman, isteğe
 * bağlı programdaki ad ve "ekibi şu sezondan kopyala" kaynağı. Görev taşınmaz (aktarım ayrı).
 */
const props = defineProps<{ open: boolean; programName: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; linked: [departmentId: string] }>()

const ctl = useDepartmentLink({
  open: () => props.open,
  close: () => emit('update:open', false),
  linked: (id) => {
    emit('linked', id)
    emit('update:open', false)
  },
})
const departmentId = ctl.departmentId
const displayName = ctl.displayName
const copyFrom = ctl.copyFrom
const catalogFailed = computed(() => ctl.catalog.query.isError.value)
const noneLeft = computed(
  () => ctl.catalog.query.isSuccess.value && ctl.departmentOptions.value.length === 0,
)
</script>

<template>
  <UiModal
    :open="open"
    :title="programText('link.title')"
    :description="programText('link.sub', { program: programName })"
    :dismissible="!ctl.busy.value"
    @update:open="emit('update:open', $event)"
  >
    <form id="pg-link-form" class="pg-form" novalidate @submit.prevent="ctl.submit()">
      <UiHint v-if="catalogFailed" error data-testid="pg-link-catalog-error">
        {{ programText('link.catalogError') }}
      </UiHint>
      <UiHint v-else-if="noneLeft" data-testid="pg-link-none-left">
        {{ programText('link.noneLeft') }}
      </UiHint>
      <UiField :label="programText('link.department')" :error="ctl.errors.value.department">
        <UiSelect
          v-model="departmentId"
          name="department"
          :options="ctl.departmentOptions.value"
          :placeholder="programText('link.departmentPlaceholder')"
        />
      </UiField>
      <UiField
        :label="programText('link.displayName')"
        :hint="programText('link.displayNameHint')"
        :error="ctl.errors.value.displayName"
      >
        <UiInput v-model="displayName" name="displayName" autocomplete="off" />
      </UiField>
      <UiField
        :label="programText('link.copyFrom')"
        :hint="programText('link.copyHint')"
        :error="ctl.errors.value.copyFrom"
      >
        <UiSelect v-model="copyFrom" name="copyFrom" :options="ctl.copyOptions.value" />
      </UiField>
    </form>
    <template #footer>
      <UiButton :disabled="ctl.busy.value" @click="emit('update:open', false)">
        {{ programText('link.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="pg-link-form"
        :disabled="ctl.busy.value || noneLeft"
        data-testid="pg-link-submit"
      >
        {{ programText('link.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
