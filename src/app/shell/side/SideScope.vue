<script setup lang="ts">
import { nextTick, ref, type Ref } from 'vue'

import type { ScopeStep } from '@/shared/scope/resolve'

import DepartmentMenu from './DepartmentMenu.vue'
import LensMenu from './LensMenu.vue'
import ProgramMenu from './ProgramMenu.vue'
import ScopeCard from './ScopeCard.vue'
import { sideText } from './messages'
import { useSideScope, type SwitcherState } from './scope-view'

/**
 * Kapsam kartları ve menüleri (E-00-04…10, K2). Aynı anda tek menü açık; kart tıklaması
 * aç/kapat, perde (E-00-10) ve Esc kapatır ve odağı karta döndürür; seçim yaşam döngüsünün
 * `select*` işlevleriyle yapılır (kapsam değişimi → kapsamlı sorgular iptal + düşer).
 */
defineProps<{ switcher: SwitcherState | null }>()
const emit = defineEmits<{ 'update:switcher': [value: SwitcherState | null] }>()

const scope = useSideScope()
const { lifecycle, store } = scope
interface Focusable {
  focus: () => void
}
const cards: Record<ScopeStep, Ref<Focusable | null>> = {
  program: ref(null),
  lens: ref(null),
  department: ref(null),
}

function open(which: ScopeStep): void {
  emit('update:switcher', { which, focus: true })
}

function toggle(which: ScopeStep, current: SwitcherState | null): void {
  emit('update:switcher', current?.which === which ? null : { which, focus: true })
}

function close(which: ScopeStep, returnFocus: boolean): void {
  emit('update:switcher', null)
  if (returnFocus) void nextTick(() => cards[which].value?.focus())
}

function pickProgram(id: string): void {
  close('program', true)
  lifecycle.selectProgram(id)
}
function pickLens(lens: Parameters<typeof lifecycle.selectLens>[0]): void {
  close('lens', true)
  lifecycle.selectLens(lens)
}
function pickDepartment(id: string): void {
  close('department', true)
  lifecycle.selectDepartment(id)
}
</script>

<template>
  <div v-if="scope.visible.value" class="side-scope">
    <button
      v-if="switcher"
      type="button"
      class="side-scrim"
      tabindex="-1"
      :aria-label="sideText('side.closeMenu')"
      @click="close(switcher.which, true)"
    />
    <div class="side-pair">
      <ScopeCard
        :ref="cards.program"
        :label="sideText('side.card.program')"
        :accessible-name="
          sideText('side.card.programName', {
            name: scope.program.value?.name ?? sideText('side.card.choose'),
          })
        "
        :expanded="switcher?.which === 'program'"
        @toggle="toggle('program', switcher)"
        @open="open('program')"
      >
        <span
          v-if="scope.avatar.value"
          class="side-pav"
          :class="`side-pav--${scope.avatar.value.tone}`"
          aria-hidden="true"
          >{{ scope.avatar.value.initials }}</span
        >
        <span class="rp-trunc">{{
          scope.program.value?.name ?? sideText('side.card.choose')
        }}</span>
      </ScopeCard>
      <ScopeCard
        v-if="scope.showLens.value"
        :ref="cards.lens"
        :label="sideText('side.card.lens')"
        :accessible-name="
          sideText('side.card.lensName', {
            name: scope.lens.value
              ? sideText(`side.lens.${scope.lens.value}`)
              : sideText('side.card.choose'),
          })
        "
        :expanded="switcher?.which === 'lens'"
        :fixed="scope.lensFixed.value"
        :tone="scope.lens.value"
        @toggle="toggle('lens', switcher)"
        @open="open('lens')"
      >
        <span
          v-if="scope.lens.value"
          class="side-dot"
          :class="`side-dot--${scope.lens.value}`"
          aria-hidden="true"
        />
        <span class="rp-trunc">{{
          scope.lens.value
            ? sideText(`side.lens.${scope.lens.value}`)
            : sideText('side.card.choose')
        }}</span>
      </ScopeCard>
      <ProgramMenu
        v-if="switcher?.which === 'program'"
        :programs="lifecycle.programs.value"
        :selected-id="store.programId"
        :truncated="lifecycle.programsTruncated.value"
        :autofocus="switcher.focus"
        @select="pickProgram"
        @close="close('program', $event === 'escape')"
      />
      <LensMenu
        v-if="switcher?.which === 'lens' && !scope.lensFixed.value"
        :lenses="lifecycle.lenses.value"
        :selected="scope.lens.value"
        :autofocus="switcher.focus"
        @select="pickLens"
        @close="close('lens', $event === 'escape')"
      />
    </div>
    <div v-if="scope.showDepartment.value" class="side-slot">
      <ScopeCard
        :ref="cards.department"
        :label="sideText('side.card.department')"
        :accessible-name="
          sideText('side.card.departmentName', {
            name: scope.department.value?.displayName ?? sideText('side.card.choose'),
          })
        "
        :expanded="switcher?.which === 'department'"
        @toggle="toggle('department', switcher)"
        @open="open('department')"
      >
        <span class="rp-trunc">{{
          scope.department.value?.displayName ?? sideText('side.card.choose')
        }}</span>
      </ScopeCard>
      <DepartmentMenu
        v-if="switcher?.which === 'department'"
        :departments="lifecycle.departments.value"
        :selected-id="store.departmentId"
        :lens="scope.lens.value"
        :truncated="lifecycle.departmentsTruncated.value"
        :autofocus="switcher.focus"
        @select="pickDepartment"
        @close="close('department', $event === 'escape')"
      />
    </div>
  </div>
</template>
