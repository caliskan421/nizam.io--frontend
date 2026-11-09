<script setup lang="ts">
import './forms.css'

import { useForm } from 'vee-validate'
import { computed, shallowRef, watch } from 'vue'
import { z } from 'zod'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useStanding } from '@/shared/scope/standing'
import type { TeamRole } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton, UiField, UiModal, UiSelect, useToast } from '@/shared/ui'

import { useAssignMembership, useDepartmentRoster } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import type { PersonOption } from '../../model/types'
import type { MemberAddDialogEmits, MemberAddDialogProps } from '../index'
import { personSchema, serverFieldErrors, toTypedSchema, useFormDialog } from './form-kit'
import { orgText, roleLabel } from './messages'
import PersonPicker from './PersonPicker.vue'

/**
 * W74 · E-08-79 "Üye ekle", E-05-33 seçici (ŞY ∨ bu birimin K). Kişi seçici (`listUsers`) + rol →
 * `assignMembership` (S2; onay kapısı yok, §7). Rol seçici yalnız ŞY'de (`chooseMembershipRole`;
 * K'nin gönderdiği rol sunucuda `uye`'ye zorlanır — K formunda seçici yok). Zaten ekipte olanlar
 * seçenekten düşülür (`listMembers`, aynı anahtar). 409 `membership_exists` → "zaten ekipte"
 * (liste yeniden okunur); 422 `department_not_linked` → K7 metni; 403 → yetki metni.
 */
const props = defineProps<MemberAddDialogProps>()
const emit = defineEmits<MemberAddDialogEmits>()

const ROLES = ['member', 'coordinator'] as const satisfies readonly TeamRole[]

const store = useScopeStore()
const { standing } = useStanding()
const assign = useAssignMembership()
const facts = computed(() =>
  organizationFacts(standing.value, store.snapshot.programId, {
    departmentId: props.departmentId,
  }),
)
const chooseRole = computed(() => can('chooseMembershipRole', facts.value))
const roster = useDepartmentRoster(
  () => props.departmentId,
  () => props.open && can('viewTeam', facts.value),
)
const exclude = computed(() => roster.members.value.map((m) => m.account_id))

interface Values {
  person: PersonOption | null
  role: TeamRole
}
const EMPTY: Values = { person: null, role: 'member' }
const form = useForm<Values>({
  validationSchema: toTypedSchema<Values, Values>(
    personSchema(orgText('forms.member.required')).extend({ role: z.enum(ROLES) }),
  ),
  initialValues: { ...EMPTY },
})
const [person] = form.defineField('person')
const [role] = form.defineField('role')
const errors = form.errors
const roleOptions = ROLES.map((r) => ({ value: r, label: roleLabel(r) }))
const notice = shallowRef<MutationOutcome<unknown, unknown, unknown> | null>(null)

const dialog = useFormDialog({ open: () => props.open, close })
const pending = computed(() => dialog.busy.value || assign.isPending.value)

watch(
  () => props.open,
  () => {
    form.resetForm({ values: { ...EMPTY } })
    notice.value = null
  },
)

function close(): void {
  emit('update:open', false)
}

function setOpen(value: boolean): void {
  if (!value && !pending.value) close()
}

const handle = form.handleSubmit(async (values) => {
  const programId = store.snapshot.programId
  const chosen = values.person
  if (!programId || !chosen) return
  notice.value = null
  const outcome = await assign.submit({
    programId,
    departmentId: props.departmentId,
    accountId: chosen.accountId,
    role: chooseRole.value ? values.role : 'member',
  })
  if (!dialog.alive() || outcome.kind === 'owner_disposed') return
  if (outcome.kind === 'success') {
    useToast().push({ message: orgText('forms.member.done') })
    emit('added', chosen.accountId)
    close()
    return
  }
  if (outcome.kind === 'failed') {
    const found = serverFieldErrors(
      outcome.error,
      { account_id: 'person' as const, role: 'role' as const },
      { 'organization.membership_exists': 'person' as const },
    )
    if (found.person || found.role) return form.setErrors(found)
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
    :title="orgText('forms.member.title')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="of-add-member" class="of-form" novalidate @submit.prevent="submit">
      <UiField :label="orgText('forms.member.field')" :error="errors.person">
        <PersonPicker
          v-model="person"
          :label="orgText('forms.member.field')"
          :exclude-account-ids="exclude"
        />
      </UiField>
      <UiField v-if="chooseRole" :label="orgText('forms.member.role')" :error="errors.role">
        <UiSelect v-model="role" name="role" :options="roleOptions" />
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
        form="of-add-member"
        :disabled="pending"
        data-testid="of-submit"
      >
        {{ orgText('forms.member.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
