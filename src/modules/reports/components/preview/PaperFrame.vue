<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import { t } from '../text'

/**
 * Kâğıt sayfası (E-13-19, 38): her temada AÇIK zemin (`data-theme="light"`), devam şeridi
 * (kapak hariç) ve altlık. Sayfa numarası yok ("Sayfa x / y" gizli; tek akış, P51). `tabindex=-1`:
 * içindekiler bağlantısı bölüme kaydırır ve odağı bölüme taşır. Kâğıt metni (tasarım kâğıdı)
 * ekranın tema/dil kabuğundan bağımsızdır.
 */
const props = defineProps<{
  id?: string
  label: string
  ctx: PaperContext
  /** Devam şeridi başlığı; `null` → şerit yok (kapak). */
  strip: string | null
  /** Şeridin sağ metni (varsayılan "Oluşturulma …"). */
  stripRight?: string | null
  footLeft?: string
}>()

const right = computed(() => {
  if (props.stripRight !== undefined) return props.stripRight
  return props.ctx.generatedAt
    ? t('reports.season.paper.created', { at: props.ctx.generatedAt })
    : null
})
const footEnd = computed(() =>
  props.ctx.today ? t('reports.season.paper.footRight', { date: props.ctx.today }) : '',
)
</script>

<template>
  <article :id="props.id" class="report-paper" data-theme="light" :aria-label="label" tabindex="-1">
    <div v-if="strip !== null" class="report-strip">
      <span class="report-logo" aria-hidden="true">{{ ctx.mark }}</span>
      <span class="rp-trunc">{{ strip }}</span>
      <span class="report-strip__right">
        <template v-if="right">{{ right }}</template>
        <span class="report-logo" aria-hidden="true">RP</span>
      </span>
    </div>
    <slot />
    <footer class="report-foot">
      <span>{{ footLeft ?? ctx.program }}</span>
      <span>{{ footEnd }}</span>
    </footer>
  </article>
</template>
