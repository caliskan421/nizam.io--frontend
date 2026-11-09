<script setup lang="ts">
import './program.css'

import { computed } from 'vue'

import { DesignStub, UiButton, UiField, UiHint, UiInput, UiModal, UiSelect } from '@/shared/ui'

import { programText } from '../model/messages'
import { yearOptions } from '../model/program-form'
import { useProgramForm } from './use-program-form'

/**
 * Program oluştur / düzenle penceresi (E-00-25; P3 — tuvalde çizilmedi, `shared/ui` ile en sade).
 * Alanlar sözleşmeden: ad, yıl, açıklama. Kısa ad + renk backend'de yok (BE-001): statik, devre
 * dışı; sahte alan gönderilmez. `programId` verilirse düzenleme.
 */
const props = withDefaults(defineProps<{ open: boolean; programId?: string | null }>(), {
  programId: null,
})
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [programId: string] }>()

const ctl = useProgramForm({
  open: () => props.open,
  programId: () => props.programId,
  close: () => emit('update:open', false),
  saved: (id) => {
    emit('saved', id)
    emit('update:open', false)
  },
})
const [name] = ctl.form.defineField('name')
const [year] = ctl.form.defineField('year')
const [description] = ctl.form.defineField('description')
const errors = ctl.form.errors

const editing = computed(() => props.programId !== null)
const formReady = computed(() => !editing.value || ctl.load.value === 'ready')
const years = computed(() => [
  { value: '', label: programText('form.yearNone') },
  ...yearOptions(new Date(), ctl.record.value?.year ?? null).map((y) => ({
    value: String(y),
    label: String(y),
  })),
])

function setOpen(value: boolean): void {
  if (!value) ctl.stop()
  emit('update:open', value)
}
</script>

<template>
  <UiModal
    :open="open"
    :title="programText(editing ? 'form.editTitle' : 'form.createTitle')"
    :description="editing ? undefined : programText('form.createSub')"
    :dismissible="!ctl.busy.value"
    @update:open="setOpen"
  >
    <UiHint v-if="ctl.load.value === 'loading'" data-testid="pg-form-loading">
      {{ programText('form.loading') }}
    </UiHint>
    <div v-else-if="ctl.load.value === 'error'" class="pg-note" role="alert">
      <p>{{ programText('form.loadFailed') }}</p>
      <div>
        <UiButton size="sm" @click="ctl.retry()">{{ programText('form.retry') }}</UiButton>
      </div>
    </div>
    <form
      v-if="formReady"
      id="pg-program-form"
      class="pg-form"
      novalidate
      @submit.prevent="ctl.submit()"
    >
      <UiField :label="programText('form.name')" :error="errors.name">
        <UiInput v-model="name" name="name" autocomplete="off" />
      </UiField>
      <UiField
        :label="programText('form.year')"
        :hint="programText('form.yearHint')"
        :error="errors.year"
      >
        <UiSelect v-model="year" name="year" :options="years" />
      </UiField>
      <UiField :label="programText('form.description')" :error="errors.description">
        <template #default="{ id, describedBy, invalid }">
          <textarea
            :id="id"
            v-model="description"
            class="t-input pg-textarea"
            name="description"
            rows="3"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </UiField>
      <DesignStub id="BE-001" as="div" class="pg-stub">
        <UiField :label="programText('form.shortName')" :hint="programText('form.shortNameHint')">
          <UiInput name="short-name" disabled data-testid="pg-short-name" />
        </UiField>
      </DesignStub>
    </form>
    <template #footer>
      <UiButton :disabled="ctl.busy.value" @click="setOpen(false)">
        {{ programText('form.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="pg-program-form"
        :disabled="ctl.busy.value || !formReady"
        data-testid="pg-form-submit"
      >
        {{ programText(editing ? 'form.save' : 'form.create') }}
      </UiButton>
    </template>
  </UiModal>
</template>
