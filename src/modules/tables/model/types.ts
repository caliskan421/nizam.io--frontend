import type { components } from '@/shared/api/schema'

export interface TableTarget {
  programId: string
  departmentId: string | null
}

export type TableList = components['schemas']['TableList']
export type TableSnapshot = components['schemas']['TableSnapshot']
export type TableResult = components['schemas']['TableResult']
export type TableCreateRequest = components['schemas']['TableCreateRequest']
export type PersonalCreate = Pick<TableTarget, 'programId'> & { body: TableCreateRequest }
export type DepartmentCreate = PersonalCreate & { departmentId: string }
