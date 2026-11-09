// Ayrıntı paneli testleri için ortak fikstürler: olgu nesneleri, standing önbellek dolgusu ve
// çocuk bileşen saplamaları (W44/W45/W46/W47 gövdeleri bu testlerin konusu değildir).
import type { QueryClient } from '@tanstack/vue-query'

import { queryKeys } from '@/shared/http/query-keys'

import type { WorkActorFacts } from '../../../model/capabilities'

export const FACTS = {
  admin: { companyAdmin: true, coordinator: false, member: false, assigned: false },
  coordinator: { companyAdmin: false, coordinator: true, member: false, assigned: false },
  assignedMember: { companyAdmin: false, coordinator: false, member: true, assigned: true },
  member: { companyAdmin: false, coordinator: false, member: true, assigned: false },
} as const satisfies Record<string, WorkActorFacts>

export interface StandingRowFixture {
  department: string
  /** Sunucu rol dizesi (yalnız test dosyalarında literal yazılır). */
  role: string
}

/**
 * `useStanding` okumasını önbellekten besler (oturum sahte değil: sorgular kapalıdır, önbellekteki
 * veri yine okunur). Hesap `acc-1`.
 */
export function seedStanding(
  client: QueryClient,
  companyAdmin: boolean,
  rows: StandingRowFixture[],
): void {
  client.setQueryData(queryKeys.me.root(), {
    account_id: 'acc-1',
    email: 'kisi@example.test',
    full_name: 'Deneme Kişi',
    company_admin: companyAdmin,
  })
  client.setQueryData(queryKeys.me.departments(), {
    data: {
      departments: rows.map((r) => ({
        program_id: 'p1',
        program_name: 'Program',
        department_id: r.department,
        display_name: `Birim ${r.department}`,
        role: r.role,
      })),
    },
    truncated: false,
  })
}

/** O2b kardeş bileşenleri: saplama (ad + prop + emit sözleşmesi `../index.ts`'te). */
export const CHILD_STUBS = {
  StatusMenu: true,
  DeleteTaskAction: true,
  SubtaskTab: true,
  FilesTab: true,
  NotesTab: true,
  FileUploadDialog: true,
} as const
