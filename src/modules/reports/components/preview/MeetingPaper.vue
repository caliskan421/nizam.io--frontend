<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import { instantDate, instantTime, upper } from '../../model/format'
import {
  agendaRows,
  convertedRows,
  coordinatorships,
  noteRows,
  participantNames,
} from '../../model/meeting-view'
import type { PaperContext } from '../../model/paper-context'
import type { ReportMeetingDetail } from '../../model/types'
import { t } from '../text'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'

/**
 * 01g toplantı raporu kâğıdı (E-13-48…53): künye (tarih + başlangıç saati; bitiş saati YOK),
 * katılımcılar + "üyeler dahil" rozeti, gündem (salt okunur onay kutuları), not akışı, "Göreve
 * dönüştürülenler" tablosu (NOT · GÖREV; DURUM sütunu gizli, alan yok; dönüştürülen yoksa tablo
 * çizilmez). Görev kodu gizli (BE-005); not yazarı çizilmez. "Sayfa 1 / 1" yok.
 */
const props = defineProps<{ ctx: PaperContext; detail: ReportMeetingDetail }>()

const m = computed(() => props.detail.meeting)
const day = computed(() => instantDate(m.value.meeting_date, props.ctx.timeZone) ?? '')
const time = computed(() => instantTime(m.value.meeting_date, props.ctx.timeZone) ?? '')
const agenda = computed(() => agendaRows(props.detail))
const notes = computed(() => noteRows(props.detail, props.ctx.timeZone))
const converted = computed(() => convertedRows(notes.value))
const departments = computed(() => coordinatorships(props.detail))
const names = computed(() => participantNames(props.detail))
const deletedText = t('reports.meeting.paper.deleted')
const departmentText = computed(() =>
  departments.value.map((d) => (d.deleted ? `${d.name} ${deletedText}` : d.name)).join(' · '),
)
</script>

<template>
  <PaperFrame
    id="report-meeting-paper"
    :label="t('reports.meeting.title')"
    :ctx="ctx"
    :strip="t('reports.meeting.paper.strip', { title: upper(m.title) })"
    :strip-right="day"
    :foot-left="departmentText || ctx.program"
  >
    <header class="report-band report-meeting-band" data-theme="dark">
      <div>
        <p class="report-kicker">
          {{ t('reports.meeting.paper.kicker', { program: ctx.programUpper }) }}
        </p>
        <span class="report-accent" aria-hidden="true" />
        <h2 class="report-band__title">{{ upper(m.title) }}</h2>
        <p class="report-band__sub">{{ day }}{{ time ? ` · ${time}` : '' }}</p>
      </div>
      <span class="report-logo report-logo--md" aria-hidden="true">{{ ctx.mark }}</span>
    </header>
    <dl class="report-kunye" data-testid="meeting-kunye">
      <dt>{{ t('reports.meeting.paper.date') }}</dt>
      <dd>{{ day }}</dd>
      <dt>{{ t('reports.meeting.paper.coordinatorships') }}</dt>
      <dd>{{ departmentText }}</dd>
      <dt>{{ t('reports.meeting.paper.creator') }}</dt>
      <dd>{{ m.created_by.full_name }}</dd>
    </dl>
    <p class="report-people">
      <span>{{
        t('reports.meeting.paper.participants', { n: m.participant_count, names: names.join(', ') })
      }}</span>
      <span v-if="m.members_included" class="report-pill report-pill--violet">{{
        t('reports.meeting.paper.membersIncluded')
      }}</span>
    </p>
    <section class="report-section" aria-labelledby="report-mt-agenda">
      <PaperHeading
        id="report-mt-agenda"
        :title="t('reports.meeting.paper.agenda')"
        :aside="
          t('reports.meeting.paper.agendaProgress', { a: agenda.checked, b: agenda.rows.length })
        "
      />
      <p v-if="agenda.rows.length === 0" class="report-emptyline">
        {{ t('reports.meeting.paper.agendaEmpty') }}
      </p>
      <div
        v-for="row in agenda.rows"
        :key="row.no"
        class="report-agenda"
        :class="{ 'report-agenda--off': !row.checked }"
        data-testid="agenda-row"
      >
        <span class="t-checkwrap">
          <input
            class="t-check"
            type="checkbox"
            :checked="row.checked"
            disabled
            :aria-label="row.title"
          />
          <svg class="t-check__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 12.5 4 4 8-9" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="report-agenda__n">{{ row.no }}</span>
        <span>{{ row.title }}</span>
      </div>
    </section>
    <section class="report-section" aria-labelledby="report-mt-notes">
      <PaperHeading
        id="report-mt-notes"
        :title="t('reports.meeting.paper.notes')"
        :aside="t('reports.meeting.paper.notesTotal', { n: notes.length })"
      />
      <p v-if="notes.length === 0" class="report-emptyline">
        {{ t('reports.meeting.paper.notesEmpty') }}
      </p>
      <div class="report-notes">
        <article v-for="note in notes" :key="note.id" class="report-note" data-testid="note-row">
          <h3 class="report-note__h">
            {{ t('reports.meeting.paper.note', { no: note.no, time: note.time })
            }}<em v-if="note.converted">{{ t('reports.meeting.paper.converted') }}</em>
          </h3>
          <p class="report-note__b">{{ note.content }}</p>
          <p v-if="note.converted && note.taskTitle" class="report-note__t">
            {{ t('reports.meeting.paper.convertedTo', { title: note.taskTitle }) }}
          </p>
        </article>
      </div>
    </section>
    <section v-if="converted.length > 0" class="report-section" aria-labelledby="report-mt-conv">
      <PaperHeading
        id="report-mt-conv"
        :title="t('reports.meeting.paper.convertedList')"
        :aside="t('reports.meeting.paper.convertedCount', { n: converted.length })"
      />
      <div
        class="report-table report-cols-converted"
        role="table"
        :aria-label="t('reports.meeting.paper.convertedLabel')"
      >
        <div class="report-tr report-tr--head" role="row">
          <span role="columnheader">{{ t('reports.meeting.paper.noteCol') }}</span>
          <span role="columnheader">{{ t('reports.meeting.paper.taskCol') }}</span>
        </div>
        <div
          v-for="(row, index) in converted"
          :key="row.id"
          class="report-tr"
          :class="{ 'report-tr--zebra': index % 2 === 1 }"
          role="row"
        >
          <span class="report-mono" role="cell">Not {{ row.no }}</span>
          <span role="cell">{{ row.taskTitle ?? t('reports.meeting.paper.taskGone') }}</span>
        </div>
      </div>
    </section>
  </PaperFrame>
</template>
