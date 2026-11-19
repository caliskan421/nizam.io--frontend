import type { components, operations } from '@/shared/api/schema'

export type AuditActionTypeList = components['schemas']['AuditActionTypeList']
export type AuditEntryList = components['schemas']['AuditEntryList']
export type AuditEntry = components['schemas']['AuditEntry']
export type AuditSummary = components['schemas']['AuditSummary']
export type AuditCategory = components['schemas']['AuditCategory']
export type AuditQuery = Omit<
  NonNullable<operations['listAuditEntries']['parameters']['query']>,
  'cursor' | 'limit' | 'program_id'
> & {
  program_id: string
}

export const AUDIT_CATEGORIES = [
  'task',
  'file',
  'meeting',
  'message',
  'account',
  'system',
] as const satisfies readonly AuditCategory[]
