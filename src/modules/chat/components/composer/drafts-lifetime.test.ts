import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { bindDraftLifetime, chatDrafts, draftKey, unbindDraftLifetime } from './drafts'

function signIn(accountId: string): void {
  authSession.establish({
    token: `tok-${accountId}`,
    account_id: accountId,
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    force_password_change: false,
  } as never)
}

beforeEach(() => {
  setActivePinia(createPinia())
  signIn('acc-1')
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  chatDrafts.clearAll()
  bindDraftLifetime()
})
afterEach(() => {
  unbindDraftLifetime()
  chatDrafts.clearAll()
})

describe('taslak deposu yaşam bağı (KUSUR 8)', () => {
  it('program değişince boşalır; yazma çubuğu sökülmüş olsa da (modül yaşamı)', () => {
    const key = draftKey('acc-1', 'p1', 'c1')
    chatDrafts.setBody(key, 'yarım kalan')
    expect(chatDrafts.get(key)?.body).toBe('yarım kalan')
    useScopeStore().setProgram('p2')
    expect(chatDrafts.get(key)).toBeNull()
    // Aynı anahtara dönüş (p1) eski metni GERİ GETİRMEZ.
    useScopeStore().setProgram('p1')
    expect(chatDrafts.get(key)).toBeNull()
  })

  it('mercek/birim değişimi taslağı silmez (yalnız program ya da hesap)', () => {
    const key = draftKey('acc-1', 'p1', 'c1')
    chatDrafts.setBody(key, 'kalsın')
    useScopeStore().setLens('coordinator')
    expect(chatDrafts.get(key)?.body).toBe('kalsın')
  })

  it('hesap değişince boşalır', () => {
    const key = draftKey('acc-1', 'p1', 'c1')
    chatDrafts.setBody(key, 'önceki hesap')
    signIn('acc-2')
    expect(chatDrafts.get(key)).toBeNull()
  })

  it('bağlama tekildir: ikinci çağrı ikinci dinleyici eklemez; söküm sonrası boşaltma yok', () => {
    bindDraftLifetime()
    const key = draftKey('acc-1', 'p1', 'c1')
    unbindDraftLifetime()
    chatDrafts.setBody(key, 'bağsız')
    useScopeStore().setProgram('p2')
    expect(chatDrafts.get(key)?.body).toBe('bağsız')
  })
})
