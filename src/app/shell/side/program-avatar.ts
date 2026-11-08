/**
 * Program avatarı ve birim kodu (E-00-04, E-00-07, E-00-40). Programda kısa ad / renk alanı
 * yoktur (BE-001): harfler adın baş harflerinden, renk kimlikten türetilir ve `designStub`
 * ile işaretlenir. Renk paleti token'dır (`--avatar-1…5` + `--on-avatar`), sabit hex yok.
 */
import { designStub } from '@/shared/design-stub'

export const AVATAR_TONES = [1, 2, 3, 4, 5] as const
export type AvatarTone = (typeof AVATAR_TONES)[number]

export interface ProgramAvatar {
  initials: string
  tone: AvatarTone
}

/** İlk iki sözcüğün ilk harfleri, `tr-TR` büyük harf (i → İ). */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toLocaleUpperCase('tr-TR')
}

/** Kimlikten kararlı ton (aynı program her yerde aynı renk). */
export function toneOf(id: string): AvatarTone {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length]!
}

export function programAvatar(program: { programId: string; name: string }): ProgramAvatar {
  return designStub('BE-001', {
    initials: initialsOf(program.name),
    tone: toneOf(program.programId),
  })
}

/** Dar menü birim etiketi: `ProgramDepartment.code`, yoksa birim adının baş harfleri. */
export function departmentCode(code: string | null | undefined, displayName: string): string {
  const trimmed = code?.trim()
  return trimmed ? trimmed : initialsOf(displayName)
}
