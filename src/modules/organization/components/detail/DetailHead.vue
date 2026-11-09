<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { TASKS_NEW_TASK_QUERY, TASKS_ROUTE } from '@/modules/work/public'
import { DesignStub, UiIcon, UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import type { CoordinatorshipView } from '../../model/types'
import { badgeText } from './detail-model'
import { detailText } from './messages'

/**
 * Başlık (E-08-51…56; tasarım `rp-head`): büyük kod rozeti (kod ya da baş harfler), ad, "‹N› kişi"
 * (`listMembers` etkin satırlar; üst/alt birim ve "Aktif" çizilmez — K14, P16). Eylemler:
 *  - Ekibe mesaj: F7'ye dek devre dışı + faz notu (stub değil, P2).
 *  - Görev ata: work "Yeni görev" formu, birim ön seçili (`/gorevler?koordinatorluk=‹id›&yeni=1`;
 *    form bileşeni work modülünün dışa açık yüzünde yok — giriş W48 kalıbıyla); görünürlük
 *    `canCreateWorkItem`.
 *  - Diğer işlemler: "Düzenle" (W74 `DepartmentForm`); "Birleştir", "Pasifleştir" devre dışı
 *    (`BE-017`, K14).
 */
const props = defineProps<{
  view: CoordinatorshipView
  people: number | null
  canEdit: boolean
  canCreateTask: boolean
}>()
const emit = defineEmits<{ edit: [] }>()

const menuOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const badge = computed(() => badgeText(props.view.displayName, props.view.code))
const newTask = computed(() => ({
  name: TASKS_ROUTE.name,
  query: { koordinatorluk: props.view.departmentId, ...TASKS_NEW_TASK_QUERY },
}))

function focusTrigger(): void {
  void nextTick(() => root.value?.querySelector<HTMLElement>('[data-action="more"]')?.focus())
}

function closeMenu(reason: 'escape' | 'tab'): void {
  menuOpen.value = false
  if (reason === 'escape') focusTrigger()
}

function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (menuOpen.value && next && !root.value?.contains(next)) menuOpen.value = false
}

function edit(): void {
  menuOpen.value = false
  emit('edit')
}
</script>

<template>
  <div class="rp-head cd-head">
    <div class="cd-head__id">
      <span class="cd-code cd-code--lg" aria-hidden="true" data-testid="cd-badge">{{ badge }}</span>
      <div class="cd-head__text">
        <h1 class="rp-h1 rp-trunc" data-testid="cd-title">{{ view.displayName }}</h1>
        <p class="rp-sub" data-testid="cd-sub">
          <template v-if="people !== null">
            {{ detailText('organization.coordinatorship.head.people', { n: people }) }}
          </template>
        </p>
      </div>
    </div>
    <div ref="root" class="rp-actions cd-actions" @focusout="onFocusOut">
      <button
        type="button"
        class="t-btn t-btn--secondary"
        aria-disabled="true"
        :title="detailText('organization.coordinatorship.phase.f7')"
        data-action="message"
      >
        <UiIcon name="messages" size="sm" />
        {{ detailText('organization.coordinatorship.head.message') }}
        <span class="cd-phase">{{ detailText('organization.coordinatorship.phase.f7') }}</span>
      </button>
      <RouterLink
        v-if="canCreateTask"
        class="t-btn t-btn--primary"
        :to="newTask"
        data-action="assign"
      >
        <UiIcon name="plus" size="sm" />
        {{ detailText('organization.coordinatorship.head.assign') }}
      </RouterLink>
      <div v-if="canEdit" class="cd-menuwrap">
        <UiIconButton
          icon="more"
          size="md"
          :label="detailText('organization.coordinatorship.head.more')"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="menu"
          data-action="more"
          @click="menuOpen = !menuOpen"
        />
        <UiMenu
          v-if="menuOpen"
          class="cd-pop"
          :label="detailText('organization.coordinatorship.head.more')"
          @close="closeMenu"
        >
          <UiMenuItem data-action="edit" @select="edit">
            {{ detailText('organization.coordinatorship.head.edit') }}
          </UiMenuItem>
          <DesignStub id="BE-017" as="div">
            <UiMenuItem disabled data-action="merge">
              {{ detailText('organization.coordinatorship.head.merge') }}
            </UiMenuItem>
            <UiMenuItem disabled data-action="deactivate">
              {{ detailText('organization.coordinatorship.head.deactivate') }}
            </UiMenuItem>
          </DesignStub>
        </UiMenu>
      </div>
    </div>
  </div>
</template>
