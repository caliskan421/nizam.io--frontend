<script setup lang="ts">
import { statesText } from '@/app/states/messages'
import { UiEmptyState } from '@/shared/ui'

/**
 * F0 ana sayfası (`home`, `/`, S1): 01 içeriği (selamlama, KPI şeridi, hızlı işlemler) F1'de
 * bağlanır. O zamana dek kabuk içinde nötr yer tutucu; kişi adı, sayı, tarih ya da örnek akış
 * yoktur (ortak-kurallar §4, P3/P6). F1'de `modules/home` sayfası bu kaydın yerini alır.
 */
</script>

<template>
  <section class="home-placeholder" data-testid="home-page">
    <UiEmptyState
      icon="home"
      :title="statesText('states.home.title')"
      :text="statesText('states.home.text')"
    />
  </section>
</template>

<style>
/* `theme.css` `.rp-body` dolgusu; yalnız token. */
@layer components {
  .home-placeholder {
    padding: var(--space-6) var(--space-8) var(--space-12);
  }
  @media (max-width: 900px) {
    .home-placeholder {
      padding: var(--space-5);
    }
  }
}
</style>
