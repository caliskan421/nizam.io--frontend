/**
 * Zaman biçimleri (ozellikler §4): akışta "SS:dd", gün ayırıcı "Bugün" / "Dün" / "G Aaa YYYY",
 * anket sonu "G Ayyy YYYY SS:dd". Tarayıcının yerel saat dilimi (kurulum saat dilimi) kullanılır;
 * `now` testte sahte saattir.
 */
const clock = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })
const dayFull = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const pollEnd = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function clockOf(iso: string): string {
  return clock.format(new Date(iso))
}

export function pollEndOf(iso: string): string {
  return pollEnd.format(new Date(iso))
}

/** Yerel gün anahtarı (YYYY-AA-GG): gün ayırıcıları bu anahtar değişince çıkar. */
export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export type DayName = 'today' | 'yesterday' | null

/** Bugün / dün ayrımı; ikisi de değilse `null` (etiket tarihtir). */
export function dayName(iso: string, now: Date): DayName {
  const key = dayKey(iso)
  if (key === dayKey(now.toISOString())) return 'today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return key === dayKey(yesterday.toISOString()) ? 'yesterday' : null
}

export function fullDay(iso: string): string {
  return dayFull.format(new Date(iso))
}
