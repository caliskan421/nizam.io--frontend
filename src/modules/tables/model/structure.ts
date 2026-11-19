import type { TableCommand, TableSnapshot } from './types'
import type { BasicCellType } from './cell-value'

export const STRUCTURE_LABELS = {
  add_row: 'Satır ekle',
  delete_row: 'Satır sil',
  move_row: 'Satırı taşı',
  add_column: 'Sütun ekle',
  rename_column: 'Sütunu yeniden adlandır',
  resize_column: 'Sütun genişliğini ayarla',
  move_column: 'Sütunu taşı',
  delete_column: 'Sütun sil',
  convert_column: 'Sütun tipini değiştir',
  rename_table: 'Tabloyu yeniden adlandır',
  delete_table: 'Tabloyu sil',
}
export type StructureKind = keyof typeof STRUCTURE_LABELS

export interface StructureDraft {
  kind: StructureKind
  id: string
  after: string
  name: string
  type: BasicCellType
  width: string
}

const destructive = new Set<StructureKind>([
  'delete_row',
  'delete_column',
  'delete_table',
  'convert_column',
])
export const needsConfirmation = (kind: StructureKind) => destructive.has(kind)

const targetColumn = new Set<StructureKind>([
  'rename_column',
  'resize_column',
  'move_column',
  'delete_column',
  'convert_column',
])
const targetRow = new Set<StructureKind>(['delete_row', 'move_row'])
export const usesColumn = (kind: StructureKind) => targetColumn.has(kind)
export const usesRow = (kind: StructureKind) => targetRow.has(kind)
export const usesName = (kind: StructureKind) =>
  kind === 'rename_table' || kind === 'add_column' || kind === 'rename_column'
export const usesWidth = (kind: StructureKind) => kind === 'add_column' || kind === 'resize_column'
export const usesOrder = (kind: StructureKind) => kind === 'move_row' || kind === 'move_column'

export function validTableName(raw: string) {
  const name = raw.trim()
  return name.length > 0 && [...name].length <= 200 && !/[\p{Cc}\p{Cs}\p{Bidi_Control}]/u.test(name)
}

function validWidth(value: string) {
  const width = Number(value)
  return /^\d+$/u.test(value) && width >= 40 && width <= 1200
}

export function validStructure(draft: StructureDraft, snapshot: TableSnapshot) {
  const { kind, id, name, width, after } = draft
  const entries = usesColumn(kind) ? snapshot.columns : snapshot.rows
  if ((usesColumn(kind) || usesRow(kind)) && !entries.some((entry) => entry.id === id)) return false
  if (usesName(kind) && !validTableName(name)) return false
  if (usesWidth(kind) && !validWidth(width)) return false
  if (usesOrder(kind) && after) {
    return after !== id && entries.some((entry) => entry.id === after)
  }
  return true
}

export function structureCommand(draft: StructureDraft, expected_schema: number): TableCommand {
  const { kind, id, after, type } = draft
  const name = draft.name.trim()
  const width = Number(draft.width)
  const placement = { after_id: after }
  switch (kind) {
    case 'add_row':
    case 'delete_table':
      return { kind }
    case 'delete_row':
      return { kind, id }
    case 'move_row':
      return { kind, id, ...placement }
    case 'rename_table':
      return { kind, name }
    case 'add_column':
      return { kind, name, width, type, multiple: false, expected_schema }
    case 'rename_column':
      return { kind, id, name, expected_schema }
    case 'resize_column':
      return { kind, id, width, expected_schema }
    case 'move_column':
      return { kind, id, ...placement, expected_schema }
    case 'delete_column':
      return { kind, id, expected_schema }
    case 'convert_column':
      return { kind, id, type, expected_schema }
  }
}
