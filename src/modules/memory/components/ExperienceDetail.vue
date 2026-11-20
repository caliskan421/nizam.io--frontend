<script setup lang="ts">
import { computed, ref } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { UiButton, UiErrorState, UiModal } from '@/shared/ui'

import { deleteExperience, editExperience, endorseExperience } from '../api/memory'
import ExperienceConvert from './ExperienceConvert.vue'
import { useMemoryQueries } from '../model/queries'
import { AREAS, STATUSES, type ExperienceDetail, type ExperienceUpdate } from '../model/types'
import { useMemoryWrite } from '../model/write'

const props = defineProps<{ id: string }>()
const emit = defineEmits<{ close: []; notes: [] }>()
const queries = useMemoryQueries()
const data = queries.experience(() => props.id)
const item = computed(() => (data.isError.value ? undefined : data.data.value))
const write = useMemoryWrite()
const edit = ref<{
  revision: number
  title: string
  impact: string
  suggestion: string
  area: ExperienceDetail['area']
}>()
const deleting = ref(false)
const converting = ref(false)
const notice = ref('')
const converted = computed(() => item.value?.converted_work_item)
const incompatible = computed(
  () => item.value && edit.value && item.value.revision !== edit.value.revision,
)
const readError = computed(() => data.error.value)

function startEdit(record: ExperienceDetail) {
  edit.value = {
    revision: record.revision,
    title: record.title,
    impact: record.impact,
    suggestion: record.suggestion ?? '',
    area: record.area,
  }
  write.error.value = null
}

function save(record: ExperienceDetail) {
  const draft = edit.value
  if (!draft || incompatible.value) return
  const changes: ExperienceUpdate = { expected_revision: draft.revision }
  if (record.can.edit_title && draft.title.trim()) {
    changes.title = draft.title.trim()
    changes.impact = draft.impact.trim()
  }
  if (record.can.edit_area) changes.area = draft.area
  if (record.can.edit_suggestion) changes.suggestion = draft.suggestion.trim() || null
  return write.submit(
    (program) => editExperience(program, record.id, changes),
    () => {
      edit.value = undefined
    },
  )
}
function changeStatus(record: ExperienceDetail, status: ExperienceDetail['status']) {
  if (!record.can.manage || (status !== 'open' && !record.suggestion)) return
  return write.submit((program) =>
    editExperience(program, record.id, { expected_revision: record.revision, status }),
  )
}
function deleteRecord(record: ExperienceDetail) {
  if (!record.can.delete) return
  return write.submit(
    (program) => deleteExperience(program, record.id),
    () => emit('close'),
  )
}
</script>

<template>
  <section class="memory-panel t-card" aria-label="Deneyim ayrıntısı">
    <div class="memory-controls memory-between">
      <span v-if="item" class="memory-meta"
        >{{ AREAS[item.area] }} · {{ STATUSES[item.status] }}</span
      >
      <UiButton size="sm" :disabled="write.pending.value" @click="emit('close')">Kapat</UiButton>
    </div>
    <p v-if="data.isPending.value" role="status">Deneyim yükleniyor…</p>
    <UiErrorState
      v-else-if="readError"
      :error="toApiError(readError)"
      title="Deneyim açılamadı"
      retryable
      @retry="data.refetch()"
    />
    <template v-else-if="item">
      <h2>{{ item.title }}</h2>
      <p class="memory-muted">
        {{ item.author.full_name || 'Silinmiş kullanıcı' }} · {{ item.event.label }} ·
        {{ item.department.name }}
      </p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <UiErrorState
        v-if="write.error.value"
        :error="write.error.value"
        title="İşlem tamamlanamadı"
      />
      <form v-if="edit" @submit.prevent="save(item)">
        <fieldset :disabled="write.pending.value">
          <label v-if="item.can.edit_title"
            >Başlık <input v-model="edit.title" class="t-input" required
          /></label>
          <label v-if="item.can.edit_title"
            >Etki <textarea v-model="edit.impact" class="t-input" />
          </label>
          <label v-if="item.can.edit_area"
            >Alan
            <select v-model="edit.area" class="t-select">
              <option v-for="(label, key) in AREAS" :key="key" :value="key">{{ label }}</option>
            </select></label
          >
          <label v-if="item.can.edit_suggestion"
            >Öneri <textarea v-model="edit.suggestion" class="t-input" />
          </label>
        </fieldset>
        <p v-if="incompatible" role="status">
          Deneyim bu sırada değişti. Güncel değerleri okuyun ve düzenlemenizi yeniden onaylayın.
        </p>
        <div v-if="incompatible" class="memory-meta">
          {{ item.title }} · {{ item.impact || 'Etki yok' }} ·
          {{ item.suggestion || 'Öneri yok' }} · {{ AREAS[item.area] }}
          <UiButton size="sm" @click="edit.revision = item.revision">Güncel sürümü kullan</UiButton>
        </div>
        <div class="memory-controls">
          <UiButton size="sm" :disabled="write.pending.value" @click="edit = undefined"
            >Vazgeç</UiButton
          ><UiButton
            type="submit"
            size="sm"
            variant="primary"
            :disabled="write.pending.value || !!incompatible"
            >Kaydet</UiButton
          >
        </div>
      </form>
      <template v-else>
        <section>
          <h3>Etkisi</h3>
          <p>{{ item.impact || 'Etki belirtilmedi.' }}</p>
        </section>
        <section class="memory-suggestion">
          <h3>Önerimiz</h3>
          <p>{{ item.suggestion || 'Henüz öneri yok.' }}</p>
        </section>
        <UiButton
          v-if="item.can.edit_title || item.can.edit_area || item.can.edit_suggestion"
          size="sm"
          :disabled="write.pending.value"
          @click="startEdit(item)"
          >Deneyimi düzenle</UiButton
        >
        <div v-if="item.can.manage" class="memory-controls" role="group" aria-label="Durum">
          <UiButton
            v-for="(label, status) in STATUSES"
            :key="status"
            size="sm"
            :aria-pressed="item.status === status"
            :disabled="
              write.pending.value ||
              item.status === status ||
              (status !== 'open' && !item.suggestion)
            "
            @click="changeStatus(item, status)"
            >{{ label }}</UiButton
          >
        </div>
      </template>
      <UiButton
        v-if="item.can.convert && item.suggestion && !converted"
        size="sm"
        :disabled="write.pending.value"
        @click="converting = true"
        >Öneriyi göreve dönüştür</UiButton
      >
      <RouterLink
        v-if="converted && converted.program_id === queries.scope.program.value"
        :to="{ name: 'work.tasks', query: { gorev: converted.id } }"
        >Oluşturulan görevi aç</RouterLink
      >
      <p v-else-if="converted">Görevi açmak için ilgili programı seçin.</p>
      <div class="memory-controls">
        <UiButton
          size="sm"
          :aria-pressed="item.endorsed_by_me"
          :disabled="write.pending.value"
          @click="
            write.submit((program) => endorseExperience(program, item!.id, !item!.endorsed_by_me))
          "
          >Ben de yaşadım · {{ item.endorsement_count }}</UiButton
        >
        <span v-if="item.endorsements.length" class="memory-meta">{{
          item.endorsements.map((person) => person.full_name || 'Silinmiş kullanıcı').join(', ')
        }}</span>
      </div>
      <div v-if="item.source?.accessible && item.source.id" class="memory-controls">
        <span class="memory-meta">{{ item.source.label || 'Kaynak not' }}</span
        ><UiButton size="sm" @click="emit('notes')">Tüm notlar</UiButton>
      </div>
      <UiButton
        v-if="item.can.delete"
        variant="danger"
        size="sm"
        :disabled="write.pending.value"
        @click="deleting = true"
        >Deneyimi sil</UiButton
      >
      <UiModal
        v-model:open="deleting"
        title="Deneyim silinsin mi?"
        description="Deneyim ve işaretler kalıcı olarak silinir."
        :dismissible="!write.pending.value"
      >
        <div class="memory-controls">
          <UiButton :disabled="write.pending.value" @click="deleting = false">Vazgeç</UiButton>
          <UiButton variant="danger" :disabled="write.pending.value" @click="deleteRecord(item)"
            >Sil</UiButton
          >
        </div>
        <UiErrorState
          v-if="write.error.value"
          :error="write.error.value"
          title="Deneyim silinemedi"
        />
      </UiModal>
      <ExperienceConvert
        v-if="converting"
        v-model:open="converting"
        :item="item"
        @saved="notice = 'Öneriden görev oluşturuldu.'"
      />
    </template>
  </section>
</template>
