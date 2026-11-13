/**
 * Dönem sonu raporu "Bölüm seç…" modeli (E-13-04; 13 `mekanizma.md` §3.2). `reportSeasonPdf`
 * bölüm parametresi almaz (BE-122): pencere STATİKTİR — hepsi seçili açılır, hepsi seçiliyken
 * "Seçilenleri indir" düz tam indirmedir, bir kutu kaldırılınca devre dışı + "yakında". Kapak ve
 * içindekiler kilitlidir (her çıktıda). Ana bölümün kutusu alt kutuları toplu işaretler/kaldırır;
 * ana bölüm durumu alt kutulardan TÜRETİLİR (kısmi → `mixed`). Seçim açılışlar arasında
 * hatırlanmaz (durum pencerede bellektedir).
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

/** Hepsi seçili mi: yalnız bu durumda indirme canlıdır (düz tam rapor). */
export function isFullSelection(selected: ReadonlySet<SectionId>): boolean {
  return LEAVES.every((id) => selected.has(id))
}
