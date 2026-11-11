/** Kurulum saat dilimindeki yerel alanları UTC zaman damgasına çevirir. */
export function meetingTimestamp(date: string, time: string, timezone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const clock = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match || !clock) return null
  const target = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(clock[1]),
    Number(clock[2]),
  )
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  let value = target
  for (let i = 0; i < 3; i += 1) {
    const parts = formatter.formatToParts(new Date(value))
    const get = (key: string) => Number(parts.find((part) => part.type === key)?.value)
    const displayed = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
    )
    const delta = target - displayed
    if (delta === 0) return new Date(value).toISOString()
    value += delta
  }
  return null
}

export function meetingDateParts(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const get = (key: string) => parts.find((part) => part.type === key)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

export function meetingWarning(
  side: { event_failed: boolean; failed_messages: number },
  failed: string[],
  text: { partial: string; eventFailed: string; eventOk: string },
): string | null {
  if (!failed.length && !side.event_failed && !side.failed_messages) return null
  return text.partial
    .replace('{people}', failed.join(', ') || '0')
    .replace('{messages}', String(side.failed_messages))
    .replace('{event}', side.event_failed ? text.eventFailed : text.eventOk)
}
