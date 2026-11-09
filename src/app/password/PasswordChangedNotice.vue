<script setup lang="ts">
import '@/app/states/states.css'

import { statesText } from '@/app/states/messages'
import { UiIcon } from '@/shared/ui'

import { passwordChanged } from './password-flow'

/** Parola değiştirildi: giriş ekranında yeni parolayla giriş çağrısı (bir sonraki girişe kadar). */
</script>

<template>
  <p v-if="passwordChanged" class="shell-notice" role="status" data-testid="password-changed">
    <UiIcon name="check" size="sm" />
    <span>{{ statesText('states.password.done') }}</span>
  </p>
</template>
