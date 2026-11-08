/**
 * Oturum kapısı (uygulama kökü): kabuk yalnız açık oturumda çizilir; oturum açık DEĞİLKEN S0
 * dışı bir rota (ör. ana sayfa `/`) içerik göstermez, kimlik sayfasına (`/oturum`, S0) yönlenir.
 * Açılıştaki sessiz refresh sürerken (`unknown`) hüküm yoktur: beklenir, içerik çizilmez.
 * S0 rotaları kapıdan ve K7 açık durumlarından muaftır (giriş her zaman erişilebilir).
 */
import type { ScopeClass } from '@/shared/scope/scope-class'
import type { SessionStatus } from '@/shared/session/auth-session'

export type GateDecision = 'render' | 'wait' | 'to-session'

export interface GateInput {
  status: SessionStatus
  /** Kabuk çiziliyor mu (açık oturum ve zorunlu parola değişimi yok). */
  shell: boolean
  /** Eşleşen rotanın kapsam sınıfı; ilk gezinme çözülmeden `undefined`. */
  routeScope: ScopeClass | undefined
}

export function sessionGate(input: GateInput): GateDecision {
  if (input.shell || input.routeScope === 'S0') return 'render'
  if (!input.routeScope || input.status === 'unknown') return 'wait'
  return 'to-session'
}
