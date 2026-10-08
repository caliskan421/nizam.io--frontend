import { getActivePinia } from 'pinia'

import { AuthSession } from '@/shared/session/auth-session'
import { browserCoordination } from '@/shared/session/coordination'
import { useScopeStore } from '@/shared/scope/store'

import { createApiClient } from './client'

export { createApiClient, type ApiClient } from './client'
export { unwrap } from './unwrap'

const baseUrl = globalThis.location?.origin ?? 'http://localhost'

/** Uygulamanın tek oturum nesnesi (belirteç yalnız bunun belleğinde). */
export const authSession = new AuthSession({
  baseUrl,
  fetch: (input) => globalThis.fetch(input),
  coordination: browserCoordination(),
})

/** Uygulamanın tek API istemcisi. Kapsam istek anında Pinia kapsam deposundan okunur. */
export const api = createApiClient({
  baseUrl,
  session: authSession,
  scope: () =>
    getActivePinia() ? useScopeStore().snapshot : { programId: null, departmentId: null },
})
