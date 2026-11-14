<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { WorkItem } from '@/modules/work/public'
import type { ApiError } from '@/shared/errors/api-error'
import { DesignStub, UiButton, UiCount } from '@/shared/ui'

import type { RoleLoadScope } from '../../model/role/common'
import { useRoleFacts } from '../../api/role/use-facts'
import { useRoleWrites } from '../k1/use-role-writes'
import { homeText } from '../../model/messages'
import { shortName } from '../../model/role/meetings'
import { taskLocation, tasksLocation } from '../../model/role/links'
import { actionTarget, queueActions, todayQueue, type QueueAction } from '../../model/u1/queue'
import { possessiveSuffix } from '../../model/turkish'
import DueText from '../k1/DueText.vue'
import RegionBody from '../k1/RegionBody.vue'
import ScopeNote from '../k1/ScopeNote.vue'

/**
 * "Bugünün sırası" (E-Ü1-09…17): bana atananların (tek yükleme, KESİN 21) önceliğe ve son
 * tarihe göre ilk beşi. Satır: durum noktası + etiket, alt görev ilerlemesi, birim (ad
 * kısaltması; tam ad ipucunda), bitiş + göreli. Eylemler 03'ün yazma akışı: "Tekrar başla"
 * (`ownStatusWorkItem`), "Göreve başla" / "Tamamlandı bildir" (`transitionWorkItem`), "Kanıt
 * yükle" (yükleme penceresi, görev sabit). Kilit durumu ve iade sebebi gizli (BE-138/139);
 * bağımlılık engeli sunucu hatasıyla bildirilir. `onaya_sunuldu` satırında yalnız "Onayda"
 * rozeti (koordinatör adı üyeye okunamaz).
 */
const props = defineProps<{
  items: readonly WorkItem[]
  today: string
  /** `department_id` → görünen ad (`myDepartments`). */
  unitNames: ReadonlyMap<string, string>
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
  /** Sunucu sayacından kesin açık görev sayısı (varsa); yoksa türev, kısmi kümede "≥". */
  openTotal?: number | null
  /** Kısmi yükleme durumu (`null` = tam); "ilk N görev" etiketi + devam/yeniden deneme. */
  scope?: RoleLoadScope | null
  loaded?: number
}>()
const emit = defineEmits<{ retry: []; more: []; evidence: [item: WorkItem] }>()

const facts = useRoleFacts()
const writes = useRoleWrites({ requestEvidence: (item) => emit('evidence', item) })

const queue = computed(() => todayQueue(props.items))
// Kesin sunucu özeti varsa o; kısmi kümede türev alt sınırdır (sahte toplam yok).
const total = computed(() => props.openTotal ?? queue.value.open)
const approximate = computed(() => props.scope != null && props.openTotal == null)
const needsEvidence = computed(() => queue.value.shown.some((i) => i.completion_evidence_required))

const LABEL = {
  restart: 'restart',
  evidence: 'evidence',
  complete: 'complete',
  start: 'start',
} as const

function allowed(item: WorkItem, action: QueueAction): boolean {
  const to = actionTarget(action)
  if (action === 'evidence') return facts.canUpload(item)
  return to !== null && (facts.canOwnMove(item, to) || facts.canMove(item, to))
}

function run(item: WorkItem, action: QueueAction): void {
  if (action === 'evidence') return emit('evidence', item)
  const to = actionTarget(action)
  if (to === null) return
  const via = action === 'restart' && facts.canOwnMove(item, to) ? 'own' : 'transition'
  void writes.move(item, to, via, 'home.u1.queue.wrote')
}

const DOT = {
  baslanmadi: 'rh-dot--todo',
  devam_ediyor: 'rh-dot--doing',
  onaya_sunuldu: 'rh-dot--review',
  iade_edildi: 'rh-dot--back',
  tamamlandi: 'rh-dot--done',
} as const
</script>

<template>
  <section class="t-card rh-card" data-region="queue" aria-labelledby="u1-queue">
    <div class="rh-cardhead">
      <h2 id="u1-queue" class="rh-cardtitle">{{ homeText('home.u1.queue.title') }}</h2>
      <RouterLink class="rh-link" :to="tasksLocation()" data-testid="u1-queue-all">
        {{ homeText('home.u1.queue.all') }}
        <UiCount :value="approximate ? `≥${total}` : total" />
      </RouterLink>
    </div>
    <p v-if="total > 0" class="rh-note" data-testid="u1-queue-sub">
      {{
        homeText('home.u1.queue.sub', {
          open: approximate ? `≥${total}` : total,
          shown: queue.shown.length,
          suffix: possessiveSuffix(queue.shown.length),
        })
      }}
    </p>
    <ScopeNote v-if="scope" :scope="scope" :loaded="loaded ?? 0" @more="emit('more')" />
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="queue.shown.length === 0 ? homeText('home.u1.queue.empty') : null"
      @retry="emit('retry')"
    >
      <div
        v-for="item in queue.shown"
        :key="item.work_item_id"
        class="rh-row rh-row--queue"
        data-row
      >
        <span class="rh-dot" :class="DOT[item.status]" aria-hidden="true" />
        <span class="rh-stack">
          <span class="rh-line">
            <RouterLink class="rh-title" :to="taskLocation(item.work_item_id)">
              {{ item.title }}
            </RouterLink>
            <DesignStub id="BE-005">
              <span class="rh-kicker">{{ homeText('home.k1.common.code') }}</span>
            </DesignStub>
          </span>
          <span class="rh-meta">
            <span class="rh-pill" data-status>
              {{ homeText(`home.k1.common.status.${item.status}`) }}
            </span>
            <span v-if="item.subtask_counts.total > 0">
              {{
                homeText('home.u1.queue.subtasks', {
                  done: item.subtask_counts.done,
                  total: item.subtask_counts.total,
                })
              }}
            </span>
            <span
              v-if="unitNames.get(item.department_id)"
              class="rh-code"
              :title="unitNames.get(item.department_id)"
            >
              {{ shortName(unitNames.get(item.department_id) ?? '') }}
            </span>
            <DueText :item="item" :today="today" />
          </span>
        </span>
        <span class="rh-btns">
          <span
            v-if="item.status === 'onaya_sunuldu'"
            class="rh-pill rh-pill--gold"
            :title="homeText('home.u1.queue.reviewTip')"
            data-badge="review"
          >
            {{ homeText('home.u1.queue.reviewBadge') }}
          </span>
          <template v-for="action in queueActions(item)" :key="action">
            <UiButton
              v-if="allowed(item, action)"
              :variant="action === 'complete' ? 'primary' : 'secondary'"
              size="sm"
              :icon="action === 'evidence' ? 'file-upload' : undefined"
              :disabled="writes.pendingId.value === item.work_item_id"
              :aria-label="homeText(`home.u1.queue.${LABEL[action]}Label`, { title: item.title })"
              :data-action="action"
              @click="run(item, action)"
            >
              {{ homeText(`home.u1.queue.${LABEL[action]}`) }}
            </UiButton>
          </template>
        </span>
      </div>
      <p v-if="needsEvidence" class="rh-foot" data-testid="u1-queue-evidence">
        {{ homeText('home.u1.queue.evidenceNote') }}
      </p>
    </RegionBody>
  </section>
</template>
