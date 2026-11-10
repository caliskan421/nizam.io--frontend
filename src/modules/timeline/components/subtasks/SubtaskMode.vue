<script setup lang="ts">
import { computed } from 'vue'

import { UiSegmented } from '@/shared/ui'
import type { UiChoiceOption } from '@/shared/ui'

import { subtaskText } from './messages'

/**
 * "Alt görev gösterimi" segmenti (E-03C-13): "Kapalı" canlı ve varsayılan; "Tümünü aç" DEVRE DIŞI
 * (K3: görev başına okuma fan-out olur; sunucuda toplu alan yok — BE-020/051). Tıklama istek
 * atmaz ve değer yayılmaz. URL `altgorev` yalnız `kapali` değerini taşır.
 */
type Mode = 'kapali' | 'tumu'

const options = computed<UiChoiceOption<Mode>[]>(() => [
  { value: 'kapali', label: subtaskText('mode.closed') },
  { value: 'tumu', label: subtaskText('mode.all'), disabled: true },
])
</script>

<template>
  <UiSegmented
    model-value="kapali"
    :options="options"
    :label="subtaskText('mode.label')"
    data-testid="subtask-mode"
  />
</template>
