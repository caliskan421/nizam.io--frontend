<script setup lang="ts">
import { DesignStub } from '@/shared/ui'

import { detailText } from './messages'

/**
 * Hakkında (E-08-70…75): "Düzenle" W74 düzenleme formunu açar (yalnız `editDepartment`).
 * Açıklama katalog alanı (`CoordinatorshipStat.description`, ŞY); boşsa paragraf çizilmez.
 * Üst birim çizilmez (K14, P16). Kuruluş ve Görünürlük alanı yok → "—" + `BE-018` (sahte tarih
 * yok, §4). Arşiv klasörü F5'e dek tıklanamaz + faz notu.
 */
defineProps<{ description: string | null; canEdit: boolean }>()
const emit = defineEmits<{ edit: [] }>()
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
        {{ detailText('coordinatorship.about.edit') }}
      </button>
    </div>
    <p v-if="description" class="cd-about" data-testid="cd-description">{{ description }}</p>
    <dl class="rp-dl cd-dl">
      <dt>{{ detailText('coordinatorship.about.founded') }}</dt>
      <dd class="rp-mono">
        <DesignStub id="BE-018" data-field="founded">
          {{ detailText('coordinatorship.about.none') }}
        </DesignStub>
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
