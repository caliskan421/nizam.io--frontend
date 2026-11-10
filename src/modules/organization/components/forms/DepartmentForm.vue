<script setup lang="ts">
import './forms.css'

import { computed } from 'vue'

import { UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton, UiField, UiHint, UiInput, UiModal, UiSelect } from '@/shared/ui'

import type { DepartmentFormEmits, DepartmentFormProps } from '../index'
import { stepText } from './department-edit'
import { KINDS } from './department-schema'
import FieldTextarea from './FieldTextarea.vue'
import { kindLabel, orgText } from './messages'
import { useDepartmentForm } from './use-department-form'

/**
 * W74 · E-08-05 yeni koordinatörlük / E-08-63, E-08-70 düzenleme (yalnız ŞY; P3 + P17: tasarımda
 * çizilmemiş, `shared/ui` ile en sade). Akış ve sonuçlar `use-department-form.ts`.
 * Gönderim sürerken pencere kapatılamaz; düğmeler kilitli (anahtarsız uç: çift gönderim yok).
 */
const props = withDefaults(defineProps<DepartmentFormProps>(), { departmentId: null })
const emit = defineEmits<DepartmentFormEmits>()

const model = useDepartmentForm({
  open: () => props.open,
  departmentId: () => props.departmentId,
  saved: (id) => emit('saved', id),
  close: () => emit('update:open', false),
})
const { editing, notice, create, link, edit } = model
const pending = model.pending

const createErrors = create.form.errors
const [name] = create.form.defineField('name')
const [kind] = create.form.defineField('kind')
const [code] = create.form.defineField('code')
const [description] = create.form.defineField('description')

const linkErrors = link.form.errors
const [linkName] = link.form.defineField('displayName')

const editErrors = edit.form.errors
const [editName] = edit.form.defineField('displayName')
const [editKind] = edit.form.defineField('kind')
const [editCode] = edit.form.defineField('code')
const [editDescription] = edit.form.defineField('description')

const kindOptions = KINDS.map((k) => ({ value: k, label: kindLabel(k) }))
const title = computed(() =>
  orgText(editing.value ? 'forms.department.editTitle' : 'forms.department.createTitle'),
)
const subtitle = computed(() =>
  editing.value ? undefined : orgText('forms.department.createDescription'),
)
const exists = create.exists

function setOpen(value: boolean): void {
  if (!value && !pending.value) emit('update:open', false)
}

function submitMain(): void {
  void (editing.value ? edit.submit() : create.submit())
}
</script>

<template>
  <UiModal
    :open="open"
    :title="title"
    :description="subtitle"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <!-- Düzenleme (E-08-63/70) -->
    <template v-if="editing">
      <UiHint v-if="edit.load.value === 'loading'" data-testid="of-edit-loading">
        {{ orgText('forms.department.edit.loading') }}
      </UiHint>
      <UiHint v-else-if="edit.load.value === 'missing'" error data-testid="of-edit-missing">
        {{ orgText('forms.department.edit.missing') }}
      </UiHint>
      <div v-else-if="edit.load.value === 'error'" class="of-note" role="alert">
        <p>{{ orgText('forms.picker.failed') }}</p>
        <div class="of-note__actions">
          <UiButton size="sm" @click="edit.retry()">{{ orgText('forms.picker.retry') }}</UiButton>
        </div>
      </div>
      <form v-else id="of-department" class="of-form" novalidate @submit.prevent="submitMain">
        <UiField
          :label="orgText('forms.department.field.displayName')"
          :error="editErrors.displayName"
        >
          <UiInput v-model="editName" name="displayName" autocomplete="off" />
        </UiField>
        <fieldset v-if="!edit.catalogMissing.value" class="of-section" data-testid="of-catalog">
          <legend class="t-label">
            {{ orgText('forms.department.edit.catalogTitle') }}
          </legend>
          <UiHint data-testid="of-catalog-warning">
            {{ orgText('forms.department.edit.catalogWarning') }}
          </UiHint>
          <div class="of-row">
            <UiField :label="orgText('forms.department.field.kind')" :error="editErrors.kind">
              <UiSelect v-model="editKind" name="kind" :options="kindOptions" />
            </UiField>
            <UiField
              :label="orgText('forms.department.field.code')"
              :hint="orgText('forms.department.field.codeHint')"
              :error="editErrors.code"
            >
              <UiInput v-model="editCode" name="code" autocomplete="off" />
            </UiField>
          </div>
          <UiField
            :label="orgText('forms.department.field.description')"
            :error="editErrors.description"
          >
            <FieldTextarea v-model="editDescription" name="description" />
          </UiField>
        </fieldset>
        <ul v-if="edit.results.value.length > 0" class="of-note" data-testid="of-edit-results">
          <li v-for="r in edit.results.value" :key="r.name" :data-result="`${r.name}:${r.ok}`">
            {{ stepText(r.name, r.ok) }}
          </li>
        </ul>
        <UiOutcomeNotice :outcome="notice" @resolved="model.resolved" />
      </form>
    </template>

    <!-- Oluşturma (E-08-05) -->
    <form v-else id="of-department" class="of-form" novalidate @submit.prevent="submitMain">
      <UiField :label="orgText('forms.department.field.name')" :error="createErrors.name">
        <UiInput v-model="name" name="name" autocomplete="off" :disabled="create.partial.value" />
      </UiField>
      <div class="of-row">
        <UiField :label="orgText('forms.department.field.kind')" :error="createErrors.kind">
          <UiSelect
            v-model="kind"
            name="kind"
            :options="kindOptions"
            :disabled="create.partial.value"
          />
        </UiField>
        <UiField
          :label="orgText('forms.department.field.code')"
          :hint="orgText('forms.department.field.codeHint')"
          :error="createErrors.code"
        >
          <UiInput v-model="code" name="code" autocomplete="off" :disabled="create.partial.value" />
        </UiField>
      </div>
      <UiField
        :label="orgText('forms.department.field.description')"
        :error="createErrors.description"
      >
        <FieldTextarea v-model="description" name="description" :disabled="create.partial.value" />
      </UiField>

      <div v-if="create.partial.value" class="of-note" role="alert" data-testid="of-partial">
        <p>{{ orgText('forms.department.partial') }}</p>
      </div>
      <div v-if="exists" class="of-note" role="alert" data-testid="of-exists">
        <p class="of-note__title">{{ orgText('forms.department.exists.title') }}</p>
        <p v-if="exists.kind === 'found'">
          {{ orgText('forms.department.exists.found', { name: exists.target.name }) }}
        </p>
        <p v-else-if="exists.kind === 'linked'">
          {{ orgText('forms.department.exists.linked', { name: exists.name }) }}
        </p>
        <p v-else-if="exists.kind === 'deleted'">
          {{ orgText('forms.department.exists.deleted', { name: exists.name }) }}
        </p>
      </div>
      <fieldset v-if="link.target.value" class="of-section" data-testid="of-link">
        <UiField
          :label="orgText('forms.department.field.displayName')"
          :hint="orgText('forms.department.field.displayNameHint')"
          :error="linkErrors.displayName"
        >
          <UiInput
            v-model="linkName"
            name="linkDisplayName"
            autocomplete="off"
            @keydown.enter.prevent="link.submit()"
          />
        </UiField>
        <div class="of-note__actions">
          <UiButton :disabled="pending" data-testid="of-link-submit" @click="link.submit()">
            {{ orgText('forms.department.link.submit') }}
          </UiButton>
        </div>
      </fieldset>
      <UiOutcomeNotice :outcome="notice" @resolved="model.resolved" />
    </form>

    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen(false)">
        {{ orgText(create.partial.value ? 'forms.common.close' : 'forms.common.cancel') }}
      </UiButton>
      <UiButton
        v-if="editing ? edit.load.value === 'ready' : !create.partial.value"
        variant="primary"
        type="submit"
        form="of-department"
        :disabled="pending"
        data-testid="of-submit"
      >
        {{ orgText(editing ? 'forms.department.submitEdit' : 'forms.department.submitCreate') }}
      </UiButton>
    </template>
  </UiModal>
</template>
