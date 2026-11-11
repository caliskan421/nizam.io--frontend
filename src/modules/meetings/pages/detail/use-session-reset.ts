import { onScopeDispose } from 'vue'
import { authSession } from '@/shared/http'

/** Aynı hesapta belirteç yenilemesi taslağı bozmaz; yeni oturum/hesap bozar. */
export function useSessionReset(reset: () => void) {
  let generation = authSession.generation
  let account = authSession.snapshot.accountId
  const unsubscribe = authSession.subscribe((snapshot) => {
    if (authSession.generation !== generation || snapshot.accountId !== account) reset()
    generation = authSession.generation
    account = snapshot.accountId
  })
  onScopeDispose(unsubscribe)
}
