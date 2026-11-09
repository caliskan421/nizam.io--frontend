<script setup lang="ts">
import '../components/program.css'

import { computed, ref, watch } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import type { ProgramOption } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiCard, UiEmptyState, UiErrorState, UiHint } from '@/shared/ui'

import { useProgramList } from '../api'
import DepartmentLinkDialog from '../components/DepartmentLinkDialog.vue'
import ProgramDangerDialog from '../components/ProgramDangerDialog.vue'
import ProgramDepartments from '../components/ProgramDepartments.vue'
import ProgramFormDialog from '../components/ProgramFormDialog.vue'
import ProgramList from '../components/ProgramList.vue'
import TransferHistory from '../components/TransferHistory.vue'
import TransferPanel from '../components/TransferPanel.vue'
import type { DangerMode, DangerTarget } from '../components/use-program-danger'
import { canProgram, programFacts } from '../model/capabilities'
import { programText } from '../model/messages'

/**
 * "Teknofest ve sezon" (`/programlar`, S1; E-00-25, W81). Tuvalde çizilmedi → P3: `shared/ui` ile
 * en sade, kabuk ve 08 ekranlarının görsel diliyle. Yalnız şirket yöneticisi (rota kapısı
 * `ProgramGate`, P1). Program listesi `['programs']` (kabukla aynı önbellek); seçili programa bağlı
 * bölümler (departmanlar, aktarım kaynağı) kapsam seçiliyken. Seçili program değişince açık
 * pencereler kapanır (K2). "Sezona kopyala" (yapı kopyası) ucu yok → eylem kurulmaz (P17).
 */
const store = useScopeStore()
const { standing } = useStanding()
const list = useProgramList()
const collator = new Intl.Collator('tr-TR')

const facts = computed(() => programFacts(standing.value))
const canCreate = computed(() => canProgram('createProgram', facts.value))
const canEdit = computed(() => canProgram('updateProgram', facts.value))
const canLink = computed(() => canProgram('linkDepartment', facts.value))
const canTransfer = computed(() => canProgram('transfer', facts.value))

const programs = computed(() =>
  [...list.programs.value].sort((a, b) => collator.compare(a.name, b.name)),
)
const currentName = computed(
  () => programs.value.find((p) => p.programId === store.programId)?.name ?? '',
)
const loadError = computed(() =>
  list.query.isError.value && programs.value.length === 0
    ? toApiError(list.query.error.value)
    : null,
)
const ready = computed(() => list.query.isSuccess.value)
const countText = computed(() =>
  programText(list.truncated.value ? 'page.countTruncated' : 'page.count', {
    n: programs.value.length,
  }),
)

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const dangerOpen = ref(false)
const dangerMode = ref<DangerMode>('delete')
const dangerTarget = ref<DangerTarget | null>(null)
const linkOpen = ref(false)

watch(
  () => store.programId,
  () => {
    linkOpen.value = false
  },
)

function openCreate(): void {
  editingId.value = null
  formOpen.value = true
}

function openEdit(programId: string): void {
  editingId.value = programId
  formOpen.value = true
}

function openDanger(mode: DangerMode, program: ProgramOption): void {
  dangerMode.value = mode
  dangerTarget.value = { programId: program.programId, name: program.name }
  dangerOpen.value = true
}
</script>

<template>
  <section class="pg-page" data-testid="programs-page">
    <div class="rp-head">
      <div>
        <h1 class="rp-h1">{{ programText('page.title') }}</h1>
        <p class="rp-sub" data-testid="pg-sub">
          {{ programText('page.sub') }}<template v-if="ready"> · {{ countText }}</template>
        </p>
      </div>
      <div class="rp-actions">
        <UiButton
          v-if="canCreate"
          variant="primary"
          icon="plus"
          data-testid="pg-create"
          @click="openCreate"
        >
          {{ programText('page.create') }}
        </UiButton>
      </div>
    </div>
    <div class="rp-body">
      <UiErrorState
        v-if="loadError"
        :error="loadError"
        :title="programText('page.loadError')"
        retryable
        :retrying="list.query.isFetching.value"
        @retry="list.query.refetch()"
      />
      <UiHint v-else-if="!ready">{{ programText('page.loading') }}</UiHint>
      <UiEmptyState
        v-else-if="programs.length === 0"
        icon="season"
        :title="programText('page.empty')"
        :text="programText('page.emptyText')"
        data-testid="pg-empty"
      >
        <template v-if="canCreate" #action>
          <UiButton variant="primary" size="sm" icon="plus" @click="openCreate">
            {{ programText('page.create') }}
          </UiButton>
        </template>
      </UiEmptyState>
      <template v-else>
        <div class="pg-col">
          <UiCard class="pg-card" :title="programText('list.region')">
            <ProgramList
              :programs="programs"
              :current-id="store.programId"
              :can-edit="canEdit"
              @select="store.setProgram($event)"
              @edit="openEdit"
              @reset="openDanger('reset', $event)"
              @delete="openDanger('delete', $event)"
            />
          </UiCard>
          <ProgramDepartments :can-link="canLink" @link="linkOpen = true" />
        </div>
        <div v-if="canTransfer" class="pg-col">
          <TransferPanel :programs="programs" />
          <TransferHistory :programs="programs" />
        </div>
      </template>
    </div>
    <ProgramFormDialog v-model:open="formOpen" :program-id="editingId" />
    <ProgramDangerDialog v-model:open="dangerOpen" :mode="dangerMode" :target="dangerTarget" />
    <DepartmentLinkDialog v-model:open="linkOpen" :program-name="currentName" />
  </section>
</template>
