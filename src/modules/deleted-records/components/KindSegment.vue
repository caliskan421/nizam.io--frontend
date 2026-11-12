<script setup lang="ts">
import { ref } from 'vue'

import { DesignStub, UiCount } from '@/shared/ui'
import { rovingTarget } from '@/shared/ui/roving'

import { DELETED_KINDS, type DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'

/**
 * Tür segmenti (E-12-08…16; P41, P42): Görev (varsayılan) · Toplantı · Koordinatörlük ·
 * Kullanıcı canlı; Alt görev · Dosya · Not ve gündem devre dışı statik (BE-109, BE-076, BE-111).
 * "Tümü" yoktur. Sayaç yalnız açık sekmede ("n" ya da bitmediyse "n+"); diğer türlerde sayı
 * gösterilmez (ek istek yok). Klavye: ←/→, Home/End odağı taşır; Enter/Boşluk seçer.
 */
defineProps<{ modelValue: DeletedKind; count: string | null }>()
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
      <UiCount v-if="modelValue === kind && count !== null" :value="count" :parens="false" />
    </button>
    <DesignStub id="BE-109">
      <button
        type="button"
        data-kind="altgorev"
        disabled
        :title="deletedText('kinds.disabledHint')"
      >
        {{ deletedText('kinds.altgorev') }}
      </button>
    </DesignStub>
    <DesignStub id="BE-076">
      <button type="button" data-kind="dosya" disabled :title="deletedText('kinds.disabledHint')">
        {{ deletedText('kinds.dosya') }}
      </button>
    </DesignStub>
    <DesignStub id="BE-111">
      <button
        type="button"
        data-kind="notgundem"
        disabled
        :title="deletedText('kinds.disabledHint')"
      >
        {{ deletedText('kinds.notgundem') }}
      </button>
    </DesignStub>
  </div>
</template>
