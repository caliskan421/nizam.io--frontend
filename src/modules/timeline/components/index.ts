/**
 * Zaman çizelgesi bileşen İSKELETİ (W91; O2b sözleşmesi — K15, CX-F0-Ö-06). Adlar ve prop/emit
 * tipleri burada SABİTTİR; her O2b uygulayıcısı yalnız kendi `.vue` dosyasının gövdesini
 * doldurur, bu dosyaya satır eklemez/değiştirmez. Sözleşme değişikliği koordinatör kararıdır.
 * Dosya sahipliği: gantt/ W92 (+ W95 sürükleme), frame/ W93, panel/ W94, snack/ W95, subtasks/ W96.
 *
 * Ortak kurallar (bütün bileşenler):
 *  - Veri yalnız `../api` composable'larından; anahtarlar `query-keys.ts`'ten. Tek göreve ait
 *    her istek görevin kendi kapsamıyla (`GanttTask.program_id` / `department_id`).
 *  - Eylem görünürlüğü ve tarih yazma politikası yalnız `../model/capabilities.ts` (P8);
 *    mercek yetki değildir (P1); yetkisiz eylem gizlenir, BE kaynaklı eksik eylem devre dışı + stub.
 *  - Yazmalar `../api/mutations.ts` sarmalayıcılarıyla; iyimser güncelleme yok; sonuç
 *    `shared/ui/confirm`, çakışma `shared/ui/conflict`; gecikmeli gönderim sahip sökülünce,
 *    kapsam ve oturum değişince iptal (KESİN 26a).
 *  - Çizim kendi SVG'dir (`gantt-secimi.md` §7); ham renk/px yok, yalnız token.
 * Kabul ölçütü: `docs/ekranlar/03c-zaman-cizelgesi/README.md` kabul tablosu (`kabul` ve
 * `geçici kabul`; ürün sahibi 2026-11-10'da Codex §6 #11/#12'yi onayladı → artık `kabul`).
 */
import type { GanttFace, GanttLink, GanttTask } from '../model/types'

/** Gantt ölçeği (E-03C-07; URL `olcek`): gün 21 px / hafta / ay (`gantt-secimi.md` §7). */
export type GanttScale = 'gun' | 'hafta' | 'ay'
/** Durum süzgeci (E-03C-06; URL `durum`). */
export type GanttStatusFilter = 'tumu' | 'acik' | 'geciken' | 'biten'
/** Sürüklenen uç: başlangıç ya da bitiş. */
export type GanttEdge = 'start' | 'end'

/** Takvim günü aralığı, `YYYY-MM-DD`. */
export interface GanttDayRange {
  start: string
  end: string
}

/**
 * `edge-drag` yükü (W92 çizer ve yayar, politika W95'te): `move` sürerken anlık gün (çubuk
 * önizlemesi), `drop` bırakma, `cancel` Esc/işaretçi iptali. `day` güne yapışmış tarih.
 */
export interface GanttEdgeDrag {
  workItemId: string
  edge: GanttEdge
  phase: 'move' | 'drop' | 'cancel'
  day: string
}

// --- W92 — kendi SVG Gantt çekirdeği ------------------------------------------------------

/** W92 · E-03C-21…32, 34…41, 43 — Gantt kabı: eksen + satırlar + çubuklar + oklar, kaydırma. */
export interface GanttViewProps {
  tasks: readonly GanttTask[]
  links: readonly GanttLink[]
  scale: GanttScale
  /** Bugün (kurulum saat dilimiyle `YYYY-MM-DD`); sahte saatle test edilir. */
  today: string
  /** Departman kimliği → görünen ad (`listProgramDepartments` ⋈; E-03C-28). */
  departmentNames: ReadonlyMap<string, string>
  selectedId: string | null
  /** Seçili satırda tutamaç çizilecek görevler (P8; `capabilities.ts`'ten çağıran hesaplar). */
  draggableIds: ReadonlySet<string>
}
export interface GanttViewEmits {
  /** Satır/çubuk seçimi (URL `secili`); `null` seçimi kaldırır. */
  select: [workItemId: string | null]
  'edge-drag': [drag: GanttEdgeDrag]
  /** Yatay kaydırma konumu (gün cinsinden görünen başlangıç/bitiş) — aralık şeridi tüketir. */
  scroll: [view: GanttDayRange]
}

/** W92 · E-03C-23…27 — ay/hafta/gün başlığı, ızgara ve bugün çizgisi. */
export interface GanttAxisProps {
  scale: GanttScale
  range: GanttDayRange
  today: string
}

/** W92 · E-03C-28…35 — grup başlıkları + görev satırları (`treegrid`, dolaşan `tabindex`). */
export interface GanttRowsProps {
  tasks: readonly GanttTask[]
  departmentNames: ReadonlyMap<string, string>
  selectedId: string | null
}
export interface GanttRowsEmits {
  select: [workItemId: string]
}

/** W92 · E-03C-36…43, 47 — çubuklar (plan + taşma), seçili satırda tutamaçlar. */
export interface GanttBarsProps {
  tasks: readonly GanttTask[]
  scale: GanttScale
  range: GanttDayRange
  today: string
  selectedId: string | null
  draggableIds: ReadonlySet<string>
}
export interface GanttBarsEmits {
  select: [workItemId: string]
  'edge-drag': [drag: GanttEdgeDrag]
}

/** W92 · E-03C-37 — bağımlılık okları (yalnız iki ucu da görünür bağlar). */
export interface GanttLinksProps {
  links: readonly GanttLink[]
  tasks: readonly GanttTask[]
  scale: GanttScale
  range: GanttDayRange
}

// --- W93 — sayfa çerçevesi ------------------------------------------------------------------

/** W93 · E-03C-01…04 — kırıntı altı başlık bloğu ve sayaçlar. */
export interface TimelineHeadProps {
  taskCount: number
  doneCount: number
  overdueCount: number
  /** Sunucu `X-Result-Truncated: true` bildirdi (BE-019; kalem sayısından çıkarım yok): sayaçlar "yüklenen kayıtlar içinde" (E-03C-02, 82). */
  approximate: boolean
  canCreateTask: boolean
}
export interface TimelineHeadEmits {
  /** "Liste" segmenti seçildi (E-03C-03); sayfa `/gorevler`e geçer. */
  showList: []
  newTask: []
}

/** W93 · E-03C-05…12 — araç çubuğu. */
export interface TimelineToolbarProps {
  status: GanttStatusFilter
  scale: GanttScale
  /** Admin yüzünde tek departman süzgeci seçenekleri; boşsa süzgeç çizilmez (E-03C-05). */
  departments: readonly { departmentId: string; displayName: string }[]
  departmentId: string | null
  showDepartmentFilter: boolean
  fullscreen: boolean
  /** Dışa aktarım pilotla doğrulandıysa `true`; değilse devre dışı (E-03C-10/11). */
  exportReady: boolean
}
export interface TimelineToolbarEmits {
  'update:status': [value: GanttStatusFilter]
  'update:scale': [value: GanttScale]
  'update:departmentId': [value: string | null]
  'update:fullscreen': [value: boolean]
  exportPdf: []
  exportImage: []
}

/** W93 · E-03C-14…18 — görev aralığı şeridi, histogram ve görünen aralık çerçevesi. */
export interface RangeStripProps {
  /** Yüklü görevlerin en erken başlangıç – en geç bitiş aralığı ("görev aralığı"; "sezon" denmez). */
  range: GanttDayRange | null
  /** Haftalık görev sayıları (E-03C-15). */
  histogram: readonly number[]
  /** Gantt'ın görünen aralığı (E-03C-16). */
  view: GanttDayRange | null
  today: string
  /** `Program.year` varsa yıl etiketi. */
  year: number | null
}
export interface RangeStripEmits {
  /** Şeritte tıklanan gün; Gantt o konuma kaydırır. */
  seek: [day: string]
}

/** W93 · E-03C-19 — açıklama (beş durum + "Geç bitti" + "Tarih talebi"); prop/emit yok. */

// --- W94 — seçili görev paneli ve tarih talebi ----------------------------------------------

/** W94 · E-03C-42, 54…66 — sağ alt panel (tarih girdileri, durum, gecikme, dosya, eylemler). */
export interface SelectedTaskPanelProps {
  task: GanttTask
  face: GanttFace
  departmentName: string | null
}
export interface SelectedTaskPanelEmits {
  /** Kapat + Esc; odak çubuğa döner (KESİN 27). */
  close: []
  /** "Liste görünümünde aç" (E-03C-56) → `/gorevler?secili=…`. */
  openInList: [workItemId: string]
}

/** W94 · E-03C-64, 03 E-03-54/63 — tarih talebi formu (03 ve 03c aynı bileşen). */
export interface DateRequestFormProps {
  open: boolean
  workItemId: string
  /** Görevin KENDİ kapsamı. */
  target: { programId: string; departmentId: string }
  /** Görevin geçerli tarihleri (`YYYY-MM-DD`). */
  startOn: string
  endOn: string
}
export interface DateRequestFormEmits {
  'update:open': [value: boolean]
  /** Talep açıldı (`request_id`); gerçek sonuç bildirimi sahibin işidir (Ö-07). */
  sent: [requestId: string]
}

// --- W95 — gecikmeli gönderim bildirimi -----------------------------------------------------

/** W95 · E-03C-67…72 — "tarih değişiyor" bildirimi + 5 sn geri sayım + "İptal et". */
export interface DateChangeSnackProps {
  face: GanttFace
  title: string
  before: GanttDayRange
  after: GanttDayRange
  /** Gönderime kalan süre (ms); `prefers-reduced-motion`'da geri sayım çubuğu animasyonsuz. */
  remainingMs: number
  totalMs: number
}
export interface DateChangeSnackEmits {
  /** "İptal et": süre içinde isteği HİÇ göndermez (E-03C-70). */
  cancel: []
  /** ✕: yalnız bildirimi kapatır, gönderimi iptal ETMEZ (E-03C-71). */
  dismiss: []
}

// --- W96 — 03d alt görev --------------------------------------------------------------------

/** W96 · E-03C-33, 44…53 — tek satırda isteğe bağlı açılan alt görev satırları. */
export interface SubtaskRowsProps {
  workItemId: string
  /** Görevin KENDİ kapsamı (`listWorkItemSubtasks`, S3). */
  target: { programId: string; departmentId: string }
  /** Yalnız `true` iken okunur (kapalı satırda istek 0; "Tümünü aç" yok — K3). */
  open: boolean
  /**
   * Bloğun ilk satırının mutlak `aria-rowindex` değeri (sahibi görev satırının indeksi + 1;
   * CX-F3-Ö-03). Verilmezse satırlara indeks yazılmaz (tek başına kullanım).
   */
  rowIndexStart?: number
  /**
   * Gantt satırının `subtask_counts` değeri (BE-051): liste okuması yüklenene dek (ya da kapalı
   * satırda hiç) sayaç/çizgi/çip buradan beslenir; liste yüklenince canlı sayaç onun yerini alır.
   */
  rowCounts?: { done: number; total: number } | null
}

// --- Bileşenler (gövdeler O2b'de) -----------------------------------------------------------

export { default as GanttView } from './gantt/GanttView.vue'
export { default as GanttAxis } from './gantt/GanttAxis.vue'
export { default as GanttRows } from './gantt/GanttRows.vue'
export { default as GanttBars } from './gantt/GanttBars.vue'
export { default as GanttLinks } from './gantt/GanttLinks.vue'
export { default as TimelineHead } from './frame/TimelineHead.vue'
export { default as TimelineToolbar } from './frame/TimelineToolbar.vue'
export { default as RangeStrip } from './frame/RangeStrip.vue'
export { default as TimelineLegend } from './frame/TimelineLegend.vue'
export { default as SelectedTaskPanel } from './panel/SelectedTaskPanel.vue'
export { default as DateRequestForm } from './panel/DateRequestForm.vue'
export { default as DateChangeSnack } from './snack/DateChangeSnack.vue'
export { default as SubtaskRows } from './subtasks/SubtaskRows.vue'
