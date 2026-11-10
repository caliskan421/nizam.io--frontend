/**
 * Eylemin başladığı andaki bağlam (ortak-kurallar §7): kapsam + oturum nesli. Çakışma çözümü
 * gibi sonradan gelen "aynı isteğin tamamlanması" adımları bu bağlamla (`submit(vars, { context })`)
 * gönderilir; bu arada kapsam/oturum değiştiyse motor yazmayı göndermez. Etki kapsamı (kurulum)
 * içinde çağrılmalıdır (Pinia kapsam deposu).
 */
import { authSession } from '../index'
import { useScopeStore } from '@/shared/scope/store'

import type { ActionContext } from './outcome'

export function useActionContext(): () => ActionContext {
  const store = useScopeStore()
  return () => ({ scope: { ...store.snapshot }, generation: authSession.generation })
}
