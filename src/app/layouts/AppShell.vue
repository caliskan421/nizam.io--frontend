<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'

import { AppSide, SCOPE_LIFECYCLE_KEY } from '@/app/shell/side/public'
import { AppTopbar } from '@/app/shell/topbar/public'
import type { ShellContent } from '@/app/shell/types'
import { resolveShellContent, ShellState } from '@/app/states/public'
import { useScopeLifecycle } from '@/shared/scope/lifecycle'
import { UiToast } from '@/shared/ui'
import { ConfirmHost } from '@/shared/ui/confirm'

/**
 * Oturum açıkken her rotayı saran kabuk (00-ortak; `Main.dc.html` `rp-page`): solda kenar menüsü,
 * sağda `rp-main` (üst çubuk + içerik). Kapsam yaşam döngüsü burada BİR kez kurulur ve
 * `SCOPE_LIFECYCLE_KEY` ile sağlanır. Daraltma yalnız oturum belleğinde (P10). K7 açık durumları
 * ve kapsam bekleme durumları rota içeriği yerine yerinde gösterilir (URL'siz). Bildirim ve onay
 * yuvaları (`UiToast`, `ConfirmHost`) burada bir kez yerleşir.
 */
const lifecycle = useScopeLifecycle()
provide(SCOPE_LIFECYCLE_KEY, lifecycle)

const collapsed = ref(false)
const route = useRoute()

const content = computed<ShellContent>(() =>
  resolveShellContent({
    status: lifecycle.status.value,
    emptyReason: lifecycle.emptyReason.value,
    routeScope: route.meta.scope,
  }),
)
const stateContent = computed(() => (content.value.kind === 'content' ? null : content.value))
const openState = computed(() => (content.value.kind === 'open-state' ? content.value.name : null))
</script>

<template>
  <div class="rp-page" data-testid="app-shell">
    <AppSide v-model:collapsed="collapsed" />
    <main class="rp-main">
      <AppTopbar :open-state="openState" />
      <ShellState v-if="stateContent" :content="stateContent" />
      <slot v-else />
    </main>
    <UiToast />
    <ConfirmHost />
  </div>
</template>

<style>
/* `theme.css` `.rp-page` / `.rp-main` birebir; yalnız token. */
@layer components {
  .rp-page {
    display: flex;
    flex-wrap: wrap;
    min-height: 100vh;
    background: var(--bg-base);
    color: var(--ink);
    font: var(--text-body);
  }
  .rp-main {
    flex: 999 1 var(--rp-main-basis);
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
