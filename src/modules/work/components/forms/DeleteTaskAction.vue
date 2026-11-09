<script setup lang="ts">
import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { UiIconButton, useToast } from '@/shared/ui'

import { useDeleteWorkItem } from '../../api'
import { canManageWorkItem, workActorFacts } from '../../model/capabilities'
import { targetOf } from '../../model/target'
import type { DeleteTaskActionEmits, DeleteTaskActionProps } from '../index'
import { formsText } from './messages'

/**
 * W45 · E-03-56, E-03-64 — "Görevi sil" (tasarım `t-iconbtn--danger`, çöp). Yalnız yönetici ve
 * görevin koordinatörü görür (s.139); diğerinde gizli. `deleteWorkItem` `confirmation_required`
 * döndürmez (ortak-kurallar §7) → onay istemci diyaloğu (`shared/ui/confirm`); vazgeçte istek
 * yok. Başarıda liste/görev yeniden okunur (veri katmanı) ve `deleted` → panel kapanır.
 */
const props = defineProps<DeleteTaskActionProps>()
const emit = defineEmits<DeleteTaskActionEmits>()

const store = useScopeStore()
const { standing } = useStanding()
const remove = useDeleteWorkItem()
const { confirmWrite } = useConfirm()

const allowed = computed(() =>
  canManageWorkItem(workActorFacts(standing.value, store.programId, props.item)),
)

async function onDelete(): Promise<void> {
  if (remove.isPending.value) return
  const item = props.item
  const options = {
    title: formsText('workForms.remove.title'),
    body: [formsText('workForms.remove.body', { title: item.title })],
    confirmLabel: formsText('workForms.remove.confirm'),
    tone: 'danger' as const,
  }
  // Silme onayın yakaladığı bağlamla başlar (CX-F1-E-02); vazgeç/iptal → null, istek yok.
  const outcome = await confirmWrite(options, (context) =>
    remove.submit({ target: targetOf(item), workItemId: item.work_item_id }, { context }),
  )
  if (outcome === null) return
  if (outcome.kind !== 'success') {
    notifyOutcome(outcome)
    return
  }
  useToast().push({ message: formsText('workForms.remove.done') })
  emit('deleted', item.work_item_id)
}
</script>

<template>
  <UiIconButton
    v-if="allowed"
    icon="trash"
    tone="danger"
    :label="formsText('workForms.remove.action')"
    :disabled="remove.isPending.value"
    data-testid="wf-delete"
    @click="onDelete"
  />
</template>
