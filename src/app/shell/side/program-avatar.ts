/**
 * Program avatarı ve birim kodu (E-00-04, E-00-07, E-00-40). Harfler `Program.short_name`,
 * renk `Program.color` palet anahtarıdır (BE-001, PROGRAM-K46). Alan verilmemişse (`null`)
 * gösterim türetilir: harfler adın baş harflerinden, renk kimlikten. Renk paleti token'dır
 * (`--avatar-1…8` + `--on-avatar`), sabit hex yok.
 *
 * Ayırt edicilik (O4 görsel borç: iki program aynı "T2" + aynı renk): türetilen değerler program
 * LİSTESİ içinde ayrışır. Açık (sunucudan gelen) değerler olduğu gibi gösterilir ve çakışma
 * sayılır; kimlik sırasıyla (girdi sırasından bağımsız, kararlı) her türetilen renk için önce
 * kimlik özetinden ton verilir, en az kullanılan sıradaki ton seçilir (≤ 8 programda hepsi
 * farklı). Baş harf çakışmasında ilk program (kimlik sırası) standart harfleri korur, diğerleri
 * ikinci harfi değiştirir: önce adın son karakteri ("Teknofest 2026" → "T6"), sonra adın
 * sıradaki harfleri.
 */
import type { ProgramColor } from '@/shared/scope/standing-facts'

/** Sözleşme paleti (`Program.color` sıralı enum'u); gösterim tokenı `side.css`'te eşlenir. */
export const AVATAR_TONES = [
  'violet',
  'gold',
  'blue',
  'teal',
  'green',
  'orange',
  'red',
  'slate',
] as const satisfies readonly ProgramColor[]
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

/** Kimlikten kararlı ton (FNV-1a özeti; aynı program her yerde aynı taban renk). */
export function toneOf(id: string): AvatarTone {
  let hash = 0x811c9dc5
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length]!
}

/** Çakışmada denenecek ikinci harfler: adın son karakteri, sonra sıradaki harfler. */
function alternativeInitials(name: string): string[] {
  const chars = Array.from(name.replace(/\s+/g, '')).map((c) => c.toLocaleUpperCase('tr-TR'))
  const first = chars[0]
  if (first === undefined) return []
  const seconds = [chars[chars.length - 1], ...chars.slice(1)].filter((c) => c !== undefined)
  return [...new Set(seconds.map((c) => `${first}${c}`))]
}

type ProgramLike = {
  programId: string
  name: string
  shortName?: string | null
  color?: ProgramColor | null
}

function assignInitials(sorted: readonly ProgramLike[]): Map<string, string> {
  const out = new Map<string, string>()
  const used = new Set<string>()
  // Sunucudan gelen kısa ad olduğu gibi gösterilir ve çakışma kümesine girer.
  for (const p of sorted) {
    if (!p.shortName) continue
    out.set(p.programId, p.shortName)
    used.add(p.shortName)
  }
  const derived = sorted.filter((p) => !out.has(p.programId))
  const standard = new Map(derived.map((p) => [p.programId, initialsOf(p.name)]))
  // Önce her standart harf grubunun ilk programı (kimlik sırası) standardı alır.
  for (const p of derived) {
    const std = standard.get(p.programId)!
    if (used.has(std)) continue
    used.add(std)
    out.set(p.programId, std)
  }
  for (const p of derived) {
    if (out.has(p.programId)) continue
    const std = standard.get(p.programId)!
    const pick = alternativeInitials(p.name).find((c) => !used.has(c)) ?? std
    used.add(pick)
    out.set(p.programId, pick)
  }
  return out
}

function assignTones(sorted: readonly ProgramLike[]): Map<string, AvatarTone> {
  const count = new Map<AvatarTone, number>(AVATAR_TONES.map((t) => [t, 0]))
  const out = new Map<string, AvatarTone>()
  for (const p of sorted) {
    if (!p.color) continue
    out.set(p.programId, p.color)
    count.set(p.color, count.get(p.color)! + 1)
  }
  for (const p of sorted) {
    if (out.has(p.programId)) continue
    const base = AVATAR_TONES.indexOf(toneOf(p.programId))
    const ring = AVATAR_TONES.map((_, i) => AVATAR_TONES[(base + i) % AVATAR_TONES.length]!)
    const least = Math.min(...ring.map((t) => count.get(t)!))
    const tone = ring.find((t) => count.get(t) === least)!
    count.set(tone, least + 1)
    out.set(p.programId, tone)
  }
  return out
}

// Son listenin sonucu (menü her satır için çağırır); anahtar kimlik + ad içeriğidir, dizi
// yerinde değişse de bayat sonuç dönmez.
let last: { key: string; value: Map<string, ProgramAvatar> } | null = null

/** Liste içindeki avatarlar (kimlik → avatar). */
export function programAvatars(programs: readonly ProgramLike[]): Map<string, ProgramAvatar> {
  const key = programs
    .map((p) => `${p.programId}\u0000${p.name}\u0000${p.shortName ?? ''}\u0000${p.color ?? ''}`)
    .join('\u0001')
  if (last?.key === key) return last.value
  const sorted = [...programs].sort((a, b) =>
    a.programId < b.programId ? -1 : a.programId > b.programId ? 1 : 0,
  )
  const initials = assignInitials(sorted)
  const tones = assignTones(sorted)
  const out = new Map(
    sorted.map((p) => [
      p.programId,
      { initials: initials.get(p.programId)!, tone: tones.get(p.programId)! },
    ]),
  )
  last = { key, value: out }
  return out
}

/**
 * Programın avatarı; `peers` kullanıcının program listesidir (menü ve kart aynı listeyi verir,
 * böylece ikisi aynı harf/rengi gösterir). Liste programı içermiyorsa programın kendisi eklenir.
 */
export function programAvatar(
  program: ProgramLike,
  peers: readonly ProgramLike[] = [program],
): ProgramAvatar {
  const list = peers.some((p) => p.programId === program.programId) ? peers : [...peers, program]
  return programAvatars(list).get(program.programId)!
}

/** Dar menü birim etiketi: `ProgramDepartment.code`, yoksa birim adının baş harfleri. */
export function departmentCode(code: string | null | undefined, displayName: string): string {
  const trimmed = code?.trim()
  return trimmed ? trimmed : initialsOf(displayName)
}
