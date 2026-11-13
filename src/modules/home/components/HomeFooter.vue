<script setup lang="ts">
import { computed } from 'vue'

import { homeText } from '../model/messages'
import { teamFacts } from '../model/team'
import type { DashboardReport } from '../model/types'

/**
 * Alt bilgi (E-01-39; `Main.dc.html` `orgLine`): koordinatörlük, kullanıcı ve rol sayıları pano
 * alanlarından. Veri yokken (yükleniyor/hata) satır çizilmez; karışık kapsam notu ekip şeridi
 * ipucundadır (E-01-19).
 */
const props = defineProps<{ report: DashboardReport | null }>()
const line = computed(() => {
  if (!props.report) return null
  const f = teamFacts(props.report)
  return homeText('home.footer.line', {
    coordinatorships: f.coordinatorships,
    users: f.users,
    admins: f.admins,
    coordinators: f.coordinators,
    members: f.members,
  })
})
</script>

<template>
  <footer v-if="line" class="home-footer" data-region="footer">
    <span class="rp-cap rp-trunc" :title="homeText('home.team.hint')">{{ line }}</span>
  </footer>
</template>
