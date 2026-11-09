<script setup lang="ts">
import './forms.css'

import { computed } from 'vue'

import { useFieldContext } from '@/shared/ui/field-context'

/**
 * Çok satırlı metin (`shared/ui`'da karşılığı yok; P3 en sade). Görünüm `t-input`; kimlik,
 * `aria-describedby` ve `aria-invalid` `UiField` bağlamından (UiInput ile aynı bağ).
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
const model = defineModel<string>({ default: '' })
defineOptions({ inheritAttrs: false })

const field = useFieldContext()
const invalid = computed(() => (field?.invalid.value ? 'true' : undefined))
</script>

<template>
  <textarea
    v-bind="$attrs"
    :id="field?.id"
    v-model="model"
    class="t-input of-textarea"
    :rows="rows"
    :aria-invalid="invalid"
    :aria-describedby="field?.describedBy.value"
  />
</template>
