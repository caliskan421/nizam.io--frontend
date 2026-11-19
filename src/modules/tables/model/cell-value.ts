import type { TableCell, TableCommand } from './types'

export const CELL_TYPES = {
  text: 'Metin',
  number: 'Sayı',
  phone: 'Telefon',
  email: 'E-posta',
  date: 'Tarih',
  checkbox: 'Onay kutusu',
}
export type BasicCellType = keyof typeof CELL_TYPES

export const isBasicCell = (type: string): type is BasicCellType => Object.hasOwn(CELL_TYPES, type)

const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u

function validDecimal(raw: string): boolean {
  if (raw.length > 1000 || !JSON_NUMBER.test(raw)) return false
  const exponent = raw.split(/[eE]/u)[1]
  return exponent === undefined || Math.abs(Number(exponent)) <= 1000
}

export function cellInput(type: BasicCellType, raw: string) {
  if (raw === '') return { value: null }
  if (type === 'number') {
    const decimal = raw.trim().replace(',', '.')
    return validDecimal(decimal) ? { value: null, decimal } : { error: 'Geçerli bir sayı girin.' }
  }
  return { value: type === 'checkbox' ? raw === 'true' : raw }
}

export function cellText(value: TableCell['value'] | undefined): string {
  if (value === undefined || value === null) return 'Boş'
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
  return String(value)
}

export function serializeTableCommand(command: TableCommand, decimal?: string): string {
  if (decimal === undefined) return JSON.stringify(command)
  if (command.kind !== 'set_cells' || command.cells.length !== 1 || !validDecimal(decimal)) {
    throw new TypeError('Geçersiz ondalık hücre yazımı')
  }
  const { row_id, column_id, version } = command.cells[0]!
  const location = JSON.stringify({ row_id, column_id, version })
  const cell = `${location.slice(0, -1)},"value":${decimal}}`
  return `{"kind":"set_cells","cells":[${cell}]}`
}
