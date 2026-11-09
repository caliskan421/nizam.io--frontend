<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { canCreateWorkItem } from '@/modules/work/public'
import type { TeamRole } from '@/shared/scope/standing-facts'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiAvatar, UiBadge, UiButton, UiField, UiModal, UiSelect } from '@/shared/ui'

import { usersPanelLocation } from '../../routes'
import { newTaskLocation, type PersonUnit } from './assign'
import { trackingText } from './messages'

/**
 * E-05-41…48 — profil başlığı. Ad E-05-40 kaynağından (yüklenirken iskelet); rol rozeti seçili
 * programdaki roller (ilk + "+n", Admin yok; K1 yalnız gösterim); alt satır birim adları, e-posta
 * yok (BE-041). Eylemler: "Profili düzenle" → 05 yan paneli (`?secili=`, P15); "Mesaj" (F7) ve
 * "Kişisel rapor" (F6) açıklamalı devre dışı (P2, stub yok); "Görev ata" work
 * `canCreateWorkItem` ile görünür, hedef koordinatörlük AÇIK seçilir (kişinin birimleri; tekse
 * doğrudan) ve Görevler ekranının yeni görev girişine gider. Kapsam değişince seçici kapanır.
 */
const props = defineProps<{
  accountId: string
  name: string | null
  resolved: boolean
  roles: readonly TeamRole[]
  /** Seçili programdaki birimler; kişi okunamadıysa `null`. */
  units: readonly PersonUnit[] | null
}>()

const router = useRouter()
const store = useScopeStore()
const { standing } = useStanding()

const displayName = computed(
  () => props.name ?? (props.resolved ? trackingText('userTracking.unknownPerson') : null),
)
const roleLabels = computed(() =>
  props.roles.map((role) => trackingText(`userTracking.head.role.${role}`)),
)
const subtitle = computed(() => {
  const units = props.units
  if (units === null) return null
  if (units.length === 0) return trackingText('userTracking.head.unassigned')
  if (units.length === 1) return units[0]!.name
  return trackingText('userTracking.head.moreUnits', {
    first: units[0]!.name,
    n: units.length - 1,
  })
})

const phases = computed(() =>
  (
    [
      ['message', 'F7'],
      ['report', 'F6'],
    ] as const
  ).map(([key, phase]) => {
    const label = trackingText(`userTracking.head.${key}`)
    return {
      key,
      label,
      note: trackingText('userTracking.head.phaseNote', {
        label,
        phase: trackingText(`userTracking.head.phase.${phase}`),
      }),
    }
  }),
)

const canAssign = computed(() => canCreateWorkItem(standing.value, store.programId))
const assignBlocked = computed(() => {
  if (props.units === null) return trackingText('userTracking.assign.unknownUnits')
  if (props.units.length === 0) return trackingText('userTracking.assign.noUnits')
  return null
})

const picking = ref(false)
const chosen = ref('')
const error = ref<string | undefined>(undefined)
const options = computed(() =>
  (props.units ?? []).map((u) => ({ value: u.departmentId, label: u.name })),
)

function assign(): void {
  const units = props.units ?? []
  if (units.length === 0) return
  if (units.length === 1) {
    void router.push(newTaskLocation(units[0]!.departmentId))
    return
  }
  chosen.value = ''
  error.value = undefined
  picking.value = true
}

function confirmPick(): void {
  if (!options.value.some((o) => o.value === chosen.value)) {
    error.value = trackingText('userTracking.assign.required')
    return
  }
  picking.value = false
  void router.push(newTaskLocation(chosen.value))
}

onScopeDispose(store.onChange(() => (picking.value = false)))
</script>

<template>
  <div class="rp-head">
    <div class="pt-who">
      <UiAvatar v-if="displayName" class="pt-avatar" :name="displayName" size="xl" data-avatar />
      <span v-else class="rp-av rp-av--xl pt-avatar--blank" aria-hidden="true" />
      <div class="pt-namebox">
        <div class="pt-name">
          <h1 v-if="displayName" class="rp-h1 rp-trunc" data-person-name>{{ displayName }}</h1>
          <span v-else class="pt-skel pt-skel--name" aria-hidden="true" data-name-skeleton />
          <UiBadge
            v-if="roleLabels.length > 0"
            class="pt-role"
            :title="roleLabels.slice(1).join(', ') || undefined"
            data-role
            >{{ roleLabels[0]
            }}{{
              roleLabels.length > 1
                ? ` ${trackingText('userTracking.head.moreRoles', { n: roleLabels.length - 1 })}`
                : ''
            }}</UiBadge
          >
        </div>
        <p v-if="subtitle" class="rp-sub rp-trunc" data-units>{{ subtitle }}</p>
      </div>
    </div>
    <div class="rp-actions">
      <RouterLink
        class="t-iconbtn t-iconbtn--md"
        :to="usersPanelLocation(accountId)"
        :aria-label="trackingText('userTracking.head.editProfile')"
        :title="trackingText('userTracking.head.editProfile')"
        data-edit-profile
      >
        <svg class="t-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />
        </svg>
      </RouterLink>
      <button
        v-for="phase in phases"
        :key="phase.key"
        type="button"
        class="t-btn t-btn--secondary pt-phase"
        aria-disabled="true"
        :title="phase.note"
        :aria-label="phase.note"
        :data-phase="phase.key"
      >
        <svg
          v-if="phase.key === 'message'"
          class="t-icon t-icon--sm"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M3 6h18v12H3zM3 7l9 6 9-6" />
        </svg>
        <svg v-else class="t-icon t-icon--sm" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        <span class="rp-trunc">{{ phase.label }}</span>
      </button>
      <UiButton
        v-if="canAssign"
        variant="primary"
        icon="plus"
        :disabled="assignBlocked !== null"
        :title="assignBlocked ?? undefined"
        data-assign
        @click="assign"
      >
        {{ trackingText('userTracking.head.assign') }}
      </UiButton>
    </div>
    <UiModal
      v-model:open="picking"
      :title="trackingText('userTracking.assign.title')"
      :description="trackingText('userTracking.assign.description')"
    >
      <form id="pt-assign" novalidate data-assign-form @submit.prevent="confirmPick">
        <UiField :label="trackingText('userTracking.assign.field')" :error="error">
          <UiSelect
            v-model="chosen"
            name="departmentId"
            :options="options"
            :placeholder="trackingText('userTracking.assign.placeholder')"
          />
        </UiField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="picking = false">
          {{ trackingText('userTracking.assign.cancel') }}
        </UiButton>
        <UiButton variant="primary" type="submit" form="pt-assign" data-assign-submit>
          {{ trackingText('userTracking.assign.submit') }}
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>
