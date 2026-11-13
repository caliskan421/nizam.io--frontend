/**
 * Bilet tüketimi sonrası kaydetme yardımcıları artık `shared/download`'dadır (F6 W136: rapor
 * PDF'leri aynı bilet akışını kullanır); burası arşiv içi içe aktarmalar için ince yeniden
 * dışa aktarımdır. Davranış değişmedi.
 */
export { DOWNLOAD_PATH, dispositionName, safeFileName, saveBlob, ticketOf } from '@/shared/download'
