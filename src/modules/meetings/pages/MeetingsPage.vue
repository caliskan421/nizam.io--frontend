<script setup lang="ts">
import './meetings/meetings.css'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { authSession } from '@/shared/http'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useProgramDepartments } from '@/modules/work/public'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { useMeetings, useDeletedMeetings } from '../api/queries'
import { coordinatorDepartmentIds } from '../model/capabilities'
import { splitMeetings } from '../model/list'
import { useNow } from './meetings/use-now'
import { invalidRange, lensDescription } from './meetings/presentation'
import MeetingHeader from '../components/list/MeetingHeader.vue'
import MeetingList from '../components/list/MeetingList.vue'
import MeetingForm from '../components/forms/MeetingForm.vue'
import DeletedMeetings from '../components/deleted/DeletedMeetings.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const instance = useInstanceStore()
const { standing, programs } = useStanding()
const departments = useProgramDepartments()
const creating = ref(false)
const loadFailure = ref(false)
const loadingAll = ref(false)
let listGeneration = 0
function resetLoad() {
  listGeneration += 1
  loadingAll.value = false
  loadFailure.value = false
}
const stopScope = scope.onChange(() => {
  creating.value = false
  resetLoad()
})
let generation = authSession.generation
let account = authSession.snapshot.accountId
const stopSession = authSession.subscribe((snapshot) => {
  if (generation !== authSession.generation || account !== snapshot.accountId) {
    creating.value = false
    resetLoad()
  }
  generation = authSession.generation
  account = snapshot.accountId
})
onScopeDispose(() => {
  resetLoad()
  stopScope()
  stopSession()
})
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
const invalid = computed(() => invalidRange(route.query.from, route.query.to))
const filters = computed(() => ({
  department_id: value('koordinatorluk') || undefined,
  from: from.value || undefined,
  to: to.value || undefined,
}))
const meetings = useMeetings(filters, () => !invalid.value)
const deleted = useDeletedMeetings(() => admin.value && tab.value === 'silinenler')
const now = useNow()
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const split = computed(() => splitMeetings(meetings.items.value, now.value, timezone.value))
const shown = computed(() => (tab.value === 'gecmis' ? split.value.past : split.value.upcoming))
const lensText = computed(() => lensDescription(scope.lens))
const program = computed(
  () => programs.value?.find((p) => p.programId === scope.programId)?.name ?? '',
)
function saved(id?: string) {
  creating.value = false
  if (id) void router.push({ path: `/toplantilar/${id}`, query: route.query })
}
function update(key: string, next: string) {
  void router.replace({ query: { ...route.query, [key]: next || undefined } })
}
watch(() => [from.value, to.value, value('koordinatorluk'), invalid.value], resetLoad, {
  flush: 'sync',
})
async function loadRemaining() {
  if (loadingAll.value || invalid.value) return
  const started = listGeneration
  loadingAll.value = true
  loadFailure.value = false
  try {
    await meetings.loadAll()
  } catch {
    if (started === listGeneration) loadFailure.value = true
  } finally {
    if (started === listGeneration) loadingAll.value = false
  }
}
watch(
  () => [
    meetings.query.data.value,
    meetings.query.isFetching.value,
    invalid.value,
    loadingAll.value,
  ],
  () => {
    if (
      !invalid.value &&
      !loadFailure.value &&
      !loadingAll.value &&
      meetings.query.hasNextPage.value &&
      !meetings.query.isFetching.value &&
      !meetings.query.isFetchNextPageError.value
    )
      void loadRemaining()
  },
  { immediate: true },
)
</script>

<template>
  <section class="meetings-page">
    <MeetingHeader
      :program="program"
      :upcoming="split.upcoming.length"
      :past="split.past.length"
      :complete="meetings.complete.value"
      :lens-text="lensText"
      :filtered="!!(from || to || value('koordinatorluk'))"
      :can-create="canCreate"
      @create="creating = true"
    />
    <div class="rp-body meetings-body">
      <div class="meetings-toolbar">
        <div class="rp-seg" role="tablist" :aria-label="t('meetings.list.time')">
          <button
            role="tab"
            :aria-selected="tab === 'yaklasan'"
            @click="update('zaman', 'yaklasan')"
          >
            {{ t('meetings.list.upcoming') }} {{ split.upcoming.length
            }}{{ meetings.complete.value ? '' : '+' }}
          </button>
          <button role="tab" :aria-selected="tab === 'gecmis'" @click="update('zaman', 'gecmis')">
            {{ t('meetings.list.past') }} {{ split.past.length
            }}{{ meetings.complete.value ? '' : '+' }}
          </button>
          <button
            v-if="admin"
            role="tab"
            :aria-selected="tab === 'silinenler'"
            :title="t('meetings.list.deletedTitle')"
            @click="update('zaman', 'silinenler')"
          >
            {{ t('meetings.list.deleted') }}
          </button>
        </div>
        <label
          >{{ t('meetings.list.department') }}
          <select
            :value="value('koordinatorluk')"
            @change="update('koordinatorluk', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t('meetings.list.all') }}</option>
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
          >{{ t('meetings.list.from') }}
          <input
            type="date"
            :value="from"
            @change="update('from', ($event.target as HTMLInputElement).value)"
        /></label>
        <label
          >{{ t('meetings.list.to') }}
          <input
            type="date"
            :value="to"
            @change="update('to', ($event.target as HTMLInputElement).value)"
        /></label>
        <span class="rp-cap">{{ t('meetings.list.codeHint') }}</span>
      </div>
      <p v-if="invalid" role="alert">{{ t('meetings.list.invalid') }}</p>
      <DeletedMeetings
        v-else-if="tab === 'silinenler'"
        :items="deleted.data.value?.pages.flatMap((p) => p.items) ?? []"
        @close="update('zaman', 'yaklasan')"
        @refresh="deleted.refetch()"
      />
      <p v-else-if="meetings.query.isPending.value">{{ t('meetings.list.loading') }}</p>
      <div v-else-if="meetings.query.isError.value && !meetings.query.data.value" role="alert">
        {{ t('meetings.list.error') }}
        <button @click="meetings.query.refetch()">{{ t('meetings.list.retry') }}</button>
      </div>
      <template v-else
        ><div v-if="loadFailure || meetings.query.isFetchNextPageError.value" role="alert">
          {{ t('meetings.list.moreError') }}
          <button @click="loadRemaining">
            {{ t('meetings.list.retry') }}
          </button>
        </div>
        <MeetingList
          :items="shown"
          :complete="meetings.complete.value"
          @create="creating = true"
          @open-deleted="update('zaman', 'silinenler')"
          @select="router.push({ path: `/toplantilar/${$event}`, query: route.query })"
        />
        <footer class="meetings-foot">
          <span>{{ t('meetings.list.rule') }}</span
          ><span
            >{{ shown.length }}{{ meetings.complete.value ? '' : '+' }}
            {{
              t(tab === 'gecmis' ? 'meetings.list.footerPast' : 'meetings.list.footerUpcoming', {
                count: `${shown.length}${meetings.complete.value ? '' : '+'}`,
              })
            }}</span
          >
        </footer></template
      >
    </div>
    <MeetingForm
      v-if="creating && canCreate"
      :meeting="null"
      @close="creating = false"
      @saved="saved"
    />
  </section>
</template>
