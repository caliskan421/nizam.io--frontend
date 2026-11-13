/**
 * Kenar menüsü grupları (E-00-11…26). Girdiler rota kataloğundan (`menuEntries` — faz
 * görünürlüğü ortak-kurallar §5 orada); burada yalnız grup kapısı ve başlık:
 *
 *  - Yönetim grubu `company_admin` OLGUSUNA bağlıdır, mercek girdi değildir (ortak-kurallar §1,
 *    P1): yönetici Koordinatör/Üye merceğine geçince grup kaybolmaz. Karar organizasyon
 *    modülünün capability dosyasındadır (`canSeeAdministration`; K-03 / CX-F0-K-03 devri, W71):
 *    rotaların yönetim kapısıyla aynı fonksiyon.
 *  - Standing (`me` + `me/departments`) gelmeden Yönetim gösterilmez (E-00-11).
 *  - Görünür öğesi kalmayan grubun başlığı da gizlenir (E-00-11, P2).
 *
 * Gizleme güvenlik değildir: sunucu her istekte denetler, 403/404 gerçek sonuçtur.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import {
  activeMenuKey,
  CURRENT_PHASE,
  isRouteName,
  MENU_GROUPS,
  menuEntries,
  type MenuEntry,
  type MenuGroup,
  type Phase,
} from '@/app/routes.catalog'
import { canSeeAdministration } from '@/modules/organization/public'
import { useScopeStore } from '@/shared/scope/store'
import { ICONS, type IconName } from '@/shared/ui'

import {
  menuSlot,
  resolveMenuRole,
  type MenuBadgeKind,
  type MenuRole,
  type MenuRoleInput,
} from './menu-definition'
import { sideText } from './messages'
import { injectScopeLifecycle } from './scope-key'

/**
 * Menü kapısı girdisi. Yönetim kapısı yalnız sunucu olgularına (`ready`, `companyAdmin`) bağlıdır;
 * `role` hangi rol menüsünün çizileceğidir (`resolveMenuRole`, mercek yalnız yönetici olmayanda
 * karar verir) ve yetki değildir (P1).
 */
export interface MenuAuthority {
  /** Standing geldi mi (`me` + `me/departments`). */
  ready: boolean
  companyAdmin: boolean
  role: MenuRole
}

/** Menüde çizilen öğe: katalog girdisi + rol etiketi + bu rolde taşıdığı rozetler. */
export interface SideMenuEntry extends MenuEntry {
  /** Rol etiketi (yoksa katalog sayfa adı). */
  label: string
  badges: readonly MenuBadgeKind[]
}

export interface SideMenuGroup {
  group: MenuGroup
  label: string
  entries: SideMenuEntry[]
}

/** Grup kapıları. Yönetim: organizasyon capability'si (şirket yöneticisi; P1, E-00-23/24). */
const GROUP_GATES: Readonly<Record<MenuGroup, (a: MenuAuthority) => boolean>> = {
  takip: () => true,
  icerik: () => true,
  yonetim: canSeeAdministration,
}

interface RoleEntry {
  entry: SideMenuEntry
  slotGroup: MenuGroup
  order: number
}

/** Katalog girdilerini rol tanımıyla birleştirir; o rolde tanımı olmayan öğe düşer. */
function roleEntries(entries: readonly MenuEntry[], role: MenuRole): RoleEntry[] {
  const out: RoleEntry[] = []
  for (const base of entries) {
    const slot = menuSlot(base.key, role)
    if (!slot) continue
    const label = slot.label ? sideText(slot.label) : base.title
    out.push({
      entry: { ...base, group: slot.group, label, badges: slot.badges ?? [] },
      slotGroup: slot.group,
      order: slot.order,
    })
  }
  return out
}

export function sideMenuGroups(
  entries: readonly MenuEntry[],
  authority: MenuAuthority,
): SideMenuGroup[] {
  const groups: SideMenuGroup[] = []
  for (const group of MENU_GROUPS) {
    if (!GROUP_GATES[group](authority)) continue
    const items = roleEntries(entries, authority.role)
      .filter(({ slotGroup }) => slotGroup === group)
      .sort((a, b) => a.order - b.order)
      .map(({ entry }) => entry)
    if (items.length === 0) continue
    groups.push({ group, label: sideText(`side.group.${group}`), entries: items })
  }
  return groups
}

/** Menü anahtarı → simge (anahtarlar `Sidebar.dc.html` `D` haritasıyla aynı adlıdır). */
export function menuIcon(key: string): IconName | undefined {
  return Object.hasOwn(ICONS, key) ? (key as IconName) : undefined
}

/** Devre dışı (faz dışı) öğenin açıklaması: "Görevler — F1’de açılacak". */
export function phaseNote(entry: Pick<SideMenuEntry, 'label' | 'phase'>): string {
  return sideText('side.disabled', {
    title: entry.label,
    phase: sideText(`side.phase.${entry.phase}`),
  })
}

export function useSideMenu(phase: Phase = CURRENT_PHASE) {
  const lifecycle = injectScopeLifecycle()
  const route = useRoute()
  const store = useScopeStore()
  const authority = computed<MenuAuthority>(() => {
    const facts = lifecycle.facts.value
    const input: MenuRoleInput = {
      ready: lifecycle.standing.value !== null,
      companyAdmin: facts.companyAdmin,
      coordinator: facts.coordinator,
      member: facts.member,
      lens: store.lens,
    }
    return { ready: input.ready, companyAdmin: input.companyAdmin, role: resolveMenuRole(input) }
  })
  const role = computed(() => authority.value.role)
  // Mercek değişince menü yeniden hesaplanır (store.lens reaktif); yetki değil, yalnız küme.
  const groups = computed(() => sideMenuGroups(menuEntries(phase), authority.value))
  const activeKey = computed(() =>
    isRouteName(route.name) ? activeMenuKey(route.name) : undefined,
  )
  return { groups, activeKey, role }
}
