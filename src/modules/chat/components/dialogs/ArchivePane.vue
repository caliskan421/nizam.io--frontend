<script setup lang="ts">
/**
 * "Arşivden" sekmesi (E-10-54, E-10-101…106): arşiv dosyası seçimi. Önce koordinatörlük (ŞY tüm
 * program birimleri; K/Ü kendi birimleri; S3 başlığı bu seçimden), sonra `archiveAttachments`
 * (arama; "Daha fazla yükle"). Seçilen dosya KOPYALANMAZ, bağlantı olarak paylaşılır (üst
 * bileşen `refs` ile gönderir). Okuma yetkisi sunucudadır (üye yalnız kendisine atanan görevlerin
 * dosyaları); boş liste dürüst boş durumdur.
 */
import './dialogs.css'

import { computed, ref, watch } from 'vue'

import { useArchiveAttachments } from '@/modules/archive/public'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiHint, UiInput, UiSelect } from '@/shared/ui'

import { chatText } from '../../messages'
import { sizeKb, type PickedArchiveFile } from './forms'
import { useChatActor } from './use-actor'

const emit = defineEmits<{ change: [file: PickedArchiveFile | null] }>()

const store = useScopeStore()
const { actor } = useChatActor()
const programDepartments = useProgramDepartments()

const departmentOptions = computed(() => {
  const standing = actor.value.standing
  if (standing === null) return []
  if (standing.companyAdmin) {
    return (programDepartments.query.data.value?.departments ?? []).map((d) => ({
      value: d.department_id,
      label: d.display_name,
    }))
  }
  const seen = new Map<string, string>()
  for (const row of standing.rows) {
    if (row.programId === actor.value.programId) seen.set(row.departmentId, row.displayName)
  }
  return [...seen].map(([value, label]) => ({ value, label }))
})

const departmentId = ref('')
watch(
  departmentOptions,
  (list) => {
    if (departmentId.value === '' && list.length === 1) departmentId.value = list[0]!.value
  },
  { immediate: true },
)
const search = ref('')
const picked = ref<string | null>(null)

const target = computed(() =>
  store.programId !== null && departmentId.value !== ''
    ? { programId: store.programId, departmentId: departmentId.value }
    : null,
)
const archive = useArchiveAttachments(target, () => ({ search: search.value }))

watch([departmentId, search], () => {
  picked.value = null
  emit('change', null)
})

function pick(fileId: string, name: string): void {
  picked.value = fileId
  emit('change', { fileId, name })
}
</script>

<template>
  <div class="chat-dlg__form" data-testid="dlg-archive">
    <UiSelect
      v-model="departmentId"
      name="department"
      :aria-label="chatText('chat.dialogs.share.department')"
      :options="departmentOptions"
      :placeholder="chatText('chat.dialogs.share.departmentPlaceholder')"
    />
    <template v-if="target !== null">
      <UiInput
        v-model="search"
        type="search"
        icon="search"
        :aria-label="chatText('chat.dialogs.share.archiveSearch')"
        :placeholder="chatText('chat.dialogs.share.archiveSearch')"
      />
      <p v-if="archive.query.isPending.value" role="status">
        {{ chatText('chat.states.loading') }}
      </p>
      <UiHint v-else-if="archive.query.isError.value" error>
        {{ chatText('chat.states.error') }}
      </UiHint>
      <UiHint v-else-if="archive.files.value.length === 0" data-testid="dlg-archive-empty">
        {{ chatText('chat.dialogs.share.archiveEmpty') }}
      </UiHint>
      <ul v-else class="chat-dlg-list" data-testid="dlg-archive-list">
        <li v-for="file in archive.files.value" :key="file.file_id">
          <button
            type="button"
            class="chat-dlg-row"
            :aria-pressed="picked === file.file_id"
            @click="pick(file.file_id, file.display_name)"
          >
            <span class="chat-dlg-row__name rp-trunc">{{ file.display_name }}</span>
            <span class="chat-dlg-row__meta">
              {{ chatText('chat.dialogs.share.size', { n: sizeKb(file.size_bytes) }) }}
            </span>
          </button>
        </li>
      </ul>
      <UiButton
        v-if="archive.hasMore.value"
        variant="ghost"
        size="sm"
        data-testid="dlg-archive-more"
        @click="archive.loadMore()"
      >
        {{ chatText('chat.list.more') }}
      </UiButton>
    </template>
    <UiHint>{{ chatText('chat.dialogs.share.archiveNote') }}</UiHint>
  </div>
</template>
