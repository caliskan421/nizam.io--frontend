<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W76 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { PersonalTrackingProps } from '../index'

defineProps<PersonalTrackingProps>()
</script>

<template>
  <div data-skeleton="PersonalTracking" />
</template>
