<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import { UiInput } from '@/shared/ui'

import type { DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'
import { supportsPurgeAll, typedMatches } from '../model/purge-all'

/**
 * Çöpü boşalt paneli (E-12-06; BE-115): en yıkıcı eylem, bu yüzden tür adı yazılarak onaylanır
 * (varsayım 11) ve ardından ortak onay penceresi açılır (çağıran). Metin etkin sayı ve kapsamı
 * söyler: görev/toplantı seçili programın, hesap şirketin TÜM silinmişleridir (ekrandaki süzgeç
 * dikkate alınmaz). Çalışırken ilerleme ve "Durdur" gösterilir. Yalnız çağıran çizer.
 */
const props = defineProps<{
  kind: DeletedKind
  /** Özetten etkin türün silinmiş sayısı (özet yoksa `null`; sahte sayı yok). */
  count: number | null
  running: boolean
  progress: { done: number; left: number | null }
}>()
const emit = defineEmits<{ confirm: []; cancel: []; stop: [] }>()

const typed = ref('')
const input = ref<HTMLElement | null>(null)
const ready = computed(() => supportsPurgeAll(props.kind) && typedMatches(typed.value, props.kind))
const kindName = computed(() => deletedText(`kindNames.${props.kind}`))
const title = computed(() =>
  props.count === null
    ? deletedText('purgeAll.titleUnknown', { kind: kindName.value })
    : deletedText('purgeAll.title', { n: props.count, kind: kindName.value }),
)
const scopeText = computed(() =>
  props.kind !== 'tumu' ? deletedText(`purgeAll.scope.${props.kind}`) : '',
)
const runningText = computed(() =>
  props.progress.left === null
    ? deletedText('purgeAll.running', { n: props.progress.done })
    : deletedText('purgeAll.runningLeft', { n: props.progress.done, left: props.progress.left }),
)

onMounted(async () => {
  await nextTick()
  input.value?.querySelector<HTMLInputElement>('input')?.focus()
})
function submit(): void {
  if (ready.value) emit('confirm')
}
</script>

<template>
  <section
    id="dr-purgeall"
    class="dr-notice dr-purgeall"
    :aria-label="deletedText('purgeAll.confirm')"
    data-testid="dr-purgeall"
    @keydown.esc.stop="!running && emit('cancel')"
  >
    <template v-if="running">
      <p class="dr-notice__text" role="status" data-testid="dr-purgeall-progress">
        {{ runningText }}
      </p>
      <button
        type="button"
        class="t-btn t-btn--secondary t-btn--sm"
        data-testid="dr-purgeall-stop"
        @click="emit('stop')"
      >
        {{ deletedText('purgeAll.stop') }}
      </button>
    </template>
    <template v-else>
      <div class="dr-purgeall__text">
        <p class="dr-purgeall__title">{{ title }}</p>
        <p class="rp-cap">{{ scopeText }} {{ deletedText('purgeAll.irreversible') }}</p>
      </div>
      <form class="dr-purgeall__form" @submit.prevent="submit">
        <label class="rp-cap" for="dr-purgeall-input">
          {{ deletedText('purgeAll.typeLabel', { kind: kindName }) }}
        </label>
        <div ref="input">
          <UiInput
            id="dr-purgeall-input"
            v-model="typed"
            size="sm"
            autocomplete="off"
            :placeholder="deletedText('purgeAll.typePlaceholder', { kind: kindName })"
            data-testid="dr-purgeall-input"
          />
        </div>
        <button
          type="submit"
          class="t-btn t-btn--danger t-btn--sm"
          :aria-disabled="ready ? undefined : 'true'"
          data-testid="dr-purgeall-confirm"
        >
          {{ deletedText('purgeAll.confirm') }}
        </button>
        <button
          type="button"
          class="t-btn t-btn--ghost t-btn--sm"
          data-testid="dr-purgeall-cancel"
          @click="emit('cancel')"
        >
          {{ deletedText('purgeAll.cancel') }}
        </button>
      </form>
    </template>
  </section>
</template>
