// Kabuk (AppShell) paylaşılan tipleri.
import type { OpenStateName } from '@/app/routes.catalog'

/**
 * Kabuk ana alanının içeriği: rota içeriği ya da onun yerine yerinde gösterilen durum (K7 açık
 * durumu, kapsam yükleniyor / hata / seçim bekleniyor). Çözümü `app/states/resolve.ts`.
 */
export type ShellContent =
  | { kind: 'content' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'selecting' }
  | { kind: 'open-state'; name: OpenStateName }
