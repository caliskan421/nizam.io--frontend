/**
 * Kenar menüsü grupları (E-00-11…26). Girdiler rota kataloğundan (`menuEntries` — faz
 * görünürlüğü ortak-kurallar §5 orada); burada yalnız grup kapısı ve başlık:
 *
 *  - Yönetim grubu `company_admin` OLGUSUNA bağlıdır, mercek girdi değildir (ortak-kurallar §1,
 *    P1): yönetici Koordinatör/Üye merceğine geçince grup kaybolmaz.
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
import { ICONS, type IconName } from '@/shared/ui'

import { sideText } from './messages'
import { injectScopeLifecycle } from './scope-key'

/** Menü kapısı girdisi: yalnız sunucu olguları (mercekten bağımsız). */
export interface MenuAuthority {
  /** Standing geldi mi (`me` + `me/departments`). */
  ready: boolean
  companyAdmin: boolean
}

export interface SideMenuGroup {
  group: MenuGroup
  label: string
  entries: MenuEntry[]
}

/** Grup kapıları. Yönetim: şirket yöneticisi (ORGANIZATION ekranları, F2). */
const GROUP_GATES: Readonly<Record<MenuGroup, (a: MenuAuthority) => boolean>> = {
  takip: () => true,
  icerik: () => true,
  yonetim: (a) => a.ready && a.companyAdmin,
}

export function sideMenuGroups(
  entries: readonly MenuEntry[],
  authority: MenuAuthority,
): SideMenuGroup[] {
  const groups: SideMenuGroup[] = []
  for (const group of MENU_GROUPS) {
    if (!GROUP_GATES[group](authority)) continue
    const items = entries.filter((entry) => entry.group === group)
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
export function phaseNote(entry: MenuEntry): string {
  return sideText('side.disabled', {
    title: entry.title,
    phase: sideText(`side.phase.${entry.phase}`),
  })
}

export function useSideMenu(phase: Phase = CURRENT_PHASE) {
  const lifecycle = injectScopeLifecycle()
  const route = useRoute()
  const groups = computed(() =>
    sideMenuGroups(menuEntries(phase), {
      ready: lifecycle.standing.value !== null,
      companyAdmin: lifecycle.facts.value.companyAdmin,
    }),
  )
  const activeKey = computed(() =>
    isRouteName(route.name) ? activeMenuKey(route.name) : undefined,
  )
  return { groups, activeKey }
}
