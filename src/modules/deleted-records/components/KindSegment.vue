<script setup lang="ts">
import { ref } from 'vue'

import { UiCount } from '@/shared/ui'
import { rovingTarget } from '@/shared/ui/roving'

import { DELETED_KINDS, type DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'

/**
 * Görünüm segmenti (E-12-08…16; P41, v0.26): Tümü · Görev (varsayılan) · Alt görev · Dosya ·
 * Toplantı · Koordinatörlük · Kullanıcı · Not ve gündem; hepsi gerçek uçlarla canlıdır. Sayaçlar
 * `reportDeletedSummary` değeridir (kesin; `Tümü` toplam, `Not ve gündem` `notes`); özet gelmediyse
 * sayaç çizilmez, sahte sayı yok.
 * Klavye: ←/→, Home/End odağı taşır; Enter/Boşluk seçer.
 */
defineProps<{ modelValue: DeletedKind; counts: Readonly<Record<DeletedKind, number>> | null }>()
const emit = defineEmits<{ 'update:modelValue': [kind: DeletedKind] }>()
const root = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent): void {
  const buttons = [...(root.value?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])]
  rovingTarget(event, buttons, 'horizontal')
}
</script>

<template>
  <div
    ref="root"
    class="rp-seg"
    role="group"
    :aria-label="deletedText('kinds.label')"
    data-testid="dr-kinds"
    @keydown="onKeydown"
  >
    <button
      v-for="kind in DELETED_KINDS"
      :key="kind"
      type="button"
      :data-kind="kind"
      :aria-pressed="modelValue === kind ? 'true' : 'false'"
      @click="emit('update:modelValue', kind)"
    >
      {{ deletedText(`kinds.${kind}`) }}
      <UiCount v-if="counts !== null" :value="String(counts[kind])" :parens="false" />
    </button>
  </div>
</template>
