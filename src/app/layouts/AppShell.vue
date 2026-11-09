<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'

import { isRouteName } from '@/app/routes.catalog'
import { useNarrowNav } from '@/app/shell/narrow-nav'
import { AppSide, SCOPE_LIFECYCLE_KEY } from '@/app/shell/side/public'
import { AppTopbar } from '@/app/shell/topbar/public'
import type { ShellContent } from '@/app/shell/types'
import { resolveShellContent, ShellState } from '@/app/states/public'
import { useScopeLifecycle } from '@/shared/scope/lifecycle'
import { useProgramDepartmentGap } from '@/shared/scope/standing'
import { UiToast } from '@/shared/ui'
import { ConfirmHost } from '@/shared/ui/confirm'

/**
 * Oturum açıkken her rotayı saran kabuk (00-ortak; `Main.dc.html` `rp-page`): solda kenar menüsü,
 * sağda `rp-main` (üst çubuk + içerik). Kapsam yaşam döngüsü burada BİR kez kurulur ve
 * `SCOPE_LIFECYCLE_KEY` ile sağlanır. Daraltma yalnız oturum belleğinde (P10). K7 açık durumları
 * ve kapsam bekleme durumları rota içeriği yerine yerinde gösterilir (URL'siz). Bildirim ve onay
 * yuvaları (`UiToast`, `ConfirmHost`) burada bir kez yerleşir. Yöneticinin "programa departman
 * katılmamış" durumu Admin merceğinde program departman listesinden saptanır (yalnız içerik alanı).
 * Dar ekranda (≤ 900 px) kenar menüsü varsayılan kapalı, perdeli kaplama (`narrow-nav.ts`): kaplama
 * açıkken `rp-main` `inert` (arka içerik klavye/ekran okuyucu için etkisiz), kaydırma kilitli.
 */
const lifecycle = useScopeLifecycle()
provide(SCOPE_LIFECYCLE_KEY, lifecycle)
const departmentGap = useProgramDepartmentGap(() => lifecycle.status.value === 'ready')

const collapsed = ref(false)
const route = useRoute()
const nav = useNarrowNav(() => route.fullPath, {
  side: () => document.getElementById('app-side'),
  trigger: () => document.querySelector<HTMLElement>('[aria-controls="app-side"]'),
})

const content = computed<ShellContent>(() =>
  resolveShellContent({
    status: lifecycle.status.value,
    emptyReason: lifecycle.emptyReason.value,
    routeScope: route.meta.scope,
    routeName: isRouteName(route.name) ? route.name : undefined,
    departmentGap: departmentGap.value,
  }),
)
const stateContent = computed(() => (content.value.kind === 'content' ? null : content.value))
const openState = computed(() => (content.value.kind === 'open-state' ? content.value.name : null))
</script>

<template>
  <div class="rp-page" data-testid="app-shell">
    <AppSide v-model:collapsed="collapsed" :narrow-open="nav.open.value" @reveal="nav.reveal()" />
    <div
      v-if="nav.open.value"
      class="rp-narrow-scrim"
      aria-hidden="true"
      data-testid="narrow-scrim"
      @click="nav.close()"
    />
    <!-- `|| undefined`: kapalıyken öznitelik hiç yazılmaz (DOM özelliği olmayan ortamda "false" kalmasın). -->
    <main class="rp-main" :inert="nav.overlay.value || undefined">
      <AppTopbar :open-state="openState" :nav-open="nav.open.value" @toggle-nav="nav.toggle()" />
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
  /* Dar ekran kaplaması açıkken belge kaydırması kilitli (`narrow-nav.ts`). */
  .rp-scroll-lock {
    overflow: hidden;
  }
  /* Dar ekran kaplamasının perdesi; geniş ekranda hiç görünmez. */
  .rp-narrow-scrim {
    display: none;
  }
  @media (max-width: 900px) {
    .rp-narrow-scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 39;
      background: var(--scrim);
    }
  }
}
</style>
