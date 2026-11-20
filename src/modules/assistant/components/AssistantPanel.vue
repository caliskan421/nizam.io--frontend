<script setup lang="ts">
import './assistant.css'

import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { ScopeSnapshot } from '@/shared/scope/scope'
import { UiButton, UiErrorState, UiIcon, UiModal } from '@/shared/ui'

import AssistantCitations from './AssistantCitations.vue'
import AssistantRail from './AssistantRail.vue'
import { useAssistantSession } from '../model/session'
import { QUESTION_LIMIT, speakerLabel } from '../model/types'
import type { ViewLink } from '../model/views'

const props = defineProps<{
  program: string
  context: string
  admin: boolean
  scope: ScopeSnapshot
  roleLabel: string
  narrow?: boolean
  today: string
}>()
const open = defineModel<boolean>('open', { required: true })
const state = useAssistantSession(props.program, () => {
  open.value = false
})
const router = useRouter()
const history = ref(false)
const deleting = ref(false)
const scroll = ref<HTMLElement | null>(null)
const dismissed = ref<string[]>([])
const navigationStatus = ref('')
const busy = computed(() => state.activity.value !== 'idle')
const prompts = computed(() => [
  'Geciken görevlerimi göster',
  'Yaklaşan toplantılarımı özetle',
  'Bu programda hangi işleri görebiliyorum?',
  'Kurumsal hafızada gönüllü planlamasıyla ilgili deneyim var mı?',
  ...(props.admin ? ['Programın görev dağılımı nasıl?'] : []),
])
const current = computed(() =>
  state.conversations.value.find((item) => item.id === state.selected.value),
)
const tooLong = computed(() => [...state.draft.value.trim()].length > QUESTION_LIMIT)

function toggleHistory() {
  history.value = !history.value
  if (history.value) void state.refresh()
}
function select(id: string) {
  history.value = false
  dismissed.value = []
  navigationStatus.value = ''
  state.draft.value = ''
  void state.select(id)
}
function newConversation() {
  state.reset()
  history.value = false
  dismissed.value = []
  navigationStatus.value = ''
}
async function remove() {
  if (!state.selected.value) return
  await state.remove(state.selected.value)
  if (!state.error.value) deleting.value = false
}
async function openView(key: string, target: ViewLink) {
  if (busy.value) return
  const destination = router.resolve(target.to)
  try {
    await router.push(target.to)
    const opened = router.currentRoute.value.fullPath === destination.fullPath
    if (opened && props.narrow) open.value = false
    navigationStatus.value = opened ? 'Görünüm açıldı.' : 'Görünüm açılamadı.'
  } catch {
    navigationStatus.value = 'Görünüm açılamadı.'
  }
  dismissed.value = [...dismissed.value, key]
}
function dismiss(key: string) {
  dismissed.value = [...dismissed.value, key]
  navigationStatus.value = 'Görünüm önerisi kapatıldı.'
}
watch([state.turns, state.pending], async () => {
  await nextTick()
  if (scroll.value) scroll.value.scrollTop = scroll.value.scrollHeight
})
onMounted(() => state.refresh())
</script>

<template>
  <component
    :is="narrow ? UiModal : AssistantRail"
    v-model:open="open"
    title="Asistan"
    :description="'Bağlam: ' + context + ' · ' + roleLabel"
  >
    <div id="app-assistant-panel" class="assistant-panel" data-testid="assistant-panel">
      <div class="assistant-toolbar">
        <UiButton size="sm" icon="plus" :disabled="busy" @click="newConversation"
          >Yeni sohbet</UiButton
        >
        <UiButton
          size="sm"
          icon="clock"
          :aria-pressed="history"
          :disabled="busy"
          @click="toggleHistory"
          >Geçmiş</UiButton
        >
        <UiButton v-if="state.selected.value" size="sm" :disabled="busy" @click="deleting = true"
          >Sohbeti sil</UiButton
        >
      </div>
      <UiErrorState
        v-if="state.listError.value && !state.unavailable.value && history"
        :error="state.listError.value"
        title="Geçmiş alınamadı"
        retryable
        @retry="state.refresh()"
      />
      <p v-if="state.unavailable.value" class="assistant-notice" role="status">
        Asistan bu programda şu anda kullanılamıyor.
      </p>
      <section v-else-if="history" class="assistant-history" aria-label="Sohbet geçmişi">
        <p v-if="state.activity.value === 'list'" role="status">Sohbet geçmişi yükleniyor…</p>
        <p v-else-if="!state.conversations.value.length && !state.listError.value">
          Henüz sohbet yok.
        </p>
        <p v-if="state.truncated.value" class="assistant-muted">En yeni 200 sohbet gösteriliyor.</p>
        <ul>
          <li v-for="item in state.conversations.value" :key="item.id">
            <UiButton size="sm" :disabled="busy" @click="select(item.id)">{{
              item.baslik || 'Sohbet'
            }}</UiButton>
          </li>
        </ul>
      </section>
      <template v-else>
        <div ref="scroll" class="assistant-scroll" aria-label="Sohbet">
          <div v-if="state.suggestions.value && !state.turns.value.length" class="assistant-intro">
            <span class="assistant-logo" aria-hidden="true"><UiIcon name="assistant" /></span>
            <h3>Ne yapalım?</h3>
            <p>
              Seçili programda erişebildiğiniz görev, toplantı ve kurumsal hafıza verileri hakkında
              soru sorun.
            </p>
            <div class="assistant-prompts">
              <UiButton
                v-for="prompt in prompts"
                :key="prompt"
                size="sm"
                :disabled="busy"
                @click="state.submit(prompt)"
                >{{ prompt }}</UiButton
              >
            </div>
          </div>
          <p v-if="state.activity.value === 'read'" role="status">Sohbet yükleniyor…</p>
          <ol v-if="state.turns.value.length" class="assistant-turns">
            <li v-for="turn in state.turns.value" :key="turn.key" :data-role="turn.role">
              <div class="assistant-message">
                <span class="assistant-muted">{{ speakerLabel(turn.role) }}</span>
                <p v-if="turn.text">{{ turn.text }}</p>
              </div>
              <AssistantCitations
                :turn="turn"
                :scope="scope"
                :admin="admin"
                :busy="busy"
                :today="today"
                :dismissed="dismissed"
                @view="openView"
                @dismiss="dismiss"
              />
            </li>
          </ol>
          <div v-if="state.pending.value" class="assistant-pending">
            <p>{{ state.pending.value }}</p>
            <p role="status">{{ state.tool.value || 'Yanıt hazırlanıyor…' }}</p>
          </div>
          <p v-if="navigationStatus" role="status">{{ navigationStatus }}</p>
          <p v-if="state.status.value" role="status">{{ state.status.value }}</p>
          <UiErrorState
            v-if="state.error.value && !deleting"
            :error="state.error.value"
            title="İşlem tamamlanamadı"
          />
        </div>
        <form class="assistant-compose" @submit.prevent="state.submit()">
          <label for="assistant-question">Sorunuz</label>
          <textarea
            id="assistant-question"
            v-model="state.draft.value"
            class="t-input"
            rows="2"
            placeholder="Asistana sor…"
            :disabled="busy"
          />
          <p v-if="tooLong" role="status">Soru en çok 2.000 karakter olabilir.</p>
          <UiButton v-if="state.activity.value === 'ask'" size="sm" @click="state.stop"
            >Durdur</UiButton
          >
          <UiButton
            v-else
            type="submit"
            size="sm"
            variant="primary"
            :disabled="busy || tooLong || !state.draft.value.trim()"
            >Gönder</UiButton
          >
        </form>
        <p class="assistant-foot">
          Asistan program kayıtlarını okuyabilir. Önerilen görünümü açmak için seçiminizi bekler.
        </p>
      </template>
    </div>
    <UiModal
      v-model:open="deleting"
      title="Sohbet silinsin mi?"
      :description="current?.baslik"
      :dismissible="!busy"
    >
      <p>Sohbet ve mesajları kalıcı olarak silinir.</p>
      <UiErrorState v-if="state.error.value" :error="state.error.value" title="Sohbet silinemedi" />
      <template #footer>
        <UiButton :disabled="busy" @click="deleting = false">Vazgeç</UiButton>
        <UiButton variant="danger" :disabled="busy" @click="remove">Sil</UiButton>
      </template>
    </UiModal>
  </component>
</template>
