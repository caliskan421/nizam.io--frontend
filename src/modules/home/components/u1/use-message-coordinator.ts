/**
 * "Koordinatörüme yaz" (E-Ü1-21; W178 KUSUR 4): koordinatörle birebir sohbet açılır
 * (`openDirectChat`: 201 yeni, 200 mevcut — ikisi de "sohbeti aç") ve `/mesajlar/:id` açılır.
 * Yazma `useProtectedMutation` ile (anahtarsız uç, iyimser güncelleme yok); hata ortak bildirimle
 * (403 → "izin yok" sınıfı). Sahibi sökülmüş sonuç gezinme/bildirim başlatmaz (`reachesOwner`).
 */
import { useRouter } from 'vue-router'

import { CHAT_ROUTE, useOpenDirectChat } from '@/modules/chat/public'
import { reachesOwner } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome } from '@/shared/ui/confirm'

export function useMessageCoordinator() {
  const router = useRouter()
  const store = useScopeStore()
  const open = useOpenDirectChat()

  async function writeTo(accountId: string | null): Promise<void> {
    const programId = store.programId
    if (accountId === null || programId === null || open.isPending.value) return
    const outcome = await open.submit({ programId, accountId })
    if (!reachesOwner(outcome)) return
    if (outcome.kind === 'success') {
      await router.push({ name: CHAT_ROUTE.name, params: { chatId: outcome.data.chat_id } })
    } else {
      notifyOutcome(outcome)
    }
  }
  return { writeTo, pending: open.isPending }
}
