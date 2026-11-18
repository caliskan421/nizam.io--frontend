<script setup lang="ts">
import './preview.css'
import './detail.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import { detailCards } from '../../model/season-detail'
import type { DepartmentSection } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { departmentAnchor } from './ids'
import PaperHeading from './PaperHeading.vue'

/**
 * Görev detay kartları (01f, E-13-34; BE-136): yalnız içeriği olan görevler; açıklama, bağımlı
 * olduğu görevler, en yeni ≤5 not (bayrak ACİL/ENGEL/SORU/BİLGİ ve "PAYLAŞILAN" etiketi içeriğin yanında; paylaşılan
 * yalnız etikettir, görünürlük/bildirim anlamı taşımaz — WORK-K103),
 * tarih değişikliği talepleri (bitiş eski → yeni, durum, talep eden, gerekçe) ve görevin dosyaları.
 * Hepsi `reportSeason.tasks[].detail` ve `files[]`'tan; boşsa tek satır metin.
 */
const props = defineProps<{ ctx: PaperContext; section: DepartmentSection; season: SeasonReport }>()

const cards = computed(() => detailCards(props.section, props.season, props.ctx.timeZone))
const heading = computed(() => `${departmentAnchor(props.section.id)}-details`)
const p = (key: string, params?: Record<string, unknown>) =>
  t(`reports.season.paper.dept.details.${key}`, params)

function lateText(kind: string, days: number): string {
  return kind === 'none' ? '—' : t(`reports.season.paper.dept.lateness.${kind}`, { n: days })
}
</script>

<template>
  <section class="report-section" :aria-labelledby="heading" data-testid="dept-details">
    <PaperHeading :id="heading" :title="p('title')" :aside="p('count', { n: cards.length })" />
    <p v-if="cards.length === 0" class="report-emptyline">{{ p('empty') }}</p>
    <article
      v-for="card in cards"
      :key="card.id"
      class="report-card"
      :class="`report-st-${card.status}`"
      :aria-label="`${card.label} ${card.title}`"
      :data-detail="card.id"
    >
      <div class="report-card__h">
        <span class="report-card__num">{{ card.label }}</span>
        <h4 class="report-card__t rp-trunc">{{ card.title }}</h4>
        <span class="report-pill">{{ t(`reports.season.paper.status.${card.status}`) }}</span>
      </div>
      <p class="report-card__meta">
        {{ p('priority') }}:
        <strong>{{ t(`reports.season.paper.priority.${card.priority}`) }}</strong> ·
        <span class="report-mono"
          >{{ card.start }} – {{ card.end
          }}{{
            card.plan ? ` (${t('reports.season.paper.dept.plan', { d: card.plan })})` : ''
          }}</span
        >
        ·
        <span
          :class="{ 'report-danger': card.lateKind === 'overdue' || card.lateKind === 'late' }"
          >{{ lateText(card.lateKind, card.lateDays) }}</span
        >
        ·
        {{ p('assignees') }}:
        {{
          card.assignees.length > 0
            ? card.assignees.join(', ')
            : t('reports.season.paper.dept.unassigned')
        }}
      </p>
      <p v-if="card.description" class="report-card__text">{{ card.description }}</p>
      <p v-if="card.dependencies.length > 0" class="report-card__meta" data-testid="detail-deps">
        {{ p('dependsOn') }}:
        <strong class="report-mono">{{ card.dependencies.map((d) => d.label).join(', ') }}</strong>
      </p>
      <template v-if="card.notes.length > 0">
        <p class="report-card__sub">{{ p('notes', { n: card.noteCount }) }}</p>
        <div
          v-for="note in card.notes"
          :key="note.no"
          class="report-note"
          data-testid="detail-note"
        >
          <h5 class="report-note__h">
            {{ p('note', { no: note.no, at: note.at }) }}<span> · {{ note.author }}</span>
          </h5>
          <p v-if="note.flag || note.shared" class="report-note__flags" data-testid="note-flags">
            <span v-if="note.flag" class="report-pill" :data-flag="note.flag">{{
              p(`flag.${note.flag}`)
            }}</span>
            <span v-if="note.shared" class="report-pill" data-flag="shared">{{
              p('flag.shared')
            }}</span>
          </p>
          <p class="report-note__b">{{ note.content }}</p>
        </div>
        <p v-if="card.noteCount > card.notes.length" class="report-fn">
          {{ p('notesShown', { n: card.notes.length }) }}
        </p>
      </template>
      <template v-if="card.requests.length > 0">
        <p class="report-card__sub">{{ p('requests', { n: card.requests.length }) }}</p>
        <div
          v-for="(request, index) in card.requests"
          :key="index"
          class="report-card__req"
          data-testid="detail-request"
        >
          <div class="report-card__reqrow">
            <span>{{ p('end') }}</span>
            <span class="report-mono">{{ request.from }}</span>
            <span aria-label="→">→</span>
            <strong class="report-mono">{{ request.to }}</strong>
            <span class="report-pill" :class="`report-req-${request.status}`">{{
              p(`reqStatus.${request.status}`)
            }}</span>
          </div>
          <span class="report-card__meta">
            {{ p('requestMeta', { by: request.by, at: request.at }) }}
            <template v-if="request.reason">
              · {{ p('reason', { text: request.reason }) }}</template
            >
            <template v-if="request.reviewReason">
              · {{ p('reviewReason', { text: request.reviewReason }) }}</template
            >
          </span>
        </div>
      </template>
      <template v-if="card.files.length > 0">
        <p class="report-card__sub">{{ p('files', { n: card.files.length }) }}</p>
        <ul class="report-card__list">
          <li v-for="(file, index) in card.files" :key="index">
            <span class="report-mono">{{ file.name }}</span>
            <span class="report-card__meta"> — {{ file.meta }}</span>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>
