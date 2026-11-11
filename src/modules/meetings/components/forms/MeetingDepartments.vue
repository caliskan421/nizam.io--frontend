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
    <label v-for="department in props.options" :key="department.department_id">
      <input
        :type="single ? 'radio' : 'checkbox'"
        :checked="selected.includes(department.department_id)"
        @change="emit('toggle', department.department_id)"
      />
      {{ department.display_name }}
      <button
        v-if="!single && selected.includes(department.department_id)"
        type="button"
        :aria-pressed="selected[0] === department.department_id"
        @click.prevent="emit('owner', department.department_id)"
      >
        {{ ownerLabel }}
      </button>
    </label>
  </fieldset>
</template>
