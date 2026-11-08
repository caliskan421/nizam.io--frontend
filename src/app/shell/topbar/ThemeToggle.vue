<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import { topbarText } from './messages'
import { useThemeToggle } from './theme-toggle'

/** Tema düğmesi (E-00-37): koyuda güneş, açıkta ay — simge yalnız CSS ile değişir. */
const { toggle } = useThemeToggle()
</script>

<template>
  <button
    class="t-iconbtn rp-themebtn"
    type="button"
    data-testid="theme-toggle"
    :aria-label="topbarText('topbar.theme')"
    :title="topbarText('topbar.theme')"
    @click="toggle"
  >
    <UiIcon class="rp-ic-sun" name="sun" size="sm" />
    <UiIcon class="rp-ic-moon" name="moon" size="sm" />
  </button>
</template>
