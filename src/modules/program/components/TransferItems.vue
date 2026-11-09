<script setup lang="ts">
import { computed } from 'vue'

import { useDepartmentWorkItems } from '@/modules/organization/public'
import { UiButton, UiCheck, UiHint } from '@/shared/ui'

import { programText } from '../model/messages'
import { TRANSFER_ITEM_LIMIT } from '../model/transfer'

/**
 * Aktarılacak görevlerin seçimi: seçili programdaki TEK departmanın görevleri (tek uç, imleç
 * bitene dek sayfalama — fan-out değil, ortak-kurallar §9; work sorgusunun yeniden kullanımı).
 * Bileşen yalnız departman seçilince bağlanır (seçim yokken istek yok). Tek aktarım en çok 200
 * kalem (PROGRAM-K33): tavan dolunca seçilmemiş kutular kapanır.
 */
const props = defineProps<{ departmentId: string; modelValue: readonly string[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>()

const list = useDepartmentWorkItems(() => props.departmentId)
const items = computed(() => list.items.value)
const chosen = computed(() => new Set(props.modelValue))
const full = computed(() => props.modelValue.length >= TRANSFER_ITEM_LIMIT)
const loading = computed(() => list.query.isPending.value)
const failed = computed(() => list.query.isError.value && items.value.length === 0)

function toggle(id: string, on: boolean): void {
  const next = props.modelValue.filter((x) => x !== id)
  if (on && next.length < TRANSFER_ITEM_LIMIT) next.push(id)
  emit('update:modelValue', next)
}

function selectAll(): void {
  emit(
    'update:modelValue',
    items.value.slice(0, TRANSFER_ITEM_LIMIT).map((item) => item.work_item_id),
  )
}
</script>

<template>
  <div class="pg-items" data-testid="pg-transfer-items">
    <UiHint v-if="loading">{{ programText('transfer.itemsLoading') }}</UiHint>
    <UiHint v-else-if="failed" error>{{ programText('transfer.itemsError') }}</UiHint>
    <UiHint v-else-if="items.length === 0">{{ programText('transfer.itemsEmpty') }}</UiHint>
    <template v-else>
      <div class="pg-items__bar">
        <span class="pg-cap" data-testid="pg-selected-count">
          {{ programText('transfer.selected', { n: modelValue.length }) }}
        </span>
        <UiButton size="sm" variant="ghost" data-testid="pg-select-all" @click="selectAll">
          {{ programText('transfer.selectAll') }}
        </UiButton>
        <UiButton size="sm" variant="ghost" @click="emit('update:modelValue', [])">
          {{ programText('transfer.selectNone') }}
        </UiButton>
      </div>
      <UiHint v-if="!list.complete.value">{{ programText('transfer.itemsPartial') }}</UiHint>
      <UiHint v-if="full">
        {{ programText('transfer.itemsLimit', { n: TRANSFER_ITEM_LIMIT }) }}
      </UiHint>
      <ul class="pg-items__list">
        <li v-for="item in items" :key="item.work_item_id" class="pg-items__row">
          <label class="pg-items__label">
            <UiCheck
              :model-value="chosen.has(item.work_item_id)"
              :disabled="full && !chosen.has(item.work_item_id)"
              :data-item="item.work_item_id"
              @update:model-value="toggle(item.work_item_id, $event)"
            />
            <span class="rp-trunc">{{ item.title }}</span>
          </label>
        </li>
      </ul>
    </template>
  </div>
</template>
