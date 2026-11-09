<script setup lang="ts">
import './program.css'

import { computed } from 'vue'

import { useProgramDepartmentIndex } from '@/modules/organization/public'
import type { MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import type { ProgramOption } from '@/shared/scope/standing-facts'
import { UiButton, UiCard, UiCheck, UiField, UiHint, UiInput, UiSelect } from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'

import { programText } from '../model/messages'
import { previewSummary } from '../model/transfer'
import type { TransferInput, TransferResult } from '../model/types'
import TransferItems from './TransferItems.vue'
import { useTransfer } from './use-transfer'

/**
 * Dönem aktarımı kartı (E-00-25; P17: "sezona kopyala" ≠ görev aktarımı). Kaynak = seçili
 * program; hedef program + departman + görevler seçilir → "Önizle" → özet → "Aktar" (onaylı).
 */
const props = defineProps<{ programs: readonly ProgramOption[] }>()

const store = useScopeStore()
const nameOf = (id: string) => props.programs.find((p) => p.programId === id)?.name ?? ''
const ctl = useTransfer(nameOf)
const targetId = ctl.targetId
const departmentId = ctl.departmentId
const selectedIds = ctl.selectedIds
const addMissingAccess = ctl.addMissingAccess

const departments = useProgramDepartmentIndex(() => store.programId !== null)
const sourceName = computed(() => (store.programId ? nameOf(store.programId) : ''))
const targetOptions = computed(() =>
  props.programs
    .filter((p) => p.programId !== store.programId)
    .map((p) => ({ value: p.programId, label: p.year ? `${p.name} · ${p.year}` : p.name })),
)
const departmentOptions = computed(() =>
  departments.departments.value.map((d) => ({ value: d.department_id, label: d.display_name })),
)
const preview = computed(() => ctl.previewed.value?.preview ?? null)
const summary = computed(() => (preview.value ? previewSummary(preview.value) : []))
const blocked = computed(() => preview.value !== null && !ctl.executable.value)
const canPreview = computed(
  () => targetId.value !== '' && departmentId.value !== '' && selectedIds.value.length > 0,
)

function onResolved(outcome: MutationOutcome<unknown, unknown, unknown>): void {
  ctl.resolved(outcome as MutationOutcome<TransferInput, TransferResult, unknown>)
}
</script>

<template>
  <UiCard
    class="pg-card"
    :title="programText('transfer.title')"
    :meta="programText('transfer.sub')"
  >
    <UiHint v-if="!store.programId">{{ programText('transfer.noProgram') }}</UiHint>
    <UiHint v-else-if="targetOptions.length === 0">{{ programText('transfer.onlyOne') }}</UiHint>
    <div v-else class="pg-form" data-testid="pg-transfer">
      <div class="pg-row">
        <UiField :label="programText('transfer.source')">
          <UiInput :model-value="sourceName" name="source" disabled />
        </UiField>
        <UiField :label="programText('transfer.target')">
          <UiSelect
            v-model="targetId"
            name="target"
            :options="targetOptions"
            :placeholder="programText('transfer.targetPlaceholder')"
          />
        </UiField>
      </div>
      <UiField :label="programText('transfer.department')">
        <UiSelect
          v-model="departmentId"
          name="department"
          :options="departmentOptions"
          :placeholder="programText('transfer.departmentPlaceholder')"
        />
      </UiField>
      <TransferItems v-if="departmentId" v-model="selectedIds" :department-id="departmentId" />
      <div class="pg-actions">
        <UiButton
          :disabled="!canPreview || ctl.busy.value"
          data-testid="pg-preview"
          @click="ctl.preview()"
        >
          {{ programText(preview ? 'transfer.previewAgain' : 'transfer.preview') }}
        </UiButton>
      </div>
      <UiHint v-if="ctl.stale.value" error data-testid="pg-stale">
        {{ programText('transfer.staleServer') }}
      </UiHint>
      <section v-if="preview" class="pg-preview" data-testid="pg-preview-card">
        <h4 class="t-label">{{ programText('transfer.previewTitle') }}</h4>
        <ul class="pg-preview__list">
          <li v-for="l in summary" :key="l.key" :data-line="l.key" :data-tone="l.tone">
            {{ l.text }}
          </li>
        </ul>
        <UiHint v-if="!ctl.current.value" error data-testid="pg-preview-stale">
          {{ programText('transfer.previewStale') }}
        </UiHint>
        <label v-if="preview.missing_access" class="pg-items__label">
          <UiCheck v-model="addMissingAccess" name="add-missing-access" />
          <span>{{ programText('transfer.addMissingAccess') }}</span>
        </label>
        <UiHint v-if="blocked && preview.blockers.length > 0" error data-testid="pg-blockers">
          {{ programText('transfer.blockers', { n: preview.blockers.length }) }}
        </UiHint>
        <UiHint v-if="preview.warnings.length > 0">
          {{ programText('transfer.warnings', { n: preview.warnings.length }) }}
        </UiHint>
        <div class="pg-actions">
          <UiButton
            variant="primary"
            :disabled="!ctl.executable.value || ctl.busy.value"
            data-testid="pg-execute"
            @click="ctl.execute()"
          >
            {{ programText('transfer.execute') }}
          </UiButton>
        </div>
      </section>
      <UiOutcomeNotice :outcome="ctl.notice.value" @resolved="onResolved" />
    </div>
  </UiCard>
</template>
