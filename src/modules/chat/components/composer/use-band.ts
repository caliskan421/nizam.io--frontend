/** Bağlam şeridi metni (E-10-51): yanıt "<Ad Soyad> kişisine yanıt" ya da "Düzenleniyor". */
import { computed } from 'vue'

import { chatText } from '../../messages'
import type { ChatMessage } from '../../model/types'
import type { ThreadContext } from '../thread/use-thread'
import { chatDrafts } from './drafts'

export function useBand(thread: ThreadContext) {
  const replied = computed<ChatMessage | null>(() => {
    const id = chatDrafts.get(thread.draftKey.value)?.replyTo
    return id ? thread.findMessage(id) : null
  })
  const bandTitle = computed(() => {
    if (chatDrafts.getEdit(thread.draftKey.value)) return chatText('chat.composer.editing')
    const m = replied.value
    const own = m?.sender_account_id === thread.meId.value ? chatText('chat.thread.me') : null
    const name = m ? (own ?? m.sender_name ?? thread.memberName(m.sender_account_id)) : null
    return chatText('chat.thread.replyTo', { name: name ?? chatText('chat.thread.unknownPerson') })
  })
  return { replied, bandTitle }
}
