import { computed, onScopeDispose, ref, shallowRef } from 'vue'

import { clientError, toApiError, type ApiError } from '@/shared/errors/api-error'
import { authSession } from '@/shared/http'

import {
  askAssistant,
  deleteConversation,
  listConversations,
  readConversation,
} from '../api/assistant'
import { QUESTION_LIMIT, type Conversation, type Message, type Turn } from './types'

type Activity = 'idle' | 'list' | 'read' | 'ask' | 'delete'
const USER_STOP = Symbol('assistant-stop')

function useAssistantRequests(close: () => void) {
  const generation = authSession.generation
  const account = authSession.snapshot.accountId
  const activity = ref<Activity>('idle')
  const error = shallowRef<ApiError | null>(null)
  const listError = shallowRef<ApiError | null>(null)
  let controller: AbortController | undefined
  let disposed = false
  const live = () =>
    !disposed && generation === authSession.generation && account === authSession.snapshot.accountId
  const off = authSession.subscribe(() => {
    if (live()) return
    controller?.abort()
    close()
  })
  onScopeDispose(() => {
    disposed = true
    controller?.abort()
    off()
  })

  async function run(kind: Activity, action: (signal: AbortSignal) => Promise<void>) {
    if (!live() || activity.value !== 'idle') return
    const next = new AbortController()
    controller = next
    activity.value = kind
    const timeout = setTimeout(() => next.abort(clientError('client.network_error')), 45_000)
    try {
      await action(next.signal)
    } catch (failure) {
      if (!live() || next.signal.reason === USER_STOP) return
      const target = kind === 'list' ? listError : error
      target.value = toApiError(next.signal.reason ?? failure)
    } finally {
      clearTimeout(timeout)
      controller = undefined
      if (live()) activity.value = 'idle'
    }
  }

  const unavailable = computed(() =>
    [listError.value, error.value].some(
      (failure) =>
        failure?.code === 'platform.route_not_found' ||
        failure?.code === 'organization.membership_required',
    ),
  )
  return {
    activity,
    error,
    listError,
    unavailable,
    live,
    run,
    stop: () => controller?.abort(USER_STOP),
  }
}

type Requests = ReturnType<typeof useAssistantRequests>

function messageTurn(message: Message): Turn {
  return { key: String(message.sira), role: message.rol, text: message.icerik }
}

function useAssistantHistory(program: string, request: Requests) {
  const conversations = shallowRef<Conversation[]>([])
  const turns = shallowRef<Turn[]>([])
  const selected = ref<string | null>(null)
  const truncated = ref(false)
  const status = ref('')
  const suggestions = ref(true)

  function refresh() {
    request.listError.value = null
    return request.run('list', async (signal) => {
      conversations.value = []
      const result = await listConversations(program, signal)
      if (!request.live()) return
      conversations.value = result.conversations
      truncated.value = result.truncated === true
    })
  }

  function reset() {
    selected.value = null
    turns.value = []
    status.value = ''
    request.error.value = null
    suggestions.value = true
  }

  function select(id: string) {
    if (request.activity.value !== 'idle') return
    reset()
    suggestions.value = false
    return request.run('read', async (signal) => {
      const result = await readConversation(program, id, signal)
      if (!request.live()) return
      selected.value = result.conversation.id
      turns.value = result.messages.map(messageTurn)
    })
  }

  function remove(id: string) {
    request.error.value = null
    return request.run('delete', async (signal) => {
      await deleteConversation(program, id, signal)
      if (!request.live()) return
      conversations.value = conversations.value.filter((item) => item.id !== id)
      if (selected.value === id) reset()
      status.value = 'Sohbet silindi.'
    })
  }
  return {
    conversations,
    turns,
    selected,
    status,
    truncated,
    suggestions,
    refresh,
    reset,
    select,
    remove,
  }
}

type History = ReturnType<typeof useAssistantHistory>

function useAssistantChat(program: string, request: Requests, history: History) {
  const draft = ref('')
  const pending = ref('')
  const tool = ref('')
  let sequence = 0

  function submit(question = draft.value) {
    const text = question.trim()
    if (
      !text ||
      [...text].length > QUESTION_LIMIT ||
      request.unavailable.value ||
      request.activity.value !== 'idle'
    )
      return
    const id = history.selected.value
    request.error.value = null
    history.status.value = ''
    tool.value = ''
    history.suggestions.value = false
    draft.value = ''
    pending.value = text
    return request.run('ask', async (signal) => {
      try {
        const answer = await askAssistant(
          program,
          { soru: text, sohbet_id: id ?? undefined },
          signal,
          (label) => {
            if (request.live()) tool.value = label
          },
        )
        if (!request.live()) return
        if (id && id !== answer.conversationId) throw clientError('client.network_error')
        history.selected.value = answer.conversationId
        history.turns.value = [
          ...history.turns.value,
          { key: 'q' + ++sequence, role: 'kullanici', text },
          {
            key: 'a' + sequence,
            role: 'asistan',
            text: answer.text,
            sources: answer.sources,
            views: answer.views,
          },
        ]
      } finally {
        if (request.live()) {
          pending.value = ''
          tool.value = ''
        }
      }
    })
  }

  function stop() {
    if (request.activity.value !== 'ask') return
    history.status.value = 'Yanıt bekleme durduruldu. Sohbet geçmişini kontrol edebilirsiniz.'
    request.stop()
  }

  return { draft, pending, tool, submit, stop }
}

export function useAssistantSession(program: string, close: () => void) {
  const requests = useAssistantRequests(close)
  const history = useAssistantHistory(program, requests)
  const chat = useAssistantChat(program, requests, history)
  const reset = () => {
    history.reset()
    chat.draft.value = ''
  }
  return { ...requests, ...history, ...chat, reset }
}
