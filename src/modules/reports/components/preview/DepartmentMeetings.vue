<script setup lang="ts">
import './preview.css'
import './detail.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import { meetingCards } from '../../model/season-detail'
import type { DepartmentSection } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { departmentAnchor } from './ids'
import PaperHeading from './PaperHeading.vue'

/**
 * Toplantılar (01f, E-13-35; BE-136): `reportSeason.meetings[]` — bölümün sahip olduğu ya da dahil
 * olduğu toplantılar (en yeni önce); tarih/saat, gündem işaretli/toplam, katılımcı ve not sayıları,
 * göreve dönüşen not sayısı, ortak toplantıda diğer bölümler. Gündem metni, katılımcı adı ve not
 * içeriği JSON'da yoktur → çizilmez (bunlar toplantı raporundadır, 01g).
 */
const props = defineProps<{ ctx: PaperContext; section: DepartmentSection; season: SeasonReport }>()

const cards = computed(() => meetingCards(props.section.id, props.season, props.ctx.timeZone))
const heading = computed(() => `${departmentAnchor(props.section.id)}-meetings`)
const p = (key: string, params?: Record<string, unknown>) =>
  t(`reports.season.paper.dept.meetings.${key}`, params)
const deletedText = t('reports.season.paper.dept.meetings.deleted')
</script>

<template>
  <section class="report-section" :aria-labelledby="heading" data-testid="dept-meetings">
    <PaperHeading :id="heading" :title="p('title')" :aside="p('count', { n: cards.length })" />
    <p v-if="cards.length === 0" class="report-emptyline">{{ p('empty') }}</p>
    <article
      v-for="card in cards"
      :key="card.id"
      class="report-card"
      :aria-label="`${card.title}, ${card.date}`"
      :data-meeting="card.id"
    >
      <div class="report-card__row">
        <span class="report-mono">{{ card.date }} · {{ card.time }}</span>
        <span class="report-mono">{{
          p('agenda', { a: card.agendaChecked, b: card.agendaTotal })
        }}</span>
      </div>
      <h4 class="report-card__t">{{ card.title }}</h4>
      <p class="report-card__meta">
        {{ p('participants', { n: card.participants }) }} · {{ p('notes', { n: card.notes }) }} ·
        {{ p('converted', { n: card.converted }) }}
      </p>
      <p v-if="card.others.length > 0" class="report-card__meta">
        {{
          p('shared', {
            names: card.others
              .map((o) => (o.deleted ? `${o.name} ${deletedText}` : o.name))
              .join(', '),
          })
        }}
      </p>
    </article>
  </section>
</template>
