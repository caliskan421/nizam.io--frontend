<script setup lang="ts">
import './side.css'

import { ref, watch } from 'vue'

import type { ScopeStep } from '@/shared/scope/resolve'

import SideAccount from './SideAccount.vue'
import SideBrand from './SideBrand.vue'
import SideNav from './SideNav.vue'
import SideRail from './SideRail.vue'
import SideScope from './SideScope.vue'
import { useTaskBadges } from './badges'
import { useSideMenu } from './menu'
import { injectScopeLifecycle } from './scope-key'
import type { SwitcherState } from './scope-view'
import { buildVersionLabel } from './version'

/**
 * Kenar menüsü (00-ortak; `Sidebar.dc.html`, `Kenar-Secici.dc.html`). Kabuk sözleşmesi:
 * `collapsed` + `update:collapsed` (daraltma yalnız oturum belleği, P10 — durumu kabuk tutar);
 * kapsam yaşam döngüsü `SCOPE_LIFECYCLE_KEY` ile sağlanır, burada KURULMAZ.
 *
 * Seçim bekleniyorsa (çok seçenek + hatırlanan yok; ortak-kurallar §1) ilgili seçici açılır
 * (odak çalınmaz); dar hâldeyse menü genişletilir, dar ekranda kaplama açtırılır (`reveal`).
 * `narrowOpen`: ≤ 900 px'te menü yalnız bu bayrakla görünür (perdeli kaplama; `narrow-nav.ts`).
 */
const props = defineProps<{ collapsed: boolean; narrowOpen?: boolean }>()
const emit = defineEmits<{ 'update:collapsed': [value: boolean]; reveal: [] }>()

const lifecycle = injectScopeLifecycle()
const { groups, activeKey, role } = useSideMenu()
const { badges } = useTaskBadges()
const version = buildVersionLabel()
const switcher = ref<SwitcherState | null>(null)

watch(
  () => lifecycle.pending.value,
  (step) => {
    if (!step) return
    switcher.value = { which: step, focus: false }
    if (props.collapsed) emit('update:collapsed', false)
    emit('reveal')
  },
  { immediate: true },
)

function collapse(): void {
  switcher.value = null
  emit('update:collapsed', true)
}

function openFromRail(which: ScopeStep): void {
  switcher.value = { which, focus: true }
  emit('update:collapsed', false)
}
</script>

<template>
  <aside
    id="app-side"
    class="rp-side"
    :class="{ 'rp-side--rail': collapsed, 'rp-side--open': narrowOpen }"
  >
    <SideRail
      v-if="collapsed"
      :groups="groups"
      :active-key="activeKey"
      :role="role"
      @expand="emit('update:collapsed', false)"
      @open="openFromRail"
    />
    <div v-else class="side-full">
      <SideBrand :version="version" @collapse="collapse" />
      <SideScope v-model:switcher="switcher" />
      <SideNav :groups="groups" :active-key="activeKey" :badges="badges" />
      <div class="side-foot">
        <SideAccount :role="role" />
      </div>
    </div>
  </aside>
</template>
