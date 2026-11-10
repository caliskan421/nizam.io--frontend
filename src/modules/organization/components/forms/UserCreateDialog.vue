<script setup lang="ts">
import './forms.css'

import { useForm } from 'vee-validate'
import { computed, shallowRef, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton, UiField, UiHint, UiInput, UiModal, UiSelect, useToast } from '@/shared/ui'

import { transferOffer, useCreateUser, useProgramDepartmentIndex } from '../../api'
import type { CreateUserInput } from '../../model/types'
import { can, organizationFacts } from '../../model/capabilities'
import type { UserCreateDialogEmits, UserCreateDialogProps } from '../index'
import { serverFieldErrors, toTypedSchema, useFormDialog } from './form-kit'
import { useTransferOffer, userBody, type BoundOffer } from './use-transfer-offer'
import { orgText, roleLabel } from './messages'
import {
  emptyUser,
  pickDepartment,
  USER_CODES,
  USER_FIELDS,
  USER_ROLES,
  userSchema,
  type UserValues,
} from './user-schema'

/**
 * W74 · E-05-05 "Kullanıcı oluştur" (P14; davet değil — e-posta daveti yok, BE-013). P3 en sade
 * form: e-posta, ad soyad, koordinatörlük (seçili programın birimi), rol (yalnız ŞY seçer).
 * `createUser` (S1, anahtarsız) parola göndermez ve yanıtta parola beklemez; ikinci adım
 * "Geçici parola belirle" çağıranda (`created` → `TemporaryPasswordDialog`).
 *
 * 409 `identity.account_exists` + `organization.transfer_available` → aktarım teklifi: hesap
 * kimliği `fields[field=account_id]` girdisinin değerindedir (BE-107, v0.15); "Mevcut hesabı bu
 * birime ekle" AYNI gövdeyi `transfer_account_id` ile yeni bir kullanıcı eylemi olarak gönderir
 * (201; yeni hesap açılmaz). Girdiler yoksa (koordinatör / hesap ekipte zaten var) teklif
 * çizilmez, olağan hata gösterilir (ORGANIZATION-K22). Alan hataları (`identity.invalid_email`, `identity.invalid_full_name`,
 * `identity.account_email_deleted`, `department_not_linked`) forma; sonuç bilinmiyorsa kör tekrar
 * yok (veri katmanı listeyi yeniden okur).
 */
const props = withDefaults(defineProps<UserCreateDialogProps>(), { departmentId: null })
const emit = defineEmits<UserCreateDialogEmits>()

const store = useScopeStore()
const { standing } = useStanding()
const create = useCreateUser()
const index = useProgramDepartmentIndex(() => props.open)

const empty = () => emptyUser(props.departmentId)
const form = useForm<UserValues>({
  validationSchema: toTypedSchema<UserValues, UserValues>(userSchema()),
  initialValues: empty(),
})
const [email] = form.defineField('email')
const [fullName] = form.defineField('fullName')
const [department] = form.defineField('departmentId')
const [role] = form.defineField('role')
const errors = form.errors

const departmentOptions = computed(() =>
  index.departments.value.map((d) => ({ value: d.department_id, label: d.display_name })),
)
const noDepartment = computed(
  () => index.query.isSuccess.value && departmentOptions.value.length === 0,
)
const chooseRole = computed(() =>
  can(
    'chooseMembershipRole',
    organizationFacts(standing.value, store.snapshot.programId, {
      departmentId: form.values.departmentId || null,
    }),
  ),
)
const roleOptions = USER_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))

/** Aktarım teklifi (409 `organization.transfer_available`); ilk gövde + bağlama bağlı (Ö-02). */
const bound = useTransferOffer(() => form.values, chooseRole)
const offer = computed(() => bound.value?.offer ?? null)
const notice = shallowRef<MutationOutcome<unknown, unknown, unknown> | null>(null)

const dialog = useFormDialog({ open: () => props.open, close })
// Kurulumda (eşzamanlı) alınır: sökülmüş ekranın geç sonucu bildirim üretmez (Ö-07, W82c).
const toast = useToast()
const pending = computed(() => dialog.busy.value || create.isPending.value)

watch(
  () => props.open,
  () => {
    form.resetForm({ values: empty() })
    bound.value = null
    notice.value = null
  },
)
watch(
  [() => props.open, departmentOptions],
  ([isOpen, options]) => {
    if (!isOpen || options.length === 0) return
    const next = pickDepartment(form.values.departmentId, options)
    if (next !== form.values.departmentId) form.setFieldValue('departmentId', next)
  },
  { immediate: true },
)

function close(): void {
  emit('update:open', false)
}

function setOpen(value: boolean): void {
  if (!value && !pending.value) close()
}

type CreateOutcome = Awaited<ReturnType<typeof create.submit>>

/**
 * Oluştur / aktar: her ikisi de ayrı kullanıcı eylemidir (anahtarsız uç). Aktarım teklifin
 * SAKLANAN gövdesini ve bağlamını kullanır (güncel form değil): kapsam değiştiyse motor isteği
 * göndermez (`scope_changed`).
 */
async function send(values: UserValues, transfer: BoundOffer | null): Promise<void> {
  const programId = store.snapshot.programId
  if (!programId) return
  notice.value = null
  bound.value = null
  const body = transfer ? transfer.body : userBody(values, programId, chooseRole.value)
  const outcome = await create.submit(
    transfer ? { ...body, transferAccountId: transfer.offer.accountId } : body,
    transfer ? { context: transfer.context } : undefined,
  )
  if (!dialog.alive() || outcome.kind === 'owner_disposed') return
  if (outcome.kind === 'success') {
    toast.push({ message: orgText('forms.user.done') })
    emit('created', outcome.data.account_id)
    close()
    return
  }
  settleFailure(outcome, transfer !== null, body)
}

/** Alan hatası / aktarım teklifi / sonuç bilinmiyor / ortak bildirim. */
function settleFailure(
  outcome: Exclude<CreateOutcome, { kind: 'success' }>,
  transferring: boolean,
  body: CreateUserInput,
) {
  if (outcome.kind === 'failed') {
    const found = transferring ? null : transferOffer(outcome.error)
    if (found) {
      bound.value = { offer: found, body, context: outcome.context }
      return
    }
    const fields = serverFieldErrors(outcome.error, USER_FIELDS, USER_CODES)
    if (Object.keys(fields).length > 0) return form.setErrors(fields)
  }
  if (outcome.kind === 'unknown_outcome') {
    notice.value = outcome
    return
  }
  notifyOutcome(outcome)
}

const handle = form.handleSubmit((values) => send(values, null))
const handleTransfer = form.handleSubmit((values) => send(values, bound.value))

function submit(): void {
  void dialog.once(() => handle())
}

function transfer(): void {
  if (bound.value) void dialog.once(() => handleTransfer())
}
</script>

<template>
  <UiModal
    :open="open"
    :title="orgText('forms.user.title')"
    :description="orgText('forms.user.description')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="of-create-user" class="of-form" novalidate @submit.prevent="submit">
      <UiHint v-if="noDepartment" data-testid="of-no-department">
        {{ orgText('forms.user.noDepartment') }}
      </UiHint>
      <UiField :label="orgText('forms.user.field.email')" :error="errors.email">
        <UiInput v-model="email" type="email" name="email" autocomplete="off" />
      </UiField>
      <UiField :label="orgText('forms.user.field.fullName')" :error="errors.fullName">
        <UiInput v-model="fullName" name="fullName" autocomplete="off" />
      </UiField>
      <div class="of-row">
        <UiField :label="orgText('forms.user.field.department')" :error="errors.departmentId">
          <UiSelect
            v-model="department"
            name="departmentId"
            :options="departmentOptions"
            :placeholder="orgText('forms.user.field.departmentPlaceholder')"
          />
        </UiField>
        <UiField v-if="chooseRole" :label="orgText('forms.user.field.role')" :error="errors.role">
          <UiSelect v-model="role" name="role" :options="roleOptions" />
        </UiField>
      </div>
      <div v-if="offer" class="of-note" role="alert" data-testid="of-transfer">
        <p class="of-note__title">
          {{
            offer.fullName
              ? orgText('forms.user.transfer.titleNamed', { name: offer.fullName })
              : orgText('forms.user.transfer.title')
          }}
        </p>
        <p>{{ orgText('forms.user.transfer.body') }}</p>
        <div class="of-note__actions">
          <UiButton
            size="sm"
            :disabled="pending"
            data-testid="of-transfer-action"
            @click="transfer"
          >
            {{ orgText('forms.user.transfer.action') }}
          </UiButton>
        </div>
      </div>
      <UiOutcomeNotice :outcome="notice" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen(false)">
        {{ orgText('forms.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="of-create-user"
        :disabled="pending || noDepartment"
        data-testid="of-submit"
      >
        {{ orgText('forms.user.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
