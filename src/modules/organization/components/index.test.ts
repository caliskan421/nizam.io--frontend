import { describe, expect, it } from 'vitest'

import * as skeleton from './index'

// O2b sözleşmesi: ad → (bildirilmesi gereken prop'lar, emit adları, sahibi W). Bileşen
// BAĞLANMAZ (dolu gövdeler Pinia / TanStack Query / router ister): yalnız derlenmiş seçenek
// nesnesindeki `props` / `emits` bildirimleri denetlenir; yer tutucu ya da dolu gövdeyle aynı
// sonuç (web-1 W41b dersi).
const CONTRACT = {
  CoordinatorshipGrid: [['items'], ['assignCoordinator', 'createTask'], 'W72'],
  CoordinatorshipCard: [['item'], ['assignCoordinator', 'createTask'], 'W72'],
  CoordinatorshipDetail: [['departmentId', 'tab'], ['update:tab'], 'W73'],
  DepartmentForm: [['open', 'departmentId'], ['update:open', 'saved'], 'W74'],
  CoordinatorAssignDialog: [['open', 'departmentId'], ['update:open', 'assigned'], 'W74'],
  MemberAddDialog: [['open', 'departmentId'], ['update:open', 'added'], 'W74'],
  PersonPicker: [['modelValue', 'excludeAccountIds', 'label'], ['update:modelValue'], 'W74'],
  UserCreateDialog: [['open', 'departmentId'], ['update:open', 'created'], 'W74'],
  TemporaryPasswordDialog: [['open', 'accountId'], ['update:open', 'done'], 'W74'],
  UsersTable: [['roleTab', 'search', 'departmentId', 'selectedAccountId'], ['select'], 'W75'],
  UserPanel: [['accountId', 'embedded'], ['close', 'deleted'], 'W75'],
  PersonalTracking: [['accountId'], [], 'W76'],
} as const

type Declared = {
  props?: Record<string, unknown> | string[]
  emits?: Record<string, unknown> | string[]
}

function names(option: Declared['props']): string[] {
  if (!option) return []
  return Array.isArray(option) ? option : Object.keys(option)
}

describe('organizasyon bileşen iskeleti (W71 → O2b)', () => {
  it('iskelet tam olarak sözleşmedeki on iki bileşeni dışa açar', () => {
    const exported = Object.keys(skeleton).filter((k) => /^[A-Z]/.test(k))
    expect(exported.sort()).toEqual(Object.keys(CONTRACT).sort())
  })

  it.each(Object.entries(CONTRACT))('%s: prop/emit bildirimi', (name, [props, emits, owner]) => {
    const component = skeleton[name as keyof typeof CONTRACT] as Declared
    const declaredProps = names(component.props)
    const declaredEmits = names(component.emits)
    for (const prop of props) expect(declaredProps, `${owner} ${name} prop`).toContain(prop)
    for (const emit of emits) expect(declaredEmits, `${owner} ${name} emit`).toContain(emit)
  })

  it('geçici parola hiçbir emit/prop adında taşınmaz (KESİN 7)', () => {
    for (const name of Object.keys(CONTRACT)) {
      const component = skeleton[name as keyof typeof CONTRACT] as Declared
      const declared = [...names(component.props), ...names(component.emits)]
      expect(
        declared.filter((n) => /password|parola/i.test(n)),
        name,
      ).toEqual([])
    }
  })
})
