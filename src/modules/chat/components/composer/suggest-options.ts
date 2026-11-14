/**
 * Öneri adayları (saf): `@` → "herkes" (yalnız yönetici/kurucuya), sohbetle ilgili koordinatörlükler
 * (birim sohbetinde kendi birimi, program sohbetinde hepsi), sohbet üyeleri (kendim hariç); `#` →
 * görevler. Süzme sözcük başına göre (`matches`), en çok `MAX_SUGGESTIONS`.
 */
import type { WorkItem } from '@/modules/work/public'

import type { Chat, ChatMember, ChatMention } from '../../model/types'
import { chatText } from '../../messages'
import { mentionToken, refToken } from '../thread/rich-text'
import { matches, MAX_SUGGESTIONS } from './suggest'

export interface SuggestOption {
  id: string
  label: string
  /** Metne yazılacak çip. */
  token: string
  /** Görev önerisinde birim kodu. */
  code: string | null
  mention?: ChatMention
  task?: { targetId: string }
}

export interface MentionSources {
  chat: Pick<Chat, 'source' | 'source_department_id'> | undefined
  allowAll: boolean
  departments: readonly { department_id: string; name: string }[]
  members: readonly ChatMember[]
  meId: string | null
}

const option = (id: string, label: string, mention: ChatMention): SuggestOption => ({
  id,
  label,
  token: mentionToken(label),
  code: null,
  mention,
})

function relevantDepartments(sources: MentionSources) {
  const { chat, departments } = sources
  if (chat?.source === 'department') {
    return departments.filter((d) => d.department_id === chat.source_department_id)
  }
  return chat?.source === 'program' ? departments : []
}

export function mentionOptions(query: string, sources: MentionSources): SuggestOption[] {
  const all = chatText('chat.thread.mentionAll')
  const out: SuggestOption[] = []
  if (sources.allowAll && matches(query, all)) out.push(option('all', all, { kind: 'all' }))
  for (const d of relevantDepartments(sources).filter((d) => matches(query, d.name))) {
    out.push(option(d.department_id, d.name, { kind: 'department', target_id: d.department_id }))
  }
  for (const m of sources.members) {
    if (m.account_id === sources.meId || !matches(query, m.full_name)) continue
    out.push(option(m.account_id, m.full_name, { kind: 'account', target_id: m.account_id }))
  }
  return out.slice(0, MAX_SUGGESTIONS)
}

export function taskOptions(
  query: string,
  items: readonly WorkItem[],
  codeOf: (departmentId: string) => string | null,
): SuggestOption[] {
  return items
    .filter((item) => matches(query, item.title))
    .slice(0, MAX_SUGGESTIONS)
    .map((item) => ({
      id: item.work_item_id,
      label: item.title,
      token: refToken(item.title),
      code: codeOf(item.department_id),
      task: { targetId: item.work_item_id },
    }))
}
