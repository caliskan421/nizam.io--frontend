<script setup lang="ts">
import './bubble.css'

import { onScopeDispose, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'
import { useToast } from '@/shared/ui'
import { fetchWorkItem, TASKS_ROUTE } from '@/modules/work/public'

import type { ChatRefSummary } from '../../model/types'
import { chatText } from '../../messages'
import { useThread } from './use-thread'

/**
 * Görev referans çipi (E-10-32; P60: kilit yok): özet `available:false` → "artık yok" çipi
 * (tıklanamaz). Tık: önce `getWorkItem` (S3, görevin kendi birimiyle) yoklaması — başarıda
 * `/gorevler?gorev=<id>`; 403/404 → çipin yanında "Bu göreve erişiminiz yok", gezinme yok.
 * Alıntı içindeki küçük çip tıklanamaz (`inert`).
 */
const props = defineProps<{
  label: string
  targetId: string
  summary: ChatRefSummary | undefined
  inert?: boolean
}>()
const thread = useThread()
const router = useRouter()
const toast = useToast()
const denied = ref(false)
const controller = new AbortController()
onScopeDispose(() => controller.abort())

async function open(): Promise<void> {
  const task = props.summary?.task
  if (!task || props.summary?.available === false) return
  denied.value = false
  try {
    await fetchWorkItem(
      { programId: thread.programId.value, departmentId: task.department_id },
      props.targetId,
      controller.signal,
    )
  } catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      denied.value = true
    } else if (error instanceof ApiError) {
      toast.push({ message: errorText(error), tone: 'danger' })
    }
    return
  }
  if (controller.signal.aborted) return
  await router.push({ name: TASKS_ROUTE.name, query: { gorev: props.targetId } })
}
</script>

<template>
  <span v-if="summary?.available === false" class="chat-tref chat-tref--gone">
    {{ chatText('chat.thread.gone') }}
  </span>
  <span v-else-if="inert" class="chat-tref">{{ label }}</span>
  <template v-else>
    <button
      type="button"
      class="chat-tref"
      :title="chatText('chat.thread.openTask')"
      :aria-describedby="denied ? `chat-denied-${targetId}` : undefined"
      @click="void open()"
    >
      {{ label }}
    </button>
    <span v-if="denied" :id="`chat-denied-${targetId}`" class="chat-bub__note" role="status">
      {{ chatText('chat.thread.noTaskAccess') }}
    </span>
  </template>
</template>
