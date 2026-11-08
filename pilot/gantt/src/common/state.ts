/**
 * Pilotun ortak durumu: ölçek, yüz (K4: Admin/Koordinatör/Üye), tema, sürükleme politikası
 * (ortak-kurallar §12 P8) ve 5 sn gecikmeli gönderim ("İptal et" = istek hiç gitmez).
 * Gerçek uygulamada yüz kapsamdan türer, burada ölçüm için elle seçilir.
 */
import { reactive } from 'vue'
import type { GanttTask } from './mock'

export type Scale = 'gun' | 'hafta'
export type Face = 'admin' | 'koordinator' | 'uye'
export type Edge = 'start' | 'end'

export interface DragEvent {
  task: GanttTask
  edge: Edge
  from: string
  to: string
}

export interface PendingOp {
  id: number
  text: string
  timer: number
}

export const pilot = reactive({
  scale: 'hafta' as Scale,
  face: 'koordinator' as Face,
  theme: 'dark' as 'dark' | 'light',
  log: [] as string[],
  pending: [] as PendingOp[],
})

/** Üye yüzünde tutamaç yok (mekanizma §4.4-6). */
export function canDrag(face: Face): boolean {
  return face !== 'uye'
}

/** P8: koordinatörde talep, adminde doğrudan. Uzatma yalnız bitiş ileri ve 1–90 gün. */
export function describeWrite(face: Face, ev: DragEvent): string {
  if (face === 'koordinator') {
    return `requestDateChange(new_start_on, new_end_on) — ${ev.edge}: ${ev.from} → ${ev.to}`
  }
  const days = Math.round((Date.parse(ev.to) - Date.parse(ev.from)) / 86_400_000)
  if (ev.edge === 'end' && days >= 1 && days <= 90) return `extendWorkItem(days=${days})`
  return `updateWorkItem(${ev.edge === 'start' ? 'start_on' : 'end_on'}=${ev.to}, expected_dates_revision)`
}

let seq = 0

/**
 * Bırakma olayını alır; politika izin vermiyorsa `false` döner (aday görseli geri almalı).
 * İzin varsa isteği 5 sn bekletir; `cancel` çağrılırsa istek hiç gönderilmez.
 */
export function onEdgeDrop(ev: DragEvent): boolean {
  if (!canDrag(pilot.face)) {
    pilot.log.unshift(`reddedildi (üye yüzü): ${ev.task.title}`)
    return false
  }
  const text = describeWrite(pilot.face, ev)
  const id = ++seq
  const timer = window.setTimeout(() => {
    pilot.pending = pilot.pending.filter((p) => p.id !== id)
    pilot.log.unshift(`gönderildi: ${text}`)
  }, 5000)
  pilot.pending.push({ id, text, timer })
  pilot.log.unshift(`bekliyor (5 sn): ${ev.task.title} · ${text}`)
  return true
}

export function cancelPending(id: number): void {
  const op = pilot.pending.find((p) => p.id === id)
  if (!op) return
  window.clearTimeout(op.timer)
  pilot.pending = pilot.pending.filter((p) => p.id !== id)
  pilot.log.unshift(`iptal edildi (istek gitmedi): ${op.text}`)
}

export function applyTheme(theme: 'dark' | 'light'): void {
  pilot.theme = theme
  document.documentElement.dataset.theme = theme
}

/** Ölçüm kancası: Playwright `window.__pilot`'u okur. */
export interface PilotProbe {
  ready: boolean
  firstRenderMs: number
  scrollSelector: string
  candidate: string
}

declare global {
  interface Window {
    __pilot?: PilotProbe
  }
}

/** Aday çizimini ölçer: `render` senkron çağrılır, iki kare sonra hazır sayılır. */
export async function measureFirstRender(
  candidate: string,
  scrollSelector: string,
  render: () => void | Promise<void>,
): Promise<void> {
  const t0 = performance.now()
  await render()
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  const ms = performance.now() - t0
  window.__pilot = { ready: true, firstRenderMs: Math.round(ms), scrollSelector, candidate }
  pilot.log.unshift(`ilk çizim: ${Math.round(ms)} ms`)
}
