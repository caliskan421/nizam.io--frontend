<script setup lang="ts">
import './panel.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { errorText } from '@/shared/i18n'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { DesignStub, UiIcon, useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useDeleteUser, useUnlockAccount } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import TemporaryPasswordDialog from '../forms/TemporaryPasswordDialog.vue'
import { usersText } from './messages'
import { reportOutcome } from './use-chip-actions'

/**
 * E-05-34…36 + satır dışı hesap eylemleri (P14, #15). Görünürlük `capabilities.ts`; kendi
 * hesabında yıkıcı eylem (sil) gizli (ORGANIZATION-K20).
 *  - Şifre sıfırlama bağlantısı: devre dışı `designStub('BE-013')` (bağlantı yok).
 *  - Hesabı kilitle: devre dışı `designStub('BE-012')`; kilit durumu okunamaz, gösterge yok.
 *  - Geçici parola belirle (ŞY): W74 `TemporaryPasswordDialog` (parola yalnız form belleğinde).
 *  - Giriş kilidini kaldır (ŞY): her zaman görünür; 409 `account_not_locked` → bilgi.
 *  - Kullanıcıyı sil: `deleteUser` onay kapısı yok → istemci yıkıcı onayı (`confirmWrite`,
 *    "açık görevleri size devredilir"); vazgeçte istek yok; başarıda `deleted`.
 */
const props = defineProps<{ accountId: string; name: string }>()
const emit = defineEmits<{ deleted: [accountId: string] }>()

const store = useScopeStore()
const { standing } = useStanding()
const { confirmWrite } = useConfirm()
const remove = useDeleteUser()
const unlock = useUnlockAccount()
const queryClient = useQueryClient()

const facts = computed(() =>
  organizationFacts(standing.value, store.programId, { accountId: props.accountId }),
)
const passwordOpen = ref(false)

async function onUnlock(): Promise<void> {
  if (unlock.isPending.value) return
  const outcome = await unlock.submit({ accountId: props.accountId })
  if (outcome.kind === 'failed' && outcome.error.code === 'identity.account_not_locked') {
    useToast().push({ message: errorText(outcome.error) })
    return
  }
  // Hesap yok (silinmiş olabilir): ileti + liste yeniden okunur (05 backend §2 E-05-35).
  if (outcome.kind === 'failed' && outcome.error.code === 'identity.account_not_found') {
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
  }
  reportOutcome(outcome, 'users.panel.account.unlocked')
}

async function onDelete(): Promise<void> {
  if (remove.isPending.value) return
  const accountId = props.accountId
  const options = {
    title: usersText('users.panel.account.deleteTitle'),
    body: [usersText('users.panel.account.deleteBody', { name: props.name })],
    confirmLabel: usersText('users.panel.account.deleteConfirm'),
    tone: 'danger' as const,
  }
  // Silme onayın yakaladığı bağlamla başlar (CX-F1-E-02); vazgeç/iptal → null, istek yok.
  const outcome = await confirmWrite(options, (context) =>
    remove.submit({ accountId }, { context }),
  )
  if (outcome === null || outcome.kind === 'owner_disposed') return
  if (outcome.kind !== 'success') {
    notifyOutcome(outcome)
    return
  }
  useToast().push({ message: usersText('users.panel.account.deleted') })
  emit('deleted', accountId)
}
</script>

<template>
  <div class="users-account" data-testid="user-account">
    <DesignStub id="BE-013" as="div">
      <button class="rp-menuitem" type="button" disabled data-testid="account-reset">
        <UiIcon name="mail" size="sm" />
        <span class="rp-menuitem__label rp-trunc">
          {{ usersText('users.panel.account.resetLink') }}
        </span>
      </button>
    </DesignStub>
    <DesignStub id="BE-012" as="div">
      <button class="rp-menuitem" type="button" disabled data-testid="account-lock">
        <UiIcon name="lock" size="sm" />
        <span class="rp-menuitem__label rp-trunc">
          {{ usersText('users.panel.account.lock') }}
        </span>
      </button>
    </DesignStub>
    <button
      v-if="can('setTemporaryPassword', facts)"
      class="rp-menuitem"
      type="button"
      data-testid="account-password"
      @click="passwordOpen = true"
    >
      <UiIcon name="shield" size="sm" />
      <span class="rp-menuitem__label rp-trunc">
        {{ usersText('users.panel.account.temporaryPassword') }}
      </span>
    </button>
    <button
      v-if="can('unlockAccount', facts)"
      class="rp-menuitem"
      type="button"
      :disabled="unlock.isPending.value"
      data-testid="account-unlock"
      @click="onUnlock"
    >
      <UiIcon name="unlock" size="sm" />
      <span class="rp-menuitem__label rp-trunc">
        {{ usersText('users.panel.account.unlock') }}
      </span>
    </button>
    <button
      v-if="can('deleteUser', facts)"
      class="rp-menuitem rp-menuitem--danger"
      type="button"
      :disabled="remove.isPending.value"
      data-testid="account-delete"
      @click="onDelete"
    >
      <UiIcon name="trash" size="sm" />
      <span class="rp-menuitem__label rp-trunc">
        {{ usersText('users.panel.account.delete') }}
      </span>
    </button>
    <TemporaryPasswordDialog
      v-if="passwordOpen"
      v-model:open="passwordOpen"
      :account-id="accountId"
    />
  </div>
</template>
