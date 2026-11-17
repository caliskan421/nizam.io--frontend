<script setup lang="ts">
import { computed } from 'vue'

import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'

/**
 * Ebeveyni çöpte olan çocuk satırın uyarısı (E-12-28 ek; v0.26): "Önce bağlı görevi/toplantıyı geri
 * yükleyin". Geri yükleme düğmesi etkin kalır; gerçek cevap sunucudan gelir (409). Bağlantı
 * yalnız ebeveyn silinmiş, türü bilinen (görev/toplantı) ve adı okunabilir olduğunda sunulur:
 * silinenler görünümünde ebeveyni açar. Ad yoksa kimlik gösterilmez ve bağlantı verilmez.
 */
const props = defineProps<{ row: DeletedRow }>()
const emit = defineEmits<{ open: [] }>()

const parent = computed(() => (props.row.parent?.deleted ? props.row.parent : null))
const warning = computed(() => {
  const kind = parent.value?.kind
  if (kind === 'tasks') return deletedText('row.parentTask')
  if (kind === 'meetings') return deletedText('row.parentMeeting')
  return deletedText('row.parentUnknown')
})
const linkable = computed(() => parent.value?.kind != null && !!parent.value.name)
const linkLabel = computed(() =>
  parent.value?.kind === 'meetings' ? deletedText('row.openMeeting') : deletedText('row.openTask'),
)
</script>

<template>
  <span v-if="parent" class="dr-parent" data-testid="dr-parent">
    <span>{{ warning }}</span>
    <button
      v-if="linkable"
      type="button"
      class="dr-parent__link"
      data-action="open-parent"
      @click.stop="emit('open')"
    >
      {{ linkLabel }}
    </button>
  </span>
</template>
