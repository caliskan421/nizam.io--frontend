<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'
import { DesignStub, UiInput, UiKbd, UiSegmented } from '@/shared/ui'

import { ARCHIVE_KINDS } from '../../model/mime'
import type { ArchiveKind } from '../../model/types'
import type { ArchiveSearchBarEmits, ArchiveSearchBarProps } from '../index'
import './folders.css'

/**
 * Arama + dosya türü segmenti (E-06-06/07/26). Arama sunucunun desteklediği alanla sınırlıdır
 * (dosya adı, BE-077). Yazım ~300 ms gecikmeyle `update:q` yayar; bekleyen yazım sahip sökülünce,
 * kapsam ya da oturum değişince düşer. "/" kutuya odaklar (yazı alanındayken değil). `disabled`
 * (yönetici, BE-072): arama ve segment statik, "Görev klasörü seçin" açıklaması görünür.
 * Segment yalnız Tümü/Görsel/Belge'dir (PDF ayrı kategori değil, E-06-07).
 */
const props = defineProps<ArchiveSearchBarProps>()
const emit = defineEmits<ArchiveSearchBarEmits>()
const { t } = useI18n()

/** Arama URL yazım gecikmesi (03/05/08 ile aynı tek sabit). */
const SEARCH_DEBOUNCE_MS = 300

const root = ref<HTMLElement | null>(null)
const draft = ref(props.q)
let timer: ReturnType<typeof setTimeout> | undefined

function cancel(): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

watch(draft, (value) => {
  cancel()
  if (value === props.q) return
  timer = setTimeout(() => {
    timer = undefined
    emit('update:q', value)
  }, SEARCH_DEBOUNCE_MS)
})

// Dışarıdan değişim (geri tuşu): bekleyen yazım düşer, kutu eşitlenir.
watch(
  () => props.q,
  (value) => {
    if (value === draft.value) return
    cancel()
    draft.value = value
  },
)

function drop(): void {
  cancel()
  draft.value = props.q
}
const stopScope = useScopeStore().onChange(drop)
let generation = authSession.generation
let account = authSession.snapshot.accountId
const stopSession = authSession.subscribe((snapshot) => {
  if (generation !== authSession.generation || account !== snapshot.accountId) drop()
  generation = authSession.generation
  account = snapshot.accountId
})

const options = computed(() =>
  ARCHIVE_KINDS.map((kind) => ({ value: kind, label: t(`archive.shared.kind.${kind}`) })),
)

function onSlash(event: KeyboardEvent): void {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented)
    return
  if (props.disabled) return
  const target = event.target as HTMLElement | null
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
    return
  const input = root.value?.querySelector<HTMLInputElement>('input[type="search"]')
  if (!input) return
  event.preventDefault()
  input.focus()
}

onMounted(() => document.addEventListener('keydown', onSlash))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onSlash)
  cancel()
  stopScope()
  stopSession()
})
</script>

<template>
  <div ref="root" class="archive-searchbar">
    <component
      :is="disabled ? DesignStub : 'div'"
      v-bind="disabled ? { id: 'BE-072', as: 'div' } : {}"
      class="archive-searchbar__row"
    >
      <div class="archive-search">
        <UiInput
          v-model="draft"
          type="search"
          icon="search"
          :disabled="disabled"
          :aria-label="t('archive.folders.search.label')"
          :placeholder="t('archive.folders.search.placeholder')"
        />
        <UiKbd
          v-if="!disabled"
          class="archive-search__kbd"
          :title="t('archive.folders.search.shortcut')"
          >/</UiKbd
        >
      </div>
      <UiSegmented
        :model-value="kind"
        :options="options"
        :label="t('archive.shared.kind.label')"
        :disabled="disabled"
        @update:model-value="(value: ArchiveKind | null) => value && emit('update:kind', value)"
      />
    </component>
    <p v-if="disabled" class="rp-cap archive-searchbar__hint" role="status">
      {{ t('archive.shared.selectTask') }}
    </p>
  </div>
</template>
