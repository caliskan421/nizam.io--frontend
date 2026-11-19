import type { components } from '@/shared/api/schema'

export interface TableTarget {
  programId: string
  departmentId: string | null
}

export type TableSummary = components['schemas']['Table']
export type TableList = components['schemas']['TableList']
export type TableSnapshot = components['schemas']['TableSnapshot']
export type TableResult = components['schemas']['TableResult']
export type TableCreateRequest = components['schemas']['TableCreateRequest']
export type PersonalCreate = Pick<TableTarget, 'programId'> & { body: TableCreateRequest }
export type DepartmentCreate = PersonalCreate & { departmentId: string }

export type TableCommand = components['schemas']['TableCommand']
export type TableCell = components['schemas']['TableCell']
export type TableColumn = components['schemas']['TableColumn']
export type TableRow = components['schemas']['TableRow']

/** Ondalık yazım sıradan JSON sayısıdır. İstemcide IEEE-754'e dönüştürülmez. */
export interface TableWrite {
  tableID: string
  command: TableCommand
  decimal?: string
}
export type PersonalWrite = Pick<TableTarget, 'programId'> & TableWrite
export type DepartmentWrite = PersonalWrite & { departmentId: string }

export type TableCopyRequest = components['schemas']['TableCopyRequest']
export type PersonalCopy = Pick<TableTarget, 'programId'> & { body: TableCopyRequest }
export type DepartmentCopy = PersonalCopy & { departmentId: string }
