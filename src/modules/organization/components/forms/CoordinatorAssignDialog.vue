<script setup lang="ts">
import './forms.css'

import { useForm } from 'vee-validate'
import { computed, shallowRef, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton, UiField, UiModal, useToast } from '@/shared/ui'

import { useAssignCoordinator } from '../../api'
import type { PersonOption } from '../../model/types'
import type { CoordinatorAssignDialogEmits, CoordinatorAssignDialogProps } from '../index'
import { personSchema, serverFieldErrors, toTypedSchema, useFormDialog } from './form-kit'
import { orgText } from './messages'
import PersonPicker from './PersonPicker.vue'

/**
 * W74 · E-08-33 "Koordinatör ata" (yalnız ŞY; koordinatörsüz kartta açılır — görünürlük
 * çağıranda). Kişi seçici (`listUsers`) → `assignCoordinator` (S2: program eylem anındaki seçili
 * program, departman yol parametresi). Onay kapısı yok (§7). 409 `membership_exists` → "zaten
 * ekipte" (veri katmanı listeyi yeniden okur); 422 `department_not_linked` → K7 metni. Anahtarsız:
 * sonuç bilinmiyorsa kör tekrar yok (bildirim yerinde, "Yeniden gönder" yok).
 */
const props = defineProps<CoordinatorAssignDialogProps>()
const emit = defineEmits<CoordinatorAssignDialogEmits>()

const store = useScopeStore()
const assign = useAssignCoordinator()
interface Values {
  person: PersonOption | null
}
const form = useForm<Values>({
  validationSchema: toTypedSchema<Values, Values>(
    personSchema(orgText('forms.coordinator.required')),
  ),
  initialValues: { person: null },
})
const [person] = form.defineField('person')
const errors = form.errors
const notice = shallowRef<MutationOutcome<unknown, unknown, unknown> | null>(null)

const dialog = useFormDialog({ open: () => props.open, close })
// Kurulumda (eşzamanlı) alınır: sökülmüş ekranın geç sonucu bildirim üretmez (Ö-07, W82c).
const toast = useToast()
const pending = computed(() => dialog.busy.value || assign.isPending.value)

watch(
  () => props.open,
  () => {
    form.resetForm({ values: { person: null } })
    notice.value = null
  },
)

function close(): void {
  emit('update:open', false)
}

function setOpen(value: boolean): void {
  if (!value && !pending.value) close()
}

const handle = form.handleSubmit(async ({ person: chosen }) => {
  const programId = store.snapshot.programId
  if (!programId || !chosen) return
  notice.value = null
  const outcome = await assign.submit({
    programId,
    departmentId: props.departmentId,
    accountId: chosen.accountId,
  })
  if (!dialog.alive() || outcome.kind === 'owner_disposed') return
  if (outcome.kind === 'success') {
    toast.push({ message: orgText('forms.coordinator.done') })
    emit('assigned', chosen.accountId)
    close()
    return
  }
  if (outcome.kind === 'failed') {
    const found = serverFieldErrors(
      outcome.error,
      { account_id: 'person' as const },
      { 'organization.membership_exists': 'person' as const },
    )
    if (found.person) return form.setErrors(found)
  }
  if (outcome.kind === 'unknown_outcome') {
    notice.value = outcome
    return
  }
  notifyOutcome(outcome)
})

function submit(): void {
  void dialog.once(() => handle())
}
</script>

<template>
  <UiModal
    :open="open"
    :title="orgText('forms.coordinator.title')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="of-assign-coordinator" class="of-form" novalidate @submit.prevent="submit">
      <UiField :label="orgText('forms.coordinator.field')" :error="errors.person">
        <PersonPicker v-model="person" :label="orgText('forms.coordinator.field')" />
      </UiField>
      <UiOutcomeNotice :outcome="notice" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen(false)">
        {{ orgText('forms.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="of-assign-coordinator"
        :disabled="pending"
        data-testid="of-submit"
      >
        {{ orgText('forms.coordinator.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
