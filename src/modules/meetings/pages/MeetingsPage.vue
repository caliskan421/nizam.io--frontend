<script setup lang="ts">
import './meetings/meetings.css'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgramDepartments } from '@/modules/work/public'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { useMeetings, useDeletedMeetings } from '../api/queries'
import { coordinatorDepartmentIds } from '../model/capabilities'
import { splitMeetings } from '../model/list'
import MeetingList from '../components/list/MeetingList.vue'
import MeetingForm from '../components/forms/MeetingForm.vue'
import DeletedMeetings from '../components/deleted/DeletedMeetings.vue'

const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const instance = useInstanceStore()
const { standing, programs } = useStanding()
const departments = useProgramDepartments()
const creating = ref(false)
const admin = computed(() => standing.value?.companyAdmin === true)
const canCreate = computed(
  () => admin.value || coordinatorDepartmentIds(standing.value, scope.programId).length > 0,
)
const tab = computed(() =>
  route.query.zaman === 'gecmis'
    ? 'gecmis'
    : route.query.zaman === 'silinenler' && admin.value
      ? 'silinenler'
      : 'yaklasan',
)
const value = (key: string) => (typeof route.query[key] === 'string' ? route.query[key] : '')
const from = computed(() => value('from'))
const to = computed(() => value('to'))
const validDate = (date: string) =>
  !date ||
  (/^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date)
const invalid = computed(
  () =>
    !validDate(from.value) ||
    !validDate(to.value) ||
    (!!from.value && !!to.value && from.value > to.value),
)
const filters = computed(() => ({
  department_id: value('koordinatorluk') || undefined,
  from: from.value || undefined,
  to: to.value || undefined,
}))
const meetings = useMeetings(filters, () => !invalid.value)
const deleted = useDeletedMeetings(() => admin.value && tab.value === 'silinenler')
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const split = computed(() => splitMeetings(meetings.items.value, new Date(), timezone.value))
const shown = computed(() => (tab.value === 'gecmis' ? split.value.past : split.value.upcoming))
const program = computed(
  () => programs.value?.find((p) => p.programId === scope.programId)?.name ?? '',
)
function update(key: string, next: string) {
  void router.replace({ query: { ...route.query, [key]: next || undefined } })
}
watch(
  () => [meetings.query.data.value, meetings.query.isFetching.value, invalid.value],
  () => {
    if (!invalid.value && meetings.query.hasNextPage.value && !meetings.query.isFetching.value)
      void meetings.loadAll().catch(() => {})
  },
  { immediate: true },
)
</script>

<template>
  <section class="meetings-page">
    <header class="rp-head">
      <div>
        <h1 class="rp-h1">Toplantılar</h1>
        <p class="rp-sub">
          {{ program }} · {{ meetings.complete.value ? '' : 'En az '
          }}{{ split.upcoming.length }} yaklaşan, {{ split.past.length }} geçmiş toplantı
        </p>
      </div>
      <button v-if="canCreate" class="t-btn t-btn--primary" @click="creating = true">
        Yeni toplantı
      </button>
    </header>
    <div class="rp-body meetings-body">
      <div class="meetings-toolbar">
        <div class="rp-seg" role="tablist" aria-label="Toplantı zamanı">
          <button
            role="tab"
            :aria-selected="tab === 'yaklasan'"
            @click="update('zaman', 'yaklasan')"
          >
            Yaklaşan {{ split.upcoming.length }}{{ meetings.complete.value ? '' : '+' }}
          </button>
          <button role="tab" :aria-selected="tab === 'gecmis'" @click="update('zaman', 'gecmis')">
            Geçmiş {{ split.past.length }}{{ meetings.complete.value ? '' : '+' }}
          </button>
          <button
            v-if="admin"
            role="tab"
            :aria-selected="tab === 'silinenler'"
            title="Yalnız yönetici görebilir"
            @click="update('zaman', 'silinenler')"
          >
            Silinenler
          </button>
        </div>
        <label
          >Koordinatörlük
          <select
            :value="value('koordinatorluk')"
            @change="update('koordinatorluk', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Tümü</option>
            <option
              v-for="department in departments.query.data.value?.departments ?? []"
              :key="department.department_id"
              :value="department.department_id"
            >
              {{ department.display_name }}
            </option>
          </select></label
        >
        <label
          >Başlangıç
          <input
            type="date"
            :value="from"
            @change="update('from', ($event.target as HTMLInputElement).value)"
        /></label>
        <label
          >Bitiş
          <input
            type="date"
            :value="to"
            @change="update('to', ($event.target as HTMLInputElement).value)"
        /></label>
        <span class="rp-cap">Koyu kod sahip koordinatörlüğü gösterir</span>
      </div>
      <p v-if="invalid" role="alert">Başlangıç tarihi bitiş tarihinden sonra olamaz.</p>
      <DeletedMeetings
        v-else-if="tab === 'silinenler'"
        :items="deleted.data.value?.pages.flatMap((p) => p.items) ?? []"
        @close="update('zaman', 'yaklasan')"
        @refresh="deleted.refetch()"
      />
      <p v-else-if="meetings.query.isPending.value">Toplantılar yükleniyor…</p>
      <div v-else-if="meetings.query.isError.value" role="alert">
        Toplantılar yüklenemedi. <button @click="meetings.query.refetch()">Yeniden dene</button>
      </div>
      <template v-else
        ><MeetingList
          :items="shown"
          :complete="meetings.complete.value"
          @create="creating = true"
          @open-deleted="update('zaman', 'silinenler')"
          @select="router.push(`/toplantilar/${$event}`)"
        />
        <footer class="meetings-foot">
          <span>Bugünden önceki günlere toplantı açılamaz.</span
          ><span
            >{{ shown.length }}{{ meetings.complete.value ? '' : '+' }}
            {{ tab === 'gecmis' ? 'geçmiş' : 'yaklaşan' }} toplantı</span
          >
        </footer></template
      >
    </div>
    <MeetingForm
      v-if="creating && canCreate"
      :meeting="null"
      @close="creating = false"
      @saved="creating = false"
    />
  </section>
</template>
