import type { components } from '@/shared/api/schema'

type Schema = components['schemas']
export type Question = Schema['AssistantChatRequest']
export type Conversation = Schema['AssistantConversation']
export type Message = Schema['AssistantMessage']
export type SuggestedView = Schema['AssistantEventView']

export interface Answer {
  conversationId: string
  text: string
  sources: string[]
  views: SuggestedView[]
}

export interface Turn {
  key: string
  role: Message['rol']
  text: string
  sources?: string[]
  views?: SuggestedView[]
}

export const QUESTION_LIMIT = 2000

export const speakerLabel = (speaker: Turn['role']) =>
  ({ asistan: 'Asistan', kullanici: 'Siz' })[speaker]
