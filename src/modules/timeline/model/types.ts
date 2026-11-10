/**
 * Zaman çizelgesi modülünün tip sözlüğü. Sunucu şekilleri yalnız üretilmiş şemadan TÜRETİLİR
 * (elle DTO yok — `api/` katmanı yerel tip bildiremez, takma adları buradan alır). Burada ek
 * olarak yalnız istemci tarafı bileşimler durur: Gantt yüzü ve yazma eylemlerinin değişkenleri.
 */
import type { components } from '@/shared/api/schema'
import type { MutationOutcome, SubmitOptions } from '@/shared/http/mutation'

type Schemas = components['schemas']

export type Gantt = Schemas['Gantt']
export type GanttTask = Schemas['GanttTask']
export type GanttLink = Schemas['GanttLink']
export type Lateness = Schemas['Lateness']
export type DateChangeRequest = Schemas['DateChangeRequest']
export type DateChangeRequestList = Schemas['DateChangeRequestList']
export type DependencyEdge = Schemas['DependencyEdge']
export type DependencyList = Schemas['DependencyList']
export type ExtendResult = Schemas['ExtendResult']
export type ReviewResult = Schemas['ReviewResult']
export type ReviewDecision = Schemas['ReviewRequest']['decision']

/**
 * Gantt yüzü (K4, 03c kabul "satır dışı varsayımlar"): kapsam merceğinden türetilir; görünür
 * yüz seçici yoktur. Admin `adminGantt` (S2), Koordinatör `coordinatorGantt` (S3), Üye
 * `memberGantt` (S3).
 */
export type GanttFace = 'admin' | 'coordinator' | 'member'

export const GANTT_FACES: readonly GanttFace[] = ['admin', 'coordinator', 'member']

/** Gantt ucunun kapsamı: Admin yüzünde departman yoktur. */
export interface GanttTarget {
  programId: string
  departmentId: string | null
}

/** Tarih talebi okuma süzgeci (`listDateChangeRequests?status=`); anahtara girer. */
export type DateRequestStatusFilter = 'pending' | 'all'
export interface DateRequestFilters {
  status: DateRequestStatusFilter
}

/** Üç tarih alanından hangileri yazılıyor (en az biri); değer `YYYY-MM-DD`. */
export interface DatePatch {
  start_on?: string
  end_on?: string
  planned_end_on?: string
}

/** Tek göreve ait yazma: görevin KENDİ kapsamı + kimlik. */
export interface TimelineItemRef {
  target: { programId: string; departmentId: string }
  workItemId: string
}

/**
 * `updateWorkItem` tarih yazımı: `base` kullanıcının GÖRDÜĞÜ `dates_revision` (Gantt satırı —
 * BE-053 —, panelde açık görev). Bayatsa 409 `work.edit_conflict`.
 */
export interface UpdateDatesInput extends TimelineItemRef {
  base: { dates_revision: number }
  dates: DatePatch
}

export interface ExtendInput extends TimelineItemRef {
  /** 1–90 (aksi 422 `work.extend_days_out_of_range`). */
  days: number
  /** Kullanıcının gördüğü `dates_revision` (isteğe bağlı; BE-053/056). */
  expectedDatesRevision?: number
}

export interface RequestDateChangeInput extends TimelineItemRef {
  newStartOn: string
  newEndOn: string
  reason?: string
  /** Kullanıcının gördüğü `dates_revision` (isteğe bağlı; BE-053/056). */
  expectedDatesRevision?: number
}

/** `reviewDateChangeRequest` S1'dir (başlıksız); `workItemId` yalnız yeniden okuma hedefidir. */
export interface ReviewInput {
  requestId: string
  workItemId: string
  decision: ReviewDecision
}

export interface AddDependencyInput extends TimelineItemRef {
  dependsOnWorkItemId: string
}

export interface RemoveDependencyInput extends TimelineItemRef {
  dependencyId: string
}

/** Yeniden okuma hedefi olan görev kimliği. */
export interface WorkItemIdOf {
  workItemId: string
}

/** Yazma sarmalayıcısının dışa açık yüzü (`submit` + istek sürerken kilit için `isPending`). */
export interface TimelineMutation<V, D> {
  submit: (vars: V, opts?: SubmitOptions) => Promise<MutationOutcome<V, D, unknown>>
  isPending: { value: boolean }
}
