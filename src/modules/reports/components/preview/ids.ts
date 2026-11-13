/** 01f kâğıtlarının sayfa içi bağlantı kimlikleri (içindekiler → bölüm; E-13-24). */
export const SEASON_IDS = {
  cover: 'report-season-cover',
  toc: 'report-season-toc',
  summary: 'report-season-summary',
  gantt: 'report-season-gantt',
  general: 'report-season-general',
  appendix: 'report-season-appendix',
} as const

export const departmentAnchor = (departmentId: string): string =>
  `report-season-dept-${departmentId}`
