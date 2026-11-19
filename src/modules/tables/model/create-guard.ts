import { shallowReactive } from 'vue'

import type { TableTarget } from './types'

type Phase = 'pending' | 'uncertain'
interface Hold {
  ticket: symbol
  phase: Phase
}

const locks = shallowReactive(new Map<string, Hold>())

/** Bellekte yalnız kapsam anahtarı ve işlem durumu tutulur. Form ayrılınca kilit kaybolmaz. */
export function tableCreationKey(accountId: string | null, target: TableTarget) {
  return JSON.stringify([accountId, target.programId, target.departmentId])
}

export const tableCreationPhase = (key: string) => locks.get(key)?.phase

export function beginTableCreation(key: string, retry: boolean): symbol | undefined {
  const hold = locks.get(key)
  if (retry ? hold?.phase !== 'uncertain' : hold !== undefined) return undefined
  const ticket = Symbol()
  locks.set(key, { ticket, phase: 'pending' })
  return ticket
}

export function finishTableCreation(key: string, ticket: symbol, uncertain: boolean) {
  if (locks.get(key)?.ticket !== ticket) return
  if (uncertain) locks.set(key, { ticket, phase: 'uncertain' })
  else locks.delete(key)
}

export async function reconcileTableCreation(key: string, reload: () => Promise<boolean>) {
  const hold = locks.get(key)
  if (hold?.phase !== 'uncertain') return false
  if (!(await reload()) || locks.get(key) !== hold) return false
  locks.delete(key)
  return true
}
