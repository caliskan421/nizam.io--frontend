<script setup lang="ts">
import { computed } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'
import { DesignStub, UiIcon } from '@/shared/ui'

import { detailText } from './messages'

/**
 * Hakkında (E-08-70…75): "Düzenle" W74 düzenleme formunu açar (yalnız `editDepartment`).
 * Açıklama katalog alanı (`readProgramDepartment.description`, BE-049); boşsa paragraf çizilmez.
 * Üst birim çizilmez (K14, P16). "Oluşturulma tarihi" katalog kaydının oluşturulma anıdır
 * (BE-018 `created_at`; tarihsel kuruluş iddiası yok, GAP-240); Görünürlük alanı yok → "—" + `BE-018`
 * (kısmi satır; sahte değer yok, §4). Arşiv klasörü F5'e dek tıklanamaz + faz notu.
 */
const props = defineProps<{
  description: string | null
  createdAt: string | null
  canEdit: boolean
}>()
const emit = defineEmits<{ edit: [] }>()
const instance = useInstanceStore()
const created = computed(() =>
  props.createdAt
    ? new Intl.DateTimeFormat('tr-TR', {
        timeZone: instance.profile?.timezone ?? 'Europe/Istanbul',
        dateStyle: 'medium',
      }).format(new Date(props.createdAt))
    : null,
)
</script>

<template>
  <section class="t-card cd-card" aria-labelledby="cd-about-title" data-card="about">
    <div class="rp-cardhead cd-cardhead">
      <h2 id="cd-about-title" class="rp-cardtitle">
        {{ detailText('coordinatorship.about.title') }}
      </h2>
      <button
        v-if="canEdit"
        type="button"
        class="rp-link rp-linkbtn"
        data-action="about-edit"
        @click="emit('edit')"
      >
        <UiIcon name="edit" size="sm" />
        {{ detailText('coordinatorship.about.edit') }}
      </button>
    </div>
    <p v-if="description" class="cd-about" data-testid="cd-description">{{ description }}</p>
    <dl class="rp-dl cd-dl">
      <dt>{{ detailText('coordinatorship.about.created') }}</dt>
      <dd class="rp-mono" data-field="created">
        {{ created ?? detailText('coordinatorship.about.none') }}
      </dd>
      <dt>{{ detailText('coordinatorship.about.archive') }}</dt>
      <dd>
        <span
          class="rp-link cd-disabled-link"
          role="link"
          aria-disabled="true"
          :title="detailText('coordinatorship.phase.f5')"
          data-field="archive"
        >
          {{ detailText('coordinatorship.phase.f5') }}
        </span>
      </dd>
      <dt>{{ detailText('coordinatorship.about.visibility') }}</dt>
      <dd>
        <DesignStub id="BE-018" data-field="visibility">
          {{ detailText('coordinatorship.about.none') }}
        </DesignStub>
      </dd>
    </dl>
  </section>
</template>
