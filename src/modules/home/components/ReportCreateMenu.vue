<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'

import { UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'

import { homeText } from '../model/messages'
import { REPORT_TARGETS, type ReportTarget } from '../model/report-targets'

/**
 * "Rapor oluştur" kutucuğu + `rp-pop` menüsü (E-01-12; P47, Rapor-Noktalar hücre F). Kutucuk
 * "Hızlı işlemler" ızgarasının parçasıdır (`display: contents`); menü ızgarada hemen altına
 * tam genişlikte açılır. Menü yalnız gezinir: ağ isteği yok, PDF üretmez. Kapanışta odak
 * kutucuğa döner (Esc, öğe seçimi); dışarı tıklama ve Tab odağı kendi hedefine bırakır
 * (KESİN 27). Menü yokken `aria-controls` verilmez. Görünürlüğü çağıran belirler (yalnız ŞY).
 */
const router = useRouter()
const open = ref(false)
const tile = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLElement | null>(null)
const menuId = `home-report-${useId()}`

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  if (returnFocus) void nextTick(() => tile.value?.focus())
}

function go(target: ReportTarget): void {
  close(true)
  void router.push({ name: target.routeName })
}

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close(false)
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onOutside, true)
  else document.removeEventListener('pointerdown', onOutside, true)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))
</script>

<template>
  <span ref="root" class="home-report">
    <button
      ref="tile"
      type="button"
      class="rp-cardbtn home-tile"
      data-quick="report"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? menuId : undefined"
      @click="open = !open"
      @keydown.down.prevent="open = true"
    >
      <span class="home-tile__top"><UiIcon name="document" /></span>
      <span class="rp-clamp2 home-tile__label">{{ homeText('home.report.tile') }}</span>
    </button>
    <UiMenu
      v-if="open"
      :id="menuId"
      class="home-report__menu"
      :label="homeText('home.report.menu')"
      @close="close($event === 'escape')"
    >
      <UiMenuItem
        v-for="target in REPORT_TARGETS"
        :key="target.key"
        icon="document"
        :data-report="target.key"
        @select="go(target)"
      >
        {{ homeText(`home.report.${target.key}`) }}
        <template #end>
          <span class="home-report__where">{{ homeText(`home.report.${target.key}Where`) }}</span>
        </template>
      </UiMenuItem>
    </UiMenu>
  </span>
</template>
