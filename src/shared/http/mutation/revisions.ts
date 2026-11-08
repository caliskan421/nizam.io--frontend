/**
 * Düzenleme sürümü (ADR-0027; istemci-akislari §8 "Düzenleme sürümü").
 *
 * İstemci formu açarken okuduğu sürümü saklar; gövdede bir gruptan alan gönderiyorsa o grubun
 * sürümünü (`expected_revision` / `expected_dates_revision`) ekler. Gruptan alan gönderip sürüm
 * göndermemek 422 `work.revision_required` alır. Bayat sürüm → 409 `*.edit_conflict`; istemci
 * otomatik tekrar etmez: taslak, ilk okunan taban ve sunucunun yeni değeri ayrı tutulur, aynı
 * alandaki fark kullanıcıya seçtirilir (`conflictingFields`), yeni sürümle gönderilir.
 */
export type RevisionField = 'expected_revision' | 'expected_dates_revision'

export interface RevisionGroup {
  /** Bu grubun alanları (gövde anahtarları). */
  fields: readonly string[]
  /** Gövdeye yazılacak beklenen sürüm alanı. */
  expected: RevisionField
  /** Okunan kayıtta sürümün durduğu alan. */
  source: string
}

/** `UpdateWorkItemRequest`: iki grup (başlık/açıklama/öncelik/kanıt; tarihler). */
export const WORK_ITEM_REVISION_GROUPS: readonly RevisionGroup[] = [
  {
    fields: ['title', 'description', 'priority', 'completion_evidence_required'],
    expected: 'expected_revision',
    source: 'edit_revision',
  },
  {
    fields: ['start_on', 'end_on', 'planned_end_on'],
    expected: 'expected_dates_revision',
    source: 'dates_revision',
  },
]

/** Alt görev düzenleme: yalnız `done` gönderilirse sürüm gerekmez. */
export const SUBTASK_REVISION_GROUPS: readonly RevisionGroup[] = [
  {
    fields: ['title', 'assignee_account_id', 'start_on', 'end_on'],
    expected: 'expected_revision',
    source: 'edit_revision',
  },
]

/** Not düzenleme (görev notu, toplantı notu): `content` her zaman sürümle gider. */
export const NOTE_REVISION_GROUPS: readonly RevisionGroup[] = [
  { fields: ['content'], expected: 'expected_revision', source: 'edit_revision' },
]

/**
 * Gövdeye, içerdiği her grubun beklenen sürümünü ekler (taban kayıttan). Gruptan alan yoksa
 * sürüm eklenmez. Tabanda sürüm yoksa hata fırlatır (programlama hatası; sunucuya gitmez).
 */
export function withExpectedRevisions<B extends object>(
  body: B,
  base: Readonly<Record<string, unknown>>,
  groups: readonly RevisionGroup[],
): B & Partial<Record<RevisionField, number>> {
  const out: Record<string, unknown> = { ...(body as Record<string, unknown>) }
  for (const group of groups) {
    if (!group.fields.some((field) => Object.hasOwn(body, field))) continue
    const revision = base[group.source]
    if (typeof revision !== 'number') {
      throw new Error(`mutation: tabanda ${group.source} yok (${group.expected} gerekli)`)
    }
    out[group.expected] = revision
  }
  return out as B & Partial<Record<RevisionField, number>>
}

/**
 * Gerçek çakışan alanlar: kullanıcı değiştirmiş (taslak ≠ taban), sunucu da değiştirmiş
 * (sunucu ≠ taban) ve ikisi farklı. Yalnız bunlar kullanıcıya seçtirilir; diğerleri
 * kendiliğinden birleşir (taslağın değişikliği ya da sunucunun yeni değeri).
 */
export function conflictingFields(
  base: Readonly<Record<string, unknown>>,
  draft: Readonly<Record<string, unknown>>,
  server: Readonly<Record<string, unknown>>,
  fields: readonly string[] = Object.keys(draft),
): string[] {
  return fields.filter((field) => {
    if (!Object.hasOwn(draft, field)) return false
    const mine = draft[field]
    const original = base[field]
    const theirs = server[field]
    return !Object.is(mine, original) && !Object.is(theirs, original) && !Object.is(mine, theirs)
  })
}
