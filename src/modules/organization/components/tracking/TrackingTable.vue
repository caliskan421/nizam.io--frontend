<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { designStub } from '@/shared/design-stub'
import { UiIcon } from '@/shared/ui'

import { taskLocation } from './assign'
import { trackingText } from './messages'
import {
  dueNote,
  formatDay,
  STATUS_DOT,
  statusLabel,
  type RowGroup,
  type TrackingItem,
} from './model'

/**
 * E-05-59…67 — gruplu görev tablosu (`role="table"`, sıralama yok). Başlık ve "görevi aç" 03
 * paneline gider (`/gorevler?gorev=<id>`). Kısa kod: önek `ProgramDepartment.code` (yoksa yok),
 * sıra numarası statik `—` (BE-005). Kanıt sütunu statik nötr "—" (satır başına dosya okuması
 * yok; `istemci-akislari.md` §7, stub değil). Bitiş: tarih + "gün gecikti" (sunucu) / "gün kaldı".
 */
const props = defineProps<{
  name: string
  groups: readonly RowGroup<TrackingItem>[]
  codes: ReadonlyMap<string, string>
  today: string
  loading: boolean
}>()

function shortCode(departmentId: string): string {
  const code = props.codes.get(departmentId)
  return code ? `${code}-${designStub('BE-005', '—')}` : ''
}

const view = computed(() =>
  props.groups.map((group) => ({
    ...group,
    rows: group.rows.map((item) => ({
      item,
      code: shortCode(item.department_id),
      note: dueNote(item, props.today),
    })),
  })),
)
</script>

<template>
  <div class="rp-dtable">
    <div class="rp-scroll">
      <div
        role="table"
        class="pt-table"
        :aria-label="trackingText('organization.tracking.table.label', { name })"
        :aria-busy="loading ? 'true' : undefined"
      >
        <div role="row" class="rp-tr rp-tr--head">
          <span />
          <span role="columnheader">{{ trackingText('organization.tracking.table.task') }}</span>
          <span role="columnheader">{{
            trackingText('organization.tracking.table.statusHeader')
          }}</span>
          <span role="columnheader">{{ trackingText('organization.tracking.table.due') }}</span>
          <span role="columnheader">{{
            trackingText('organization.tracking.table.evidence')
          }}</span>
          <span />
        </div>
        <template v-if="loading">
          <div v-for="n in 3" :key="n" role="row" class="rp-tr" aria-hidden="true" data-skeleton>
            <span />
            <span class="pt-skel" />
            <span class="pt-skel" />
            <span class="pt-skel" />
            <span />
            <span />
          </div>
        </template>
        <div v-else-if="groups.length === 0" role="row" class="pt-table-empty">
          <p role="cell" class="rp-empty" data-table-empty>
            {{ trackingText('organization.tracking.table.empty') }}
          </p>
        </div>
        <template v-for="group in view" v-else :key="group.key">
          <div role="row" class="rp-trgroup" :data-group="group.key">
            <span role="cell" :class="`pt-group--${group.tone}`">{{ group.name }}</span>
            <span class="rp-count" data-group-count>{{ group.rows.length }}</span>
          </div>
          <div
            v-for="{ item, code, note } in group.rows"
            :key="item.work_item_id"
            role="row"
            class="rp-tr rp-tr--body"
            :data-work-item="item.work_item_id"
          >
            <span class="rp-dot" :class="`rp-dot--${STATUS_DOT[item.status]}`" aria-hidden="true" />
            <span role="cell" class="pt-task">
              <RouterLink class="rp-title rp-trunc" :to="taskLocation(item.work_item_id)">{{
                item.title
              }}</RouterLink>
              <span class="rp-kicker" data-code>{{ code }}</span>
            </span>
            <span role="cell" class="rp-status" :data-status="item.status">
              <span class="rp-trunc">{{ statusLabel(item.status) }}</span>
            </span>
            <span role="cell" class="pt-due">
              <span class="rp-mono">{{ formatDay(item.end_on) }}</span>
              <span
                v-if="note"
                class="pt-due__note rp-nowrap"
                :class="note.tone === 'danger' ? 'rp-danger-text' : 'rp-faint'"
                data-due-note
                >{{ note.text }}</span
              >
            </span>
            <span role="cell" class="rp-mono rp-faint" data-evidence>—</span>
            <span role="cell">
              <RouterLink
                class="t-iconbtn rp-hoveract"
                :to="taskLocation(item.work_item_id)"
                :aria-label="
                  trackingText('organization.tracking.table.open', { title: item.title })
                "
                :title="trackingText('organization.tracking.table.open', { title: item.title })"
              >
                <UiIcon name="chevron-right" size="sm" />
              </RouterLink>
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
