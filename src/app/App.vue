<script setup lang="ts">
import { onMounted } from 'vue'

import DefaultLayout from '@/app/layouts/DefaultLayout.vue'
import UpdateRequired from '@/app/UpdateRequired.vue'
import { useInstanceStore } from '@/shared/instance/store'
import { useSessionStore } from '@/shared/session/store'

const instance = useInstanceStore()
const session = useSessionStore()

// Açılış sırası: kurulum profili (api_version) → sessiz refresh (HttpOnly çerez).
onMounted(async () => {
  const status = await instance.load()
  if (status !== 'update_required') await session.bootstrap()
})
</script>

<template>
  <DefaultLayout>
    <UpdateRequired v-if="instance.status === 'update_required'" />
    <RouterView v-else />
  </DefaultLayout>
</template>
