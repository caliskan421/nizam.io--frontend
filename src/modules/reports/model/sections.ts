/**
 * Dönem sonu raporu "Bölüm seç…" modeli (E-13-04, E-13-05; 13 `mekanizma.md` §3.2). Pin v0.23.0-api:
 * `reportSeasonPdf` `sections` (kapalı küme) ve `department_ids` (programın koordinatörlükleri) alır
 * (BE-122, BE-127 kısmı; REPORTING-K17). Hepsi seçili açılır; hepsi seçiliyken sorgu parametresi
 * YAZILMAZ (düz tam rapor). Sunucu boş seçimi "hepsi" sayar: hiçbir bölüm seçili değilken
 * gönderme engellenir (istemci beklenmedik tam rapor indirtmez). Kapak ve içindekiler kilitlidir
 * (her çıktıda). Ana bölümün kutusu alt kutuları toplu işaretler/kaldırır; ana bölüm durumu alt
 * kutulardan TÜRETİLİR (kısmi → `mixed`) ve sunucuya GÖNDERİLMEZ (`departments` kabul edilmez).
 * Seçim açılışlar arasında hatırlanmaz (durum pencerede bellektedir).
 */
export const SECTION_IDS = [
  'summary',
  'gantt',
  'general',
  'departments',
  'tasks',
  'details',
  'meetings',
  'files',
  'appendix',
] as const
export type SectionId = (typeof SECTION_IDS)[number]

/** Alt kutular (Koordinatörlük bölümleri altında, girintili). */
export const DEPARTMENT_CHILDREN: readonly SectionId[] = ['tasks', 'details', 'meetings', 'files']

/** Depolanan (yaprak) kutular: ana bölüm kutusu `departments` saklanmaz, türetilir. */
const LEAVES: readonly SectionId[] = SECTION_IDS.filter((id) => id !== 'departments')

export function isChild(id: SectionId): boolean {
  return DEPARTMENT_CHILDREN.includes(id)
}

/** Pencere açılışı: bütün yaprak kutular seçili. */
export function allSections(): Set<SectionId> {
  return new Set(LEAVES)
}

export type SectionState = 'on' | 'off' | 'mixed'

export function sectionState(selected: ReadonlySet<SectionId>, id: SectionId): SectionState {
  if (id !== 'departments') return selected.has(id) ? 'on' : 'off'
  const on = DEPARTMENT_CHILDREN.filter((child) => selected.has(child)).length
  if (on === 0) return 'off'
  return on === DEPARTMENT_CHILDREN.length ? 'on' : 'mixed'
}

/** Kutuyu çevirir; ana kutu alt kutuları toplu işaretler (`mixed` → hepsini işaretle). */
export function toggleSection(selected: ReadonlySet<SectionId>, id: SectionId): Set<SectionId> {
  const next = new Set(selected)
  if (id === 'departments') {
    const turnOn = sectionState(selected, id) !== 'on'
    for (const child of DEPARTMENT_CHILDREN) {
      if (turnOn) next.add(child)
      else next.delete(child)
    }
  } else if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** Hepsi seçili mi: bu durumda `sections` parametresi yazılmaz (düz tam rapor). */
export function isFullSelection(selected: ReadonlySet<SectionId>): boolean {
  return LEAVES.every((id) => selected.has(id))
}

/** Sunucunun `sections` kapalı kümesi (REPORTING-K17); çizim sırası. */
export type SeasonSection = Exclude<SectionId, 'departments'>

/** Hiçbir bölüm seçili değil: sunucu bunu "hepsi" sayacağından gönderme engellenir. */
export function isEmptySelection(selected: ReadonlySet<SectionId>): boolean {
  return !LEAVES.some((id) => selected.has(id))
}

/**
 * İstek için bölüm kümesi: hepsi seçiliyse `undefined` (parametre yazılmaz), aksi hâlde çizim
 * sırasında seçili yapraklar. Boş seçim istek olmaz (`isEmptySelection` ile engellenir).
 */
export function sectionsForRequest(
  selected: ReadonlySet<SectionId>,
): readonly SeasonSection[] | undefined {
  if (isFullSelection(selected)) return undefined
  return LEAVES.filter((id): id is SeasonSection => selected.has(id))
}

/**
 * Koordinatörlük süzgeci: `only` boşsa "Tümü" (parametre yok). Tümü açıkken bir çipe basmak
 * süzgeci yalnız o koordinatörlüğe daraltır; sonraki basışlar ekler/çıkarır; son çip çıkınca
 * "Tümü"ne döner (boş süzgeç yoktur: sunucu onu "hepsi" sayar).
 */
export function toggleDepartment(only: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(only)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** İstek için `department_ids`: yalnız daraltılmışsa, programdaki sırayla; yoksa `undefined`. */
export function departmentsForRequest(
  only: ReadonlySet<string>,
  order: readonly string[],
): readonly string[] | undefined {
  if (only.size === 0) return undefined
  const ids = order.filter((id) => only.has(id))
  return ids.length > 0 ? ids : undefined
}
