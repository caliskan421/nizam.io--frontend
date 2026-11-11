<script setup lang="ts">
const props = defineProps<{
  options: { department_id: string; display_name: string }[]
  selected: string[]
  single: boolean
  label: string
  ownerLabel: string
}>()
const emit = defineEmits<{ toggle: [id: string]; owner: [id: string] }>()
</script>
<template>
  <fieldset class="meeting-form__group">
    <legend>{{ label }}</legend>
    <span
      v-for="department in props.options"
      :key="department.department_id"
      class="meeting-form__department"
    >
      <button
        type="button"
        class="meeting-form__chip"
        :aria-pressed="selected.includes(department.department_id)"
        @click="emit('toggle', department.department_id)"
      >
        {{ department.display_name }}
      </button>
      <button
        v-if="!single && selected.includes(department.department_id)"
        type="button"
        class="meeting-form__owner"
        :aria-pressed="selected[0] === department.department_id"
        @click="emit('owner', department.department_id)"
      >
        {{ ownerLabel }}
      </button>
    </span>
  </fieldset>
</template>
