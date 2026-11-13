/**
 * Rapor eylem görünürlüğü (K1; `13-raporlar/backend.md` §3.1, REPORTING-K01/K07). Girdi yalnız
 * sunucu OLGULARIDIR (`me.company_admin`, `me/departments` koordinatör satırları); mercek girdi
 * DEĞİLDİR (P1: yönetici K/Ü merceğine geçince de rapor düğmeleri kalır). Üye hiçbir rapor
 * göremez. `istemci-akislari.md` §4'te rapor satırı yoktur → kural reporting README §3 ve
 * openapi'den kodlanır (P30 emsali; `dogrulama.md` #10). Yetkisiz eylem GİZLENİR; gizleme
 * güvenlik değildir, sunucu nihai karardır (yanlış pozitif 403 alır). Rol dizesi karşılaştırması
 * yalnız burada ve `shared/scope/standing*` içindedir.
 *
 *  - Dönem PDF + önizleme (01f), iş yükü PDF: yalnız şirket yöneticisi.
 *  - Toplantı önizleme (01g, `reportMeetingDetail`): yalnız şirket yöneticisi (K için 403).
 *  - Toplantı PDF: ŞY ∨ toplantının sahip/dahil departmanlarından birini (seçili programda)
 *    koordine eden K (REPORTING-K07: herhangi biri yeter).
 *  - Görev PDF: ŞY ∨ görevin departmanını koordine eden K.
 */
import { scopeFacts, type Standing } from '@/shared/scope/standing-facts'

/** Toplantının sahip + dahil departmanları (`meetings` toplantı olguları). */
export interface ReportMeetingFacts {
  departmentIds: readonly string[]
}

export interface ReportTaskFacts {
  departmentId: string
}

export const REPORT_CAPABILITY_ACTIONS = [
  'exportSeason',
  'exportWorkload',
  'previewSeason',
  'previewMeeting',
  'exportMeeting',
  'exportTask',
] as const
export type ReportCapabilityAction = (typeof REPORT_CAPABILITY_ACTIONS)[number]

/** Her eylemin kaynağı (tablo testi ve denetim izi için). */
export const REPORT_CAPABILITY_SOURCES: Readonly<Record<ReportCapabilityAction, string>> = {
  exportSeason: 'REPORTING-K01: yalnız şirket yöneticisi (`reportSeasonPdf`)',
  exportWorkload: 'REPORTING-K01: yalnız şirket yöneticisi (`reportWorkloadPdf`)',
  previewSeason: 'REPORTING-K01: yalnız şirket yöneticisi (`reportSeason`, 01f)',
  previewMeeting: 'REPORTING-K01: yalnız şirket yöneticisi (`reportMeetingDetail`, 01g)',
  exportMeeting: 'REPORTING-K07: ŞY ∨ toplantının sahip/dahil departmanını koordine eden K',
  exportTask: 'REPORTING-K07: ŞY ∨ görevin departmanını koordine eden K',
}

export function reportCapabilities(standing: Standing | null, programId: string | null) {
  const admin = standing?.companyAdmin === true
  const coordinates = (departmentId: string) =>
    scopeFacts(standing, programId, departmentId).coordinator
  return {
    canExportSeason: (): boolean => admin,
    canExportWorkload: (): boolean => admin,
    canPreviewSeason: (): boolean => admin,
    canPreviewMeeting: (): boolean => admin,
    canExportMeetingReport(meeting: ReportMeetingFacts): boolean {
      return admin || meeting.departmentIds.some(coordinates)
    },
    canExportTaskReport(task: ReportTaskFacts): boolean {
      return admin || coordinates(task.departmentId)
    },
  }
}

export type ReportCapabilities = ReturnType<typeof reportCapabilities>
