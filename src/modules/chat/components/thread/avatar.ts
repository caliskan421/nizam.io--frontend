/**
 * Sohbet avatarı metni (E-10-09): "Genel" → "G"; koordinatörlük grubu → 3 harfli birim kodu (kod
 * yoksa ad baş harfleri); serbest grup → 2 baş harf; birebir → karşı tarafın baş harfleri.
 * "Koordinatörler" sistem grubu sözleşmede yoktur (BE-160): çizilmez.
 */
import type { Chat } from '../../model/types'

export function initials(name: string | null | undefined, count = 2): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return parts
    .slice(0, count)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

export interface AvatarFacts {
  chat: Pick<Chat, 'kind' | 'auto_kind' | 'source' | 'name' | 'counterpart_name'>
  departmentCode: string | null
  departmentName: string | null
}

export function avatarText(facts: AvatarFacts): string {
  const { chat } = facts
  if (chat.auto_kind === 'general') return 'G'
  if (chat.auto_kind === 'department' || chat.source === 'department') {
    const code = facts.departmentCode?.trim()
    return code
      ? code.slice(0, 3).toLocaleUpperCase('tr-TR')
      : initials(facts.departmentName ?? chat.name, 3)
  }
  return chat.kind === 'group' ? initials(chat.name) : initials(chat.counterpart_name)
}
