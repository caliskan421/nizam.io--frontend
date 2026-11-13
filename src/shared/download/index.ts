// Ortak indirme: bilet akışı (arşiv dosya/ZIP + rapor PDF'leri). `shared/http/mutation` üstüne
// kuruludur; modüller bu dosyadan içe aktarır.
export { linkSignals, ticketBody, useDownloadFlow, type DownloadStartOptions } from './flow'
export { redeemAndSave } from './redeem'
export { DOWNLOAD_PATH, dispositionName, safeFileName, saveBlob, ticketOf } from './save'
export type {
  DownloadDisposed,
  DownloadFailed,
  DownloadRedeemResult,
  DownloadResult,
  DownloadSaved,
  DownloadScopeHeaders,
  DownloadTarget,
  DownloadTicket,
  DownloadTicketFailed,
} from './types'
