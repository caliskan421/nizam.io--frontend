<script setup lang="ts">
import './program.css'

import type { ProgramOption } from '@/shared/scope/standing-facts'
import { UiBadge, UiButton, UiIconButton } from '@/shared/ui'

import { programText } from '../model/messages'

/**
 * Program satırları (`['programs']`; ad `tr-TR` sırası çağırandan). Seçili program rozetle
 * işaretlenir; diğerlerinde "Bu programa geç" kapsamı değiştirir (kenar menüsündeki seçimle aynı
 * depo eylemi). Eylemler yalnız yetkili çağıran tarafından gösterilir (`canEdit`).
 */
defineProps<{
  programs: readonly ProgramOption[]
  currentId: string | null
  canEdit: boolean
}>()
const emit = defineEmits<{
  select: [programId: string]
  edit: [programId: string]
  reset: [program: ProgramOption]
  delete: [program: ProgramOption]
}>()
</script>

<template>
  <ul class="pg-list" :aria-label="programText('list.region')" data-testid="pg-list">
    <li
      v-for="p in programs"
      :key="p.programId"
      class="pg-list__row"
      :data-program="p.programId"
      :data-current="p.programId === currentId ? 'true' : undefined"
    >
      <div class="pg-list__main">
        <span class="pg-list__name rp-trunc">{{ p.name }}</span>
        <span class="pg-cap">
          {{ p.year ? programText('list.year', { year: p.year }) : programText('list.noYear') }}
        </span>
      </div>
      <UiBadge v-if="p.programId === currentId" tone="violet">
        {{ programText('list.current') }}
      </UiBadge>
      <UiButton
        v-else
        size="sm"
        variant="ghost"
        data-testid="pg-select"
        @click="emit('select', p.programId)"
      >
        {{ programText('list.select') }}
      </UiButton>
      <div
        v-if="canEdit"
        class="pg-list__actions"
        role="group"
        :aria-label="programText('list.actions', { name: p.name })"
      >
        <UiIconButton
          icon="edit"
          :label="programText('list.edit')"
          data-testid="pg-edit"
          @click="emit('edit', p.programId)"
        />
        <UiIconButton
          icon="undo"
          :label="programText('list.reset')"
          data-testid="pg-reset"
          @click="emit('reset', p)"
        />
        <UiIconButton
          icon="trash"
          tone="danger"
          :label="programText('list.delete')"
          data-testid="pg-delete"
          @click="emit('delete', p)"
        />
      </div>
    </li>
  </ul>
</template>
