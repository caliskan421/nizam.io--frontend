<script setup lang="ts">
import { ref } from 'vue'

import type { ScopeStep } from '@/shared/scope/resolve'

import { useDepartmentCode } from './department-code'
import { sideText } from './messages'
import { useSideScope } from './scope-view'

/**
 * Dar menü kapsam simgeleri (E-00-40; Kenar-Secici kural notu, P11): program harfleri
 * (BE-001), rol noktası, birim kodu (`ProgramDepartment.code`, yoksa baş harf). Admin
 * merceğinde birim simgesi yok. Tık (klavyeyle de) → menü genişler ve ilgili seçici açılır;
 * tek mercekte rol noktası salt gösterimdir.
 */
const emit = defineEmits<{ open: [which: ScopeStep] }>()
const scope = useSideScope()
const { code } = useDepartmentCode(ref(true))

function lensName(): string {
  return scope.lens.value ? sideText(`side.lens.${scope.lens.value}`) : sideText('side.card.choose')
}
</script>

<template>
  <div v-if="scope.visible.value" class="side-railscope" data-testid="rail-scope">
    <button
      type="button"
      class="side-railbtn"
      :aria-label="
        sideText('side.card.programName', {
          name: scope.program.value?.name ?? sideText('side.card.choose'),
        })
      "
      :title="scope.program.value?.name"
      @click="emit('open', 'program')"
    >
      <span
        class="side-pav side-pav--lg"
        :class="scope.avatar.value ? `side-pav--${scope.avatar.value.tone}` : 'side-pav--empty'"
        aria-hidden="true"
        >{{ scope.avatar.value?.initials }}</span
      >
    </button>
    <template v-if="scope.showLens.value">
      <span
        v-if="scope.lensFixed.value"
        class="side-railbtn side-railbtn--static"
        role="img"
        :aria-label="sideText('side.card.lensName', { name: lensName() })"
        :title="lensName()"
      >
        <span class="side-dot" :class="`side-dot--${scope.lens.value}`" />
      </span>
      <button
        v-else
        type="button"
        class="side-railbtn"
        :aria-label="sideText('side.card.lensName', { name: lensName() })"
        :title="lensName()"
        @click="emit('open', 'lens')"
      >
        <span
          v-if="scope.lens.value"
          class="side-dot"
          :class="`side-dot--${scope.lens.value}`"
          aria-hidden="true"
        />
        <span v-else class="side-dot side-dot--empty" aria-hidden="true" />
      </button>
    </template>
    <button
      v-if="scope.showDepartment.value"
      type="button"
      class="side-railbtn"
      :aria-label="
        sideText('side.card.departmentName', {
          name: scope.department.value?.displayName ?? sideText('side.card.choose'),
        })
      "
      :title="scope.department.value?.displayName"
      @click="emit('open', 'department')"
    >
      <span class="side-railcode rp-trunc" aria-hidden="true">{{ code ?? '—' }}</span>
    </button>
  </div>
</template>
