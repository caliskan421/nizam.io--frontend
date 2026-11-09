/**
 * Program modülü tipleri. Sunucu şekilleri YALNIZ üretilmiş şemadan (`schema.d.ts`) adla
 * türetilir (elle DTO yok); burada yalnız istemcinin eylem değişkenleri durur. `api/` katmanı tip
 * bildirmez (lint), buradan içe aktarır.
 */
import type { components } from '@/shared/api/schema'

type Schemas = components['schemas']

export type Program = Schemas['Program']
export type ProgramResetResult = Schemas['ProgramResetResult']
export type TransferPreview = Schemas['TransferPreview']
export type TransferResult = Schemas['TransferResult']
export type TransferHistory = Schemas['TransferHistory']
export type TransferHistoryItem = Schemas['TransferHistoryItem']

// --- Eylem değişkenleri (düz nesne; KESİN 15) ------------------------------------------------

export interface CreateProgramInput {
  name: string
  year?: number
  description?: string
}

/** `updateProgram`: yalnız değişen alanlar gönderilir (gönderilmeyen alan sunucuda değişmez). */
export interface UpdateProgramInput {
  programId: string
  changes: {
    name?: string
    year?: number | null
    description?: string | null
  }
}

/**
 * `deleteProgram` / `resetProgram`: parola yeniden doğrulanır (PROGRAM-K12). Parola yalnız form
 * belleğindedir: mutasyon önbellekte tutulmaz, dönen sonuçta taslak yoktur (KESİN 7).
 */
export interface PasswordConfirmedInput {
  programId: string
  password: string
}

/** Aktarım seçimi (ileri aktarım; ters aktarım bu ekranda kurulmaz). */
export interface TransferSelection {
  sourceProgramId: string
  targetProgramId: string
  departmentId: string
  workItemIds: string[]
}

export interface TransferInput extends TransferSelection {
  previewFingerprint: string
  addMissingAccess: boolean
}
