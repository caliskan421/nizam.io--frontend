/**
 * Konum izi (E-00-35; 00-ortak `ozellikler.md` §2.6). Kaynak rota kataloğu (`routeTrail`):
 *
 *  - İlk parça seçili programın TAM adı (kabuğun `['programs']` verisinden; ayrı `readProgram`
 *    yok, ortak-kurallar §6) ve ana sayfaya bağlantıdır (README kabulü, koordinatör kararı).
 *    Program seçili değilse parça yoktur.
 *  - Ara parçalar üst rotalardır (08b → Koordinatörlükler); yalnız canlı ve parametresiz üst
 *    rota bağlantıdır — tıklanabilir ama işlevsiz bağlantı üretilmez.
 *  - Son parça geçerli sayfa adı (bağlantı değil). Açık durum gösteriliyorsa (K7) son parça
 *    açık durumun katalog başlığıdır ve ara parça yoktur.
 */
import {
  CURRENT_PHASE,
  type CatalogLocation,
  OPEN_STATES,
  type OpenStateName,
  type Phase,
  type RouteName,
  routeLocation,
  routeSpec,
  routeTrail,
  visibilityOf,
} from '@/app/routes.catalog'

export interface Crumb {
  label: string
  to: CatalogLocation | null
}

export interface Crumbs {
  /** Program ve ara parçalar (sırayla). */
  links: Crumb[]
  /** Geçerli sayfa adı. */
  current: string | null
}

export interface CrumbInput {
  routeName: RouteName | null
  programName: string | null
  openState: OpenStateName | null
  phase?: Phase
}

function linkTo(name: RouteName, phase: Phase): CatalogLocation | null {
  const spec = routeSpec(name)
  if (visibilityOf(name, phase) !== 'canli' || Object.keys(spec.params).length > 0) return null
  return routeLocation(name, {} as never, {}, phase)
}

export function buildCrumbs({
  routeName,
  programName,
  openState,
  phase = CURRENT_PHASE,
}: CrumbInput): Crumbs {
  const links: Crumb[] = []
  if (programName) links.push({ label: programName, to: linkTo('home', phase) })
  if (openState) return { links, current: OPEN_STATES[openState].title }
  if (!routeName) return { links, current: null }
  const trail = routeTrail(routeName)
  for (const parent of trail.slice(0, -1)) {
    links.push({ label: routeSpec(parent).title, to: linkTo(parent, phase) })
  }
  return { links, current: routeSpec(routeName).title }
}
