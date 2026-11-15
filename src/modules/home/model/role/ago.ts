/**
 * Zaman damgası → kısa göreli etiket (E-K1-15/16/39, E-Ü1-11): K1 onay satırı "2 sa önce" /
 * "dün 16:20", Ü1 "19.10". Gün sınırı kurulum saat dilimindedir (WORK-K37; istemci dilimi değil).
 * Saf fonksiyon: `now` çağıranın verdiği andır (sahte saatle sınanır). Biçimsiz zaman → `null`
 * (etiket çizilmez; zaman uydurulmaz).
 */
import { homeText } from '../messages'
import { dayIn, daysBetween, formatDayShort } from './dates'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

function clock(at: Date, timeZone: string): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(at)
  try {
    return format(timeZone)
  } catch {
    return format('Europe/Istanbul')
  }
}

/** Gönderim/talep anı: bugün → "az önce / n dk / n sa önce", dün → "dün SS:dd", daha eski "GG.AA SS:dd". */
export function agoText(iso: string, now: Date, timeZone: string): string | null {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  const age = Math.max(0, now.getTime() - at.getTime())
  const dayDiff = daysBetween(dayIn(timeZone, at), dayIn(timeZone, now))
  if (dayDiff === 0) {
    if (age < MINUTE) return homeText('home.ago.now')
    if (age < HOUR) return homeText('home.ago.minutes', { n: Math.floor(age / MINUTE) })
    return homeText('home.ago.hours', { n: Math.floor(age / HOUR) })
  }
  const time = clock(at, timeZone)
  if (dayDiff === 1) return homeText('home.ago.yesterday', { time })
  return `${formatDayShort(dayIn(timeZone, at))} ${time}`
}

/** Yalnız gün ("19.10"); biçimsiz zaman → `null`. */
export function dayText(iso: string, timeZone: string): string | null {
  const at = new Date(iso)
  return Number.isNaN(at.getTime()) ? null : formatDayShort(dayIn(timeZone, at))
}
