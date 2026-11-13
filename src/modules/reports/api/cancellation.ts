/**
 * Uçuştaki rapor eyleminin iptal bağları (KESİN 26a): sahip (bileşen/etki kapsamı) sökülmesi,
 * kapsam (program/mercek/departman) değişimi ve oturum DEĞİŞİMİ (çıkış / başka hesap; belirteç
 * yenilemesi iptal değildir) kiralamayı iptal eder — bilet tüketilmez, dosya kaydedilmez.
 */
import { getCurrentScope, onScopeDispose } from 'vue'

import { authSession } from '@/shared/http'
import { ownerLife } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import type { ReportLease } from '../model/gate'

export function bindLeaseCancellation(current: () => ReportLease | null) {
  const store = useScopeStore()
  const now = () => current()?.cancel()
  const stamp = () => ({
    generation: authSession.generation,
    accountId: authSession.snapshot.accountId,
  })
  let session = stamp()
  ownerLife(now)
  const offs = [
    store.onChange(now),
    authSession.subscribe((snapshot) => {
      if (
        snapshot.accountId !== session.accountId ||
        authSession.generation !== session.generation
      ) {
        now()
      }
    }),
  ]
  if (getCurrentScope()) onScopeDispose(() => offs.forEach((off) => off()))
  return {
    now,
    /** Eylem başlarken oturum damgasını yeniler. */
    stamp: () => {
      session = stamp()
    },
  }
}
