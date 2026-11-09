/**
 * Zorunlu parola değişimi yazması (P14; 00-ortak `backend.md` §6): `changePassword`
 * (`POST /v1/auth/password`, S1, gövde `ChangePasswordRequest {current_password, new_password}`,
 * yanıt `ChangePasswordResponse {revoked_sessions}`). Uç `force_password_change` kısıtından muaftır
 * ve başarıda hesabın BÜTÜN oturumlarını düşürüp yenileme çerezini temizler.
 *
 * Parola YALNIZ formun belleğindedir (KESİN 7; `TemporaryPasswordDialog` kalıbı):
 *  - mutasyon önbellekte tutulmaz (`gcTime: 0` + her sonuçtan sonra `reset()`);
 *  - dönen sonuçta taslak parolasızdır; "sonuç bilinmiyor"da aynı gövdeyle yeniden gönderim
 *    (`retry`) kapatılır — kapanış parolayı taşıyacaktı; kullanıcı formu yeniden gönderir;
 *  - geçersizlenecek sorgu yoktur (oturum zaten biter).
 */
import { api } from '@/shared/http'
import {
  isDetached,
  markDetached,
  useProtectedMutation,
  type MutationOutcome,
} from '@/shared/http/mutation'
import type { components } from '@/shared/api/schema'

type ChangePasswordResponse = components['schemas']['ChangePasswordResponse']

export interface ChangePasswordInput {
  current: string
  next: string
}

export type ChangePasswordOutcome = MutationOutcome<ChangePasswordInput, ChangePasswordResponse>

const BLANK: ChangePasswordInput = { current: '', next: '' }

/** Sonuçtan parolaları ve parolayı kapanışında taşıyan yeniden gönderimi düşürür. */
export function redactPasswords(outcome: ChangePasswordOutcome): ChangePasswordOutcome {
  if (!('draft' in outcome)) return outcome
  const redacted: ChangePasswordOutcome =
    outcome.kind === 'unknown_outcome'
      ? { ...outcome, draft: { ...BLANK }, retry: null }
      : { ...outcome, draft: { ...BLANK } }
  return isDetached(outcome) ? markDetached(redacted) : redacted
}

export function useChangePassword() {
  const mutation = useProtectedMutation<ChangePasswordInput, ChangePasswordResponse, unknown>({
    operation: 'changePassword',
    gcTime: 0,
    send: (vars, ctx) =>
      api.POST('/v1/auth/password', {
        body: { current_password: vars.current, new_password: vars.next },
        signal: ctx.signal,
      }),
  })

  async function submit(vars: ChangePasswordInput): Promise<ChangePasswordOutcome> {
    try {
      return redactPasswords(await mutation.submit(vars))
    } finally {
      mutation.reset()
    }
  }

  return { submit, isPending: mutation.isPending }
}
