import { effectScope } from 'vue'
import { expect, it, vi } from 'vitest'
import { authSession } from '@/shared/http'
import { useSessionReset } from './use-session-reset'
it('resets on an identity change but not a same-account token renewal', () => {
  authSession.establish({
    token: 'old',
    account_id: 'a',
    expires_at: 2000000000,
    force_password_change: false,
  })
  const reset = vi.fn()
  const scope = effectScope()
  scope.run(() => useSessionReset(reset))
  authSession.establish({
    token: 'new',
    account_id: 'a',
    expires_at: 2000000010,
    force_password_change: false,
  })
  expect(reset).not.toHaveBeenCalled()
  authSession.clear()
  expect(reset).toHaveBeenCalledOnce()
  scope.stop()
})
