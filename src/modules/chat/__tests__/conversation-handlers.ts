// Konuşma gövdesinin okuduğu ikincil uçlar (üyeler, sabitler, birimler, kimlik): sayfa testleri
// bunları `server.use(...conversationHandlers())` ile ekler (W156; ChatPage.test.ts, KESİN 16).
import { http, HttpResponse } from 'msw'

const ORIGIN = 'http://localhost'

export interface ConversationHandlerOptions {
  accountId?: string
  companyAdmin?: boolean
  members?: unknown[]
  pins?: unknown[]
  /** `listChatMessageTasks` cevabı: mesaj kimliği → kart satırları (yoksa boş liste). */
  messageTasks?: Record<string, unknown[]>
  /** `listProgramDepartments` satırları (rol rozeti koordinatörlük adı). */
  departments?: unknown[]
}

export function conversationHandlers(options: ConversationHandlerOptions = {}) {
  const accountId = options.accountId ?? 'acc-1'
  return [
    http.get(`${ORIGIN}/v1/chats/:id/members`, () =>
      HttpResponse.json({ items: options.members ?? [], truncated: false }),
    ),
    http.get(`${ORIGIN}/v1/chats/:id/pins`, () =>
      HttpResponse.json({ items: options.pins ?? [], truncated: false }),
    ),
    http.get(`${ORIGIN}/v1/chats/:id/messages/:messageId/tasks`, ({ params }) =>
      HttpResponse.json({ items: options.messageTasks?.[String(params.messageId)] ?? [] }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () =>
      HttpResponse.json({ departments: options.departments ?? [] }),
    ),
    http.get(`${ORIGIN}/v1/me`, () =>
      HttpResponse.json({
        account_id: accountId,
        full_name: 'Ben Kişi',
        email: 'ben@ornek.test',
        company_admin: options.companyAdmin ?? false,
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () => HttpResponse.json({ departments: [] })),
    http.get(`${ORIGIN}/v1/programs`, () => HttpResponse.json({ programs: [] })),
  ]
}
