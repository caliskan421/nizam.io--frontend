<script setup lang="ts">
import './preview.css'

import { DesignStub } from '@/shared/ui'

/**
 * Önizlemede karşılığı olmayan bölüm için statik yer tutucu (E-13-28, 31, 34…36): sahte veri yok,
 * kısa açıklama. `stub` kayıt kimliğinin son hanesi (`designStub` kimliği dize literali olmak
 * zorundadır; bu yüzden her kimlik ayrı etiket).
 */
defineProps<{ stub: '123' | '134' | '136'; text: string }>()
</script>

<template>
  <DesignStub v-if="stub === '123'" id="BE-123" as="div">
    <p class="report-emptyline" data-placeholder>{{ text }}</p>
  </DesignStub>
  <DesignStub v-else-if="stub === '134'" id="BE-134" as="div">
    <p class="report-emptyline" data-placeholder>{{ text }}</p>
  </DesignStub>
  <DesignStub v-else id="BE-136" as="div">
    <p class="report-emptyline" data-placeholder>{{ text }}</p>
  </DesignStub>
</template>
