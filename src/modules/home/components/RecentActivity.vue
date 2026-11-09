<script setup lang="ts">
import { DesignStub, UiIcon, UiPlaceholder } from '@/shared/ui'

import { homeText } from '../model/messages'

/**
 * "Son işlemler" kartı (E-01-13/14). Audit okuma ucu yok (BE-010) → nötr yer tutucu (`rp-empty`),
 * sahte/örnek akış YOK: kişi adı, tarih, sayı ya da işlem metni çizilmez (ortak-kurallar §4,
 * CX-M-05); akış satırları (E-01-15…18) veri gelene dek çizilmez. "Tümü" → 01b İşlem geçmişi v1
 * dışı (K14) → açıklamalı devre dışı, tıklama gezinmez; stub değil (§3).
 */
</script>

<template>
  <section class="t-card home-card" data-region="recent">
    <div class="rp-cardhead">
      <h2 class="rp-cardtitle">{{ homeText('home.recent.title') }}</h2>
      <button
        type="button"
        class="rp-link rp-linkbtn"
        aria-disabled="true"
        :title="homeText('home.recent.allDisabled')"
        data-recent-all
        @click.prevent
      >
        {{ homeText('home.recent.all') }}<UiIcon name="chevron-right" size="sm" />
      </button>
    </div>
    <DesignStub id="BE-010" as="div">
      <UiPlaceholder :text="homeText('home.recent.empty')" />
    </DesignStub>
  </section>
</template>
