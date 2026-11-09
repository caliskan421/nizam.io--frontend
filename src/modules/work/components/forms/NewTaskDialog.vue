<script setup lang="ts">
import './forms.css'

import { computed, inject } from 'vue'

import { UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton, UiCheck, UiField, UiHint, UiInput, UiModal, UiSelect } from '@/shared/ui'

import type { NewTaskDialogEmits, NewTaskDialogProps } from '../index'
import FieldNative from './FieldNative.vue'
import { formsText, priorityLabel } from './messages'
import { NEW_TASK_PRESET } from './new-task-preset'
import { PRIORITIES } from './new-task-schema'
import { useNewTaskForm } from './use-new-task-form'

/**
 * W45 · E-03-06 → E-03-57 — yeni görev formu (P3: `shared/ui` ile en sade; tasarımda çizilmemiş).
 * Alanlar `CreateWorkItemRequest`; ek atananlar yalnız koordinatörde (s.140). Gönderim sürerken
 * pencere kapatılamaz. Başarıda `created` (çağıran URL `gorev` ile paneli açar) ve kapanır.
 */
const props = withDefaults(defineProps<NewTaskDialogProps>(), { departmentId: null })
const emit = defineEmits<NewTaskDialogEmits>()

/** URL girişinin doğrulanmış ön değerleri (Görevler sayfası sağlar; yoksa `null`). */
const preset = inject(NEW_TASK_PRESET, null)

const model = useNewTaskForm({
  open: () => props.open,
  departmentId: () => props.departmentId,
  presetDepartment: () => preset?.value?.departmentId ?? null,
  assignee: () => preset?.value?.assignee ?? null,
  created: (item) => emit('created', item),
  close: () => emit('update:open', false),
})
const { form, departments, members, extraCandidates, toggleExtra, submit, resolved, notice } = model
const pending = model.isPending
const errors = form.errors

const [title] = form.defineField('title')
const [department] = form.defineField('departmentId')
const [assignee] = form.defineField('assignee')
const [startOn] = form.defineField('startOn')
const [endOn] = form.defineField('endOn')
const [priority] = form.defineField('priority')
const [description] = form.defineField('description')
const [evidence] = form.defineField('evidence')

const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: priorityLabel(p) }))
const assigneeOptions = computed(() => [
  { value: '', label: formsText('workForms.create.field.assigneeNone') },
  ...members.members.value.map((c) => ({ value: c.accountId, label: c.fullName })),
])
const noDepartment = computed(() => departments.options.value.length === 0)
const membersHint = computed(() => {
  if (members.status.value === 'loading') return formsText('workForms.create.members.loading')
  if (members.status.value === 'error') return formsText('workForms.create.members.failed')
  return undefined
})

function setOpen(value: boolean): void {
  if (!value && pending.value) return
  emit('update:open', value)
}
</script>

<template>
  <UiModal
    :open="open"
    :title="formsText('workForms.create.title')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="wf-new-task" class="wf-form" novalidate @submit.prevent="submit">
      <UiHint v-if="noDepartment" data-testid="wf-no-department">
        {{ formsText('workForms.create.noDepartment') }}
      </UiHint>
      <UiField :label="formsText('workForms.create.field.title')" :error="errors.title">
        <UiInput v-model="title" name="title" />
      </UiField>
      <UiField :label="formsText('workForms.create.field.department')" :error="errors.departmentId">
        <UiSelect
          v-model="department"
          name="departmentId"
          :options="departments.options.value"
          :placeholder="formsText('workForms.create.field.departmentPlaceholder')"
        />
      </UiField>
      <UiField
        :label="formsText('workForms.create.field.assignee')"
        :hint="membersHint"
        :error="errors.assignee"
      >
        <UiSelect
          v-model="assignee"
          name="assignee"
          :options="assigneeOptions"
          :disabled="members.status.value !== 'ready'"
        />
      </UiField>
      <fieldset
        v-if="departments.canAssignExtra.value && extraCandidates.length > 0"
        class="wf-extra"
        data-testid="wf-extra"
      >
        <legend class="t-label">{{ formsText('workForms.create.field.extra') }}</legend>
        <label v-for="c in extraCandidates" :key="c.accountId" class="wf-check">
          <UiCheck
            :model-value="form.values.extra.includes(c.accountId)"
            @update:model-value="toggleExtra(c.accountId, $event)"
          />
          <span class="rp-trunc">{{ c.fullName }}</span>
        </label>
        <UiHint>{{ formsText('workForms.create.field.extraHint') }}</UiHint>
      </fieldset>
      <div class="wf-row">
        <UiField :label="formsText('workForms.create.field.startOn')" :error="errors.startOn">
          <FieldNative v-model="startOn" kind="date" name="startOn" />
        </UiField>
        <UiField :label="formsText('workForms.create.field.endOn')" :error="errors.endOn">
          <FieldNative v-model="endOn" kind="date" name="endOn" />
        </UiField>
      </div>
      <UiField :label="formsText('workForms.create.field.priority')" :error="errors.priority">
        <UiSelect v-model="priority" name="priority" :options="priorityOptions" />
      </UiField>
      <UiField :label="formsText('workForms.create.field.description')" :error="errors.description">
        <FieldNative v-model="description" kind="textarea" name="description" />
      </UiField>
      <label class="wf-check">
        <UiCheck v-model="evidence" name="evidence" />
        <span>{{ formsText('workForms.create.field.evidence') }}</span>
      </label>
      <UiOutcomeNotice :outcome="notice" @resolved="resolved" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen(false)">
        {{ formsText('workForms.create.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="wf-new-task"
        :disabled="pending || noDepartment"
        data-testid="wf-submit"
      >
        {{ formsText('workForms.create.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
