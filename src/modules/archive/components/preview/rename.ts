/** Dosya adı denetimi (E-06-57): kırpılmış boş olamaz; en çok 150 karakter (RECORDS-K09). */
export const MAX_FILE_NAME = 150

export type FileNameProblem = 'required' | 'too_long'

export function validateFileName(draft: string): FileNameProblem | null {
  const name = draft.trim()
  if (name.length === 0) return 'required'
  return [...name].length > MAX_FILE_NAME ? 'too_long' : null
}
