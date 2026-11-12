// Dosya bileşenleri test verisi (örnek veri değil: kimlikler/adlar yalnız test içindir).
import type { ArchiveFile } from '../../model/types'

export function file(over: Partial<ArchiveFile> = {}): ArchiveFile {
  return {
    file_id: 'f1',
    work_item_id: 'w1',
    display_name: 'rapor.pdf',
    content_type: 'application/pdf',
    size_bytes: 2048,
    tag: 'sonuc',
    uploaded_by_account_id: 'a1',
    ...over,
  }
}

export const FILES: ArchiveFile[] = [
  file({ file_id: 'f1', display_name: 'saha.jpeg', content_type: 'image/jpeg', tag: 'girdi' }),
  file({ file_id: 'f2', display_name: 'rapor.docx', content_type: 'application/msword' }),
  file({ file_id: 'f3', display_name: 'tablo.xlsx', work_item_id: 'w9', tag: 'bilinmeyen' }),
  file({ file_id: 'f4', display_name: 'alt.pdf', subtask_id: 's1' }),
]

export const TITLES = { w1: 'Gölgelendirme çalışmaları' }

export const BASE = {
  files: FILES,
  taskTitles: TITLES,
  selectedFileId: null,
  hasMore: false,
  loading: false,
  error: false,
  needsTask: false,
}
