/**
 * Tarih talebi satırı parçaları (E-K1-39; BE-140): "‹GG.AA› gönderildi" (`created_at`), karar
 * zamanı (`reviewed_at`; bekleyen talepte null) ve karar notu (`review_reason`; yalnız gerekçeli
 * kararda bulunur). Karar notu KULLANICI METNİDİR: yalnız metin düğümü olarak çizilir; uzunluk
 * kırpılır. Gün sınırı kurulum saat dilimindedir (WORK-K37). Alan yoksa parça `null`.
 */
import type { DateChangeRequest } from '@/modules/timeline/public'

import { homeText } from '../messages'
import { dayText } from '../role/ago'

const NOTE_MAX = 200

export interface RequestParts {
  sent: string | null
  decided: string | null
  note: string | null
}

export function requestParts(request: DateChangeRequest, timeZone: string): RequestParts {
  const sent = dayText(request.created_at, timeZone)
  const decided = request.reviewed_at ? dayText(request.reviewed_at, timeZone) : null
  const raw = request.review_reason?.replace(/\s+/g, ' ').trim() ?? ''
  const chars = [...raw]
  const note = chars.length > NOTE_MAX ? `${chars.slice(0, NOTE_MAX).join('')}…` : raw
  return {
    sent: sent ? homeText('home.k1.requests.sent', { day: sent }) : null,
    decided: decided ? homeText('home.k1.requests.decided', { day: decided }) : null,
    note: note ? homeText('home.k1.requests.reviewNote', { note }) : null,
  }
}
