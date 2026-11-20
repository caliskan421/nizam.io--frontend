<script setup lang="ts">
import './memory.css'

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { UiButton, UiErrorState } from '@/shared/ui'

import ExperienceCreate from '../components/ExperienceCreate.vue'
import ExperienceDetail from '../components/ExperienceDetail.vue'
import MemoryNotes from '../components/MemoryNotes.vue'
import { useMemoryQueries } from '../model/queries'
import { AREAS, STATUSES, type Experience, type Source } from '../model/types'

const route = useRoute()
const router = useRouter()
const tab = ref<'experiences' | 'notes'>('experiences')
const selected = ref<string | null>(null)
const opening = ref<{ source?: Source; label?: string; unit?: string } | null>(null)
const queries = useMemoryQueries()
const status = ref<Experience['status'] | ''>('')
const area = ref<Experience['area'] | ''>('')
const event = ref('')
const mine = ref(false)
const text = ref('')
const q = ref('')
const results = queries.experiences(
  () => ({
    status: status.value || undefined,
    area: area.value || undefined,
    event_program_id: event.value || undefined,
    mine_departments: mine.value ? 'true' : undefined,
    q: q.value || undefined,
    limit: 30,
  }),
  () => tab.value === 'experiences',
)
const pages = computed(() => (results.isError.value ? [] : (results.data.value?.pages ?? [])))
const facets = computed(() => pages.value[0]?.facets)
const entries = computed(() => {
  const groups = new Map<string, { label: string; rows: Experience[] }>()
  for (const item of pages.value.flatMap((page) => page.items)) {
    const group = groups.get(item.event.program_id)
    if (group) group.rows.push(item)
    else groups.set(item.event.program_id, { label: item.event.label, rows: [item] })
  }
  return groups
})

function open(id: string) {
  opening.value = null
  selected.value = id
}
function clearSelection() {
  selected.value = null
  if (route.query.deneyim) void router.replace({ query: {} })
}
watch(
  () => route.query.deneyim,
  (value) => {
    if (typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)) open(value)
  },
  { immediate: true },
)

function create(source?: Source, label?: string, unit?: string) {
  clearSelection()
  opening.value = { source, label, unit }
}
function changeTab(next: typeof tab.value) {
  tab.value = next
  clearSelection()
  opening.value = null
}
watch(
  [queries.scope.program, queries.scope.audience, () => queries.scope.store.snapshot],
  (_, previous) => {
    if (!previous[0]) return
    changeTab('experiences')
    status.value = ''
    area.value = ''
    event.value = ''
    q.value = text.value = ''
    mine.value = false
  },
)
</script>

<template>
  <section class="memory-page">
    <header class="memory-head">
      <div>
        <h1>Kurumsal hafıza</h1>
        <p>Geçmiş deneyimleri, etkilerini ve sonraki ekipler için önerileri bulun.</p>
      </div>
      <UiButton v-if="queries.scope.program.value" icon="plus" variant="primary" @click="create()"
        >Deneyim kaydet</UiButton
      >
    </header>
    <div class="memory-content">
      <p v-if="!queries.scope.program.value" role="status">
        Kurumsal hafızayı açmak için erişebildiğiniz bir program seçin.
      </p>
      <template v-else>
        <div class="memory-controls" role="group" aria-label="Kurumsal hafıza bölümleri">
          <UiButton :aria-pressed="tab === 'experiences'" @click="changeTab('experiences')"
            >Deneyimler</UiButton
          >
          <UiButton :aria-pressed="tab === 'notes'" @click="changeTab('notes')"
            >Tüm notlar</UiButton
          >
        </div>
        <div class="memory-layout" :data-aside="tab === 'experiences' || !!selected || !!opening">
          <MemoryNotes v-if="tab === 'notes'" @create="create" @detail="open" />
          <section v-else class="memory-list" aria-label="Deneyimler">
            <ol class="memory-steps">
              <li><strong>Kaydet</strong><span>Ne yaşandığını ve etkisini yaz.</span></li>
              <li><strong>Öner</strong><span>Bir dahaki ekip için çözüm ekle.</span></li>
              <li><strong>Uygula</strong><span>Öneriyi plana al ve sonucu izle.</span></li>
            </ol>
            <div class="memory-controls" role="group" aria-label="Durum">
              <UiButton size="sm" :aria-pressed="status === ''" @click="status = ''"
                >Tümü {{ facets ? '(' + facets.total + ')' : '' }}</UiButton
              >
              <UiButton
                v-for="(label, key) in STATUSES"
                :key="key"
                size="sm"
                :aria-pressed="status === key"
                @click="status = key"
                >{{ label }} {{ facets ? '(' + (facets.by_status[key] ?? 0) + ')' : '' }}</UiButton
              >
            </div>
            <div class="memory-controls">
              <select v-model="area" class="t-select" aria-label="Alan">
                <option value="">Tüm alanlar</option>
                <option v-for="(label, key) in AREAS" :key="key" :value="key">
                  {{ label }} {{ facets ? '(' + (facets.by_area[key] ?? 0) + ')' : '' }}
                </option>
              </select>
              <select v-model="event" class="t-select" aria-label="Etkinlik">
                <option value="">Tüm etkinlikler</option>
                <option
                  v-for="entry in facets?.by_event ?? []"
                  :key="entry.program_id"
                  :value="entry.program_id"
                >
                  {{ entry.label }} ({{ entry.count }})
                </option>
              </select>
              <UiButton
                v-if="!queries.scope.admin.value"
                size="sm"
                :aria-pressed="mine"
                @click="mine = !mine"
                >Yalnız birimlerim</UiButton
              >
              <form class="memory-controls" @submit.prevent="q = text.trim()">
                <input
                  v-model="text"
                  type="search"
                  maxlength="200"
                  class="t-input"
                  aria-label="Deneyim ara"
                  placeholder="Deneyim ara"
                /><UiButton size="sm" type="submit">Ara</UiButton>
              </form>
            </div>
            <p v-if="results.isPending.value" role="status">Deneyimler yükleniyor…</p>
            <UiErrorState
              v-else-if="results.error.value"
              :error="toApiError(results.error.value)"
              title="Deneyimler alınamadı"
              retryable
              @retry="results.refetch()"
            />
            <p v-else-if="!entries.size">Bu filtrelere uyan deneyim yok.</p>
            <section v-for="[id, group] in entries" :key="id" class="memory-list">
              <h2 class="memory-meta">{{ group.label }}</h2>
              <button
                v-for="item in group.rows"
                :key="item.id"
                type="button"
                class="t-card memory-record"
                :aria-pressed="selected === item.id"
                @click="open(item.id)"
              >
                <span class="memory-meta"
                  >{{ AREAS[item.area] }} · {{ STATUSES[item.status] }}</span
                >
                <strong>{{ item.title }}</strong
                ><span>{{ item.suggestion || 'Henüz öneri yok' }}</span>
                <span class="memory-meta"
                  >{{ item.department.name }} ·
                  {{ item.author.full_name || 'Silinmiş kullanıcı' }} ·
                  {{ item.endorsement_count }} kişi de yaşadı</span
                >
              </button>
            </section>
            <UiButton
              v-if="results.hasNextPage.value"
              size="sm"
              :disabled="results.isFetchingNextPage.value"
              @click="results.fetchNextPage()"
              >Daha fazla deneyim</UiButton
            >
          </section>
          <aside v-if="tab === 'experiences' || selected || opening" class="memory-aside">
            <ExperienceCreate
              v-if="opening"
              :source="opening.source"
              :source-label="opening.label"
              :default-unit="opening.unit"
              @close="opening = null"
              @saved="open"
            />
            <ExperienceDetail
              v-else-if="selected"
              :id="selected"
              :key="selected"
              @close="clearSelection"
              @notes="changeTab('notes')"
            />
            <article v-else class="t-card memory-panel">
              <h2>İyi bir deneyim kaydı</h2>
              <ul>
                <li><strong>Ne yaşadık?</strong> Somut olarak anlatın.</li>
                <li><strong>Etkisi ne oldu?</strong> Süre, kişi veya maliyet belirtin.</li>
                <li><strong>Önerimiz ne?</strong> Bir sonraki ekip için çözüm yazın.</li>
              </ul>
              <UiButton size="sm" @click="create()">Deneyim kaydet</UiButton>
            </article>
          </aside>
        </div>
      </template>
    </div>
  </section>
</template>
