/**
 * Alt görev görünüm yardımcıları (saf). Tarihler takvim günüdür (`YYYY-MM-DD`); saat dilimi
 * dönüşümü yapılmaz. Biçim tasarımdadır: `1 Eki – 8 Eki` (en tire, boşluklu, gün başında sıfır
 * yok; E-03C-52). Tarihi olmayan alt görev "Tarih yok" yazar — "ana görev süresince" yazılmaz
 * (E-03C-53, §7-19: sözleşmede böyle bir kural yok).
 */
import type { components } from '@/shared/api/schema'

export type WorkItemSubtask = components['schemas']['WorkItemSubtask']

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** `2026-10-08` → `8 Eki`; biçimsiz değer aynen. */
export function dayMonth(iso: string): string {
  const match = ISO_DATE.exec(iso)
  if (!match) return iso
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? match[2]}`
}

/** Alt görev tarih yazısı; iki uç da yoksa `null` (çağıran "Tarih yok" yazar). */
export function subtaskDateLabel(s: Pick<WorkItemSubtask, 'start_on' | 'end_on'>): string | null {
  if (!s.start_on || !s.end_on) return null
  return `${dayMonth(s.start_on)} – ${dayMonth(s.end_on)}`
}

export type SubtaskCounts = { done: number; total: number }

/** Yüklenen alt görevlerden sayaç (E-03C-33/46). */
export function countSubtasks(list: readonly Pick<WorkItemSubtask, 'done'>[]): SubtaskCounts {
  return { done: list.filter((s) => s.done).length, total: list.length }
}
