/**
 * Yükleme penceresi yardımcıları (W125). Sunucu kodu → alan eşlemesi `attachFile` hata
 * listesine dayanır (`06-arsiv/backend.md` §2); sunucu `message` alanı kullanılmaz. Boyut/tür
 * için sözleşmede SAYISAL sınır yoktur (`NIZAMIO_*` ortam ayarı; spec yalnız 413/422 kodlarını
 * verir) — istemci sayı uydurmaz, ön denetim yalnız "dosya seçildi mi"dir.
 */

export type UploadField = 'task' | 'tag' | 'file'

const FIELD_OF_CODE: Readonly<Record<string, UploadField>> = {
  'records.tag_required': 'tag',
  'records.tag_invalid': 'tag',
  'records.too_many_files': 'task',
  'records.too_large': 'file',
  'platform.body_too_large': 'file',
  'records.content_rejected': 'file',
  'records.name_invalid': 'file',
  'records.name_taken': 'file',
}

/** Hatanın alt gösterileceği alan; eşleşmeyen kod üst bildirimde kalır. */
export function errorField(code: string): UploadField | null {
  return FIELD_OF_CODE[code] ?? null
}

/** Bırakılan dosyalardan ilkini alır; birden çoksa `extra` (kullanıcıya bilgi). */
export function firstDropped(files: FileList | readonly File[] | null | undefined): {
  file: File | null
  extra: boolean
} {
  const list = files ? Array.from(files) : []
  return { file: list[0] ?? null, extra: list.length > 1 }
}
