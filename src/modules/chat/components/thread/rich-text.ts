/**
 * Mesaj metni parçalama (E-10-30/31/32): gövde DÜZ metindir (MESSAGING-K08); `mentions[]` konum
 * taşımaz, bu yüzden gövdede "@<ad>" parçası eşleştirilir (sezgisel; eşleşmeyen düz metin kalır).
 * Görev referansı için gövdede "#<etiket>" aranır (etiket yazma çubuğunun eklediğiyle aynı
 * işlevden gelir, `refToken`); gövdede bulunamayan görev referansları çipler olarak sona eklenir.
 */
export type BodySegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; text: string; me: boolean }
  | { kind: 'ref'; text: string; refId: string }

export interface MentionNeedle {
  /** Gövdede aranan metin ("@Ayşe Yılmaz"). */
  token: string
  me: boolean
}
export interface RefNeedle {
  token: string
  refId: string
}

const REF_TITLE_MAX = 30

/** "#<başlık kısaltması>" — yazma çubuğu ve akış aynı kısaltmayı üretir. */
export function refToken(title: string): string {
  const clean = title.replace(/\s+/g, ' ').trim()
  const cut = clean.length > REF_TITLE_MAX ? `${clean.slice(0, REF_TITLE_MAX - 1)}…` : clean
  return `#${cut}`
}

export function mentionToken(label: string): string {
  return `@${label}`
}

interface Hit {
  at: number
  token: string
  make: () => BodySegment
}

function firstHit(
  body: string,
  from: number,
  hits: readonly Hit[],
): { hit: Hit; at: number } | null {
  let best: { hit: Hit; at: number } | null = null
  for (const hit of hits) {
    const at = body.indexOf(hit.token, from)
    if (at < 0) continue
    if (
      best === null ||
      at < best.at ||
      (at === best.at && hit.token.length > best.hit.token.length)
    ) {
      best = { hit, at }
    }
  }
  return best
}

export interface SegmentResult {
  segments: BodySegment[]
  /** Gövdede yeri bulunamayan görev referansları. */
  unplacedRefs: string[]
}

export function segmentBody(
  body: string,
  mentions: readonly MentionNeedle[],
  refs: readonly RefNeedle[],
): SegmentResult {
  const hits: Hit[] = [
    ...mentions
      .filter((m) => m.token.length > 1)
      .map((m) => ({
        at: 0,
        token: m.token,
        make: (): BodySegment => ({ kind: 'mention', text: m.token, me: m.me }),
      })),
    ...refs
      .filter((r) => r.token.length > 1)
      .map((r) => ({
        at: 0,
        token: r.token,
        make: (): BodySegment => ({ kind: 'ref', text: r.token, refId: r.refId }),
      })),
  ]
  const segments: BodySegment[] = []
  const placed = new Set<string>()
  let cursor = 0
  for (let found = firstHit(body, cursor, hits); found; found = firstHit(body, cursor, hits)) {
    if (found.at > cursor) segments.push({ kind: 'text', text: body.slice(cursor, found.at) })
    const segment = found.hit.make()
    segments.push(segment)
    if (segment.kind === 'ref') placed.add(segment.refId)
    cursor = found.at + found.hit.token.length
  }
  if (cursor < body.length) segments.push({ kind: 'text', text: body.slice(cursor) })
  return { segments, unplacedRefs: refs.map((r) => r.refId).filter((id) => !placed.has(id)) }
}
