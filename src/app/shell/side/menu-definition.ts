/**
 * Rol bazlı kenar menüsü TANIMI (F6, E-00-41…47; 00-ortak `mekanizma.md` §9; WEB-6 W141).
 *
 * Rota kataloğu (`routes.catalog.ts`) öğenin ne olduğunu, faz görünürlüğünü ve varsayılan
 * etiketini söyler; burası hangi rol menüsünde, hangi grupta ve sırada, hangi etiket ve rozetle
 * görüneceğini söyler. Katalogda menü anahtarı olup burada tanımı olmayan öğe HİÇBİR menüde
 * görünmez (varsayılan gizli; `menu-definition.test.ts` her katalog anahtarının tanımını sınar).
 *
 *  - Menü yetki olgusundan seçilir (`company_admin` → yönetici menüsü her mercekte); mercek
 *    yalnız `company_admin` olmayanlarda menüyü seçer ve yetki değildir (P1/P11/P53).
 *  - "Raporlar" öğesi hiçbir menüde YOKTUR (P47); Takvim, Kurumsal hafıza, Mesajlar, Tablolar,
 *    Birimim, Ekibim, Simülasyon katalogda menü girdisi olmadığından yoktur (§9 ortak kural).
 *  - Gizleme güvenlik değildir: sunucu her istekte denetler.
 */
import type { MenuGroup } from '@/app/routes.catalog'
import type { ScopeLens } from '@/shared/scope/scope'

import type { SideTextKey } from './messages'

/** Menü rolü: hangi menü kümesinin gösterileceği (yetki değil). */
export type MenuRole = 'admin' | 'coordinator' | 'member'

/** Menü öğesi rozeti türü; sayılar `badges.ts` `TaskBadges`'ten. */
export type MenuBadgeKind = 'overdue' | 'dates' | 'approval'

/** Öğenin bir rol menüsündeki yeri. `badges` soldan sağa çizim sırasıdır. */
export interface MenuSlot {
  readonly group: MenuGroup
  readonly order: number
  /** Rol etiketi (yoksa katalog sayfa adı). Sayfa başlığı ve konum izi değişmez (§9.4). */
  readonly label?: SideTextKey
  readonly badges?: readonly MenuBadgeKind[]
}

export interface MenuItemDef {
  /** Katalog `menu.key` değeri. */
  readonly key: string
  /** Yalnız bu rollerde görünür (`roles` anahtarları = görünür olduğu roller). */
  readonly roles: Readonly<Partial<Record<MenuRole, MenuSlot>>>
}

export const MENU_ROLES: readonly MenuRole[] = ['admin', 'coordinator', 'member']

export const MENU_DEFINITION: readonly MenuItemDef[] = [
  {
    key: 'home',
    roles: {
      admin: { group: 'takip', order: 1 },
      coordinator: { group: 'takip', order: 1 },
      member: { group: 'takip', order: 1 },
    },
  },
  {
    key: 'tasks',
    roles: {
      // Yönetici: tarih talebi (nötr) + geciken (E-00-14/15); koordinatör: onay bekleyen + geciken
      // (E-00-45); üye "Görevlerim": yalnız kendi gecikenleri, tarih talebi hiçbir zaman.
      admin: { group: 'takip', order: 2, badges: ['dates', 'overdue'] },
      coordinator: { group: 'takip', order: 2, badges: ['approval', 'overdue'] },
      member: { group: 'takip', order: 2, label: 'side.item.myTasks', badges: ['overdue'] },
    },
  },
  {
    key: 'gantt',
    roles: {
      admin: { group: 'takip', order: 3 },
      // Koordinatörde tarih talebi rozeti Zaman çizelgesi'ne taşınır (E-00-45, geçici kabul).
      coordinator: { group: 'takip', order: 3, badges: ['dates'] },
      member: { group: 'takip', order: 3, label: 'side.item.myTimeline' },
    },
  },
  {
    key: 'meetings',
    roles: {
      admin: { group: 'icerik', order: 1 },
      coordinator: { group: 'icerik', order: 1 },
      member: { group: 'icerik', order: 1 },
    },
  },
  {
    key: 'archive',
    roles: {
      admin: { group: 'icerik', order: 2 },
      coordinator: { group: 'icerik', order: 2 },
      member: { group: 'icerik', order: 2, label: 'side.item.myFiles' },
    },
  },
  { key: 'users', roles: { admin: { group: 'yonetim', order: 1 } } },
  { key: 'coords', roles: { admin: { group: 'yonetim', order: 2 } } },
  { key: 'season', roles: { admin: { group: 'yonetim', order: 3 } } },
]

const BY_KEY: ReadonlyMap<string, MenuItemDef> = new Map(MENU_DEFINITION.map((d) => [d.key, d]))

/** Öğenin verilen rol menüsündeki yeri; o rolde görünmüyorsa `undefined`. */
export function menuSlot(key: string, role: MenuRole): MenuSlot | undefined {
  return BY_KEY.get(key)?.roles[role]
}

/** Menü rolü seçiminin girdisi: yalnız standing olguları ve mercek (yetki değil). */
export interface MenuRoleInput {
  /** Standing geldi mi (`me` + `me/departments`). */
  ready: boolean
  companyAdmin: boolean
  coordinator: boolean
  member: boolean
  /** Seçili mercek (`scope.lens`); seçim bekleniyorsa `null`. */
  lens: ScopeLens | null
}

/**
 * Menü seçimi (§9 kural): `company_admin` → yönetici menüsü (mercek ne olursa); değilse mercek
 * Koordinatör → koordinatör, Üye → üye (birleşik rolde mercek karar verir). Mercek yoksa
 * (seçim bekleniyor / standing gelmedi) olguya göre: yalnız üye olan → üye; diğer her durumda
 * koordinatör düzeni (rol etiketsiz, nötr; Yönetim hiçbir zaman).
 */
export function resolveMenuRole(input: MenuRoleInput): MenuRole {
  if (input.ready && input.companyAdmin) return 'admin'
  if (input.lens === 'member') return 'member'
  if (input.lens === 'coordinator') return 'coordinator'
  return input.ready && input.member && !input.coordinator ? 'member' : 'coordinator'
}
