<script setup lang="ts">
import '../components/audit.css'

import { computed } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useInstanceStore } from '@/shared/instance/store'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { UiButton, UiErrorState, UiField, UiInput } from '@/shared/ui'

import { useAuditActions, useAuditEntries, useAuditSummary } from '../api/queries'
import AuditFacet from '../components/AuditFacet.vue'
import AuditRows from '../components/AuditRows.vue'
import AuditStrip from '../components/AuditStrip.vue'
import { useAuditFacets } from '../components/use-audit-facets'
import { useAuditExport } from '../components/use-audit-export'
import { useAuditScope } from '../model/access'
import { useAuditFilters } from '../model/filters'
import { auditDay, shiftDay } from '../model/format'

const scope = useAuditScope()
const instance = useInstanceStore()
const zone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const form = useAuditFilters(
  () => scope.programId.value,
  () => zone.value,
)
const list = useAuditEntries(() => form.query.value)
const summary = useAuditSummary(() => form.query.value)
const actions = useAuditActions(() => !!form.query.value)
const exporter = useAuditExport(() => form.query.value)
const departments = useProgramDepartments(
  () => !!scope.programId.value && !!scope.standing.value?.companyAdmin,
)
const rows = computed(() =>
  list.isError.value ? [] : (list.data.value?.pages.flatMap((page) => page.entries) ?? []),
)
const totals = computed(() =>
  summary.isError.value || list.isError.value ? undefined : summary.data.value,
)
const selected = form.selected
const query = form.query
const search = form.search
const searchSize = computed(() => [...search.value.trim()].length)
const searchError = computed(() =>
  searchSize.value === 1 || searchSize.value > 100 ? 'Arama 2–100 karakter olmalıdır.' : undefined,
)
const ranges = [
  { label: 'Bugün', key: 'today', days: 1 },
  { label: 'Son 7 gün', key: 'last_7_days', days: 7 },
  { label: 'Son 30 gün', key: 'last_30_days', days: 30 },
  { label: 'Tümü', key: 'all', days: 0 },
]

function departmentLabel(id: string | null): string {
  if (!id || id === 'none') return 'Bağlı değil'
  return (
    departments.byId.value.get(id)?.display_name ??
    scope.standing.value?.rows.find(
      (row) => row.programId === scope.programId.value && row.departmentId === id,
    )?.displayName ??
    'Adı bilinmeyen koordinatörlük'
  )
}

const facets = useAuditFacets(totals, actions.data, selected, departmentLabel)

function selectRange(days: number): void {
  const today = auditDay(new Date(), zone.value)
  form.update(
    days ? { from: shiftDay(today, 1 - days), to: today } : { from: undefined, to: undefined },
  )
}

function setDay(key: 'from' | 'to', event: Event): void {
  const value = (event.target as HTMLInputElement).value
  form.update({ [key]: value || undefined })
}
</script>

<template>
  <section class="audit-page">
    <header class="rp-head">
      <div>
        <h1 class="rp-h1">İşlem geçmişi</h1>
        <p class="rp-sub">Seçili programda erişebildiğiniz işlem kayıtları.</p>
      </div>
      <UiButton
        icon="download"
        :disabled="!query || list.isError.value || exporter.busy.value || exporter.waiting.value"
        @click="exporter.start"
      >
        {{ exporter.busy.value ? 'CSV hazırlanıyor…' : 'CSV indir' }}
      </UiButton>
    </header>
    <div class="audit-page__body">
      <p class="rp-cap" role="status" aria-live="polite">{{ exporter.status.value }}</p>
      <p v-if="!scope.programId.value" class="rp-cap" role="status">
        {{
          scope.status.value === 'loading'
            ? 'Erişim kontrol ediliyor…'
            : 'İşlem geçmişi için erişilebilir bir program seçin.'
        }}
      </p>
      <template v-else>
        <AuditStrip
          v-if="totals"
          :days="totals.activity_30d"
          :from="selected.from"
          :to="selected.to"
          @day="form.chooseDay"
        />
        <UiErrorState
          v-else-if="summary.isError.value && !list.isError.value"
          title="Etkinlik özeti yüklenemedi"
          :error="toApiError(summary.error.value)"
          retryable
          :retrying="summary.isFetching.value"
          @retry="summary.refetch()"
        />
        <div class="audit-ranges">
          <UiButton
            v-for="range in ranges"
            :key="range.key"
            size="sm"
            @click="selectRange(range.days)"
          >
            {{ range.label }}
            <span v-if="totals">{{
              totals.facets.range.find((row) => row.key === range.key)?.count ?? '—'
            }}</span>
          </UiButton>
          <label
            ><span>Başlangıç</span
            ><input
              class="t-input"
              type="date"
              :value="selected.from"
              @change="setDay('from', $event)"
          /></label>
          <label
            ><span>Bitiş</span
            ><input class="t-input" type="date" :value="selected.to" @change="setDay('to', $event)"
          /></label>
        </div>
        <div class="audit-filters">
          <AuditFacet
            v-for="facet in facets"
            :key="facet.key"
            :label="facet.name"
            :options="facet.options"
            :selected="facet.chosen"
            @toggle="form.toggle(facet.key, facet.chosen, $event)"
          />
          <form
            class="audit-search"
            @submit.prevent="!searchError && form.update({ q: search.trim() || undefined })"
          >
            <UiField label="Kayıtlarda ara" :error="searchError">
              <UiInput v-model="search" type="search" placeholder="Kişi veya görev adı" />
            </UiField>
            <UiButton type="submit" size="sm">Ara</UiButton>
          </form>
        </div>
        <div class="audit-chips">
          <UiButton
            v-if="selected.from || selected.to"
            size="sm"
            variant="ghost"
            icon="close"
            @click="selectRange(0)"
            >{{ selected.from || '…' }} – {{ selected.to || '…' }}</UiButton
          >
          <UiButton
            v-if="selected.q"
            size="sm"
            variant="ghost"
            icon="close"
            @click="form.update({ q: undefined })"
            >{{ selected.q }}</UiButton
          >
          <template v-for="facet in facets" :key="facet.key">
            <UiButton
              v-for="value in facet.chosen"
              :key="value"
              size="sm"
              variant="ghost"
              icon="close"
              @click="form.toggle(facet.key, facet.chosen, value)"
            >
              {{ facet.options.find((option) => option.value === value)?.label ?? facet.name }}
            </UiButton>
          </template>
          <UiButton size="sm" variant="ghost" @click="form.clear">Süzgeçleri temizle</UiButton>
        </div>
        <p v-if="form.invalid.value" role="alert">Tarih aralığını ve arama metnini kontrol edin.</p>
        <UiErrorState
          v-else-if="list.isError.value"
          :error="toApiError(list.error.value)"
          retryable
          :retrying="list.isFetching.value"
          @retry="list.refetch()"
        />
        <p v-else-if="list.isPending.value" role="status">İşlem geçmişi yükleniyor…</p>
        <p v-else-if="rows.length === 0" class="rp-empty">Bu filtrelerle eşleşen kayıt yok.</p>
        <AuditRows
          v-else
          :rows="rows"
          :zone="zone"
          :department="departmentLabel"
          :show-client="!!scope.standing.value?.companyAdmin"
        />
        <footer v-if="rows.length" class="audit-list-footer">
          <span class="rp-cap"
            >{{ rows.length }} kayıt gösteriliyor<span v-if="totals">
              / {{ totals.total_matched }}</span
            ></span
          >
          <UiButton
            v-if="list.hasNextPage.value"
            size="sm"
            :disabled="list.isFetchingNextPage.value"
            @click="list.fetchNextPage()"
            >Daha fazla göster</UiButton
          >
        </footer>
        <p class="rp-cap">Denetim kayıtları kullanıcılar tarafından değiştirilemez.</p>
      </template>
    </div>
  </section>
</template>
