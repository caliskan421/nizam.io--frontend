<script setup lang="ts">
import './forms.css'

import { computed } from 'vue'

import { useFieldContext } from '@/shared/ui/field-context'

/**
 * `shared/ui`'da karşılığı olmayan iki yerel denetim (P3 en sade): gün seçici
 * (`<input type="date">`, değer `YYYY-MM-DD`) ve çok satırlı metin. Görünüm `t-input`; kimlik,
 * `aria-describedby` ve `aria-invalid` `UiField` bağlamından (UiInput ile aynı bağ).
 */
withDefaults(defineProps<{ kind: 'date' | 'textarea'; rows?: number }>(), { rows: 3 })
const model = defineModel<string>({ default: '' })
defineOptions({ inheritAttrs: false })

const field = useFieldContext()
const invalid = computed(() => (field?.invalid.value ? 'true' : undefined))
</script>

<template>
  <textarea
    v-if="kind === 'textarea'"
    v-bind="$attrs"
    :id="field?.id"
    v-model="model"
    class="t-input wf-textarea"
    :rows="rows"
    :aria-invalid="invalid"
    :aria-describedby="field?.describedBy.value"
  />
  <input
    v-else
    v-bind="$attrs"
    :id="field?.id"
    v-model="model"
    class="t-input"
    type="date"
    :aria-invalid="invalid"
    :aria-describedby="field?.describedBy.value"
  />
</template>
