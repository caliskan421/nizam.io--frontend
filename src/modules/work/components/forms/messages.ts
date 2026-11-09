/**
 * W45 form bileşenlerinin ekran metinleri (`workForms.*`): yeni görev (E-03-57), durum menüsü
 * (E-03-44/58), görev silme (E-03-56/64). Sunucu `message` alanı gösterilmez; hata metni kod →
 * `errors.*` (`shared/i18n`). Durum adları E-03-23 tasarım metni (`iade_edildi` = "Geri
 * gönderildi", P5).
 */
import { i18n } from '@/shared/i18n'

import type { WorkItemPriority, WorkItemStatus } from '../../model/types'

export const trWorkForms = {
  workForms: {
    status: {
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      onaya_sunuldu: 'Onay bekliyor',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlandı',
    },
    priority: {
      dusuk: 'Düşük',
      orta: 'Orta',
      yuksek: 'Yüksek',
      acil: 'Acil',
    },
    create: {
      title: 'Yeni görev',
      submit: 'Oluştur',
      cancel: 'Vazgeç',
      done: 'Görev oluşturuldu.',
      field: {
        title: 'Başlık',
        department: 'Koordinatörlük',
        departmentPlaceholder: 'Koordinatörlük seçin',
        assignee: 'Atanan',
        assigneeNone: 'Atanmasın',
        extra: 'Ek atananlar',
        extraHint: 'Görev oluşturulduktan sonra ayrıca atanır.',
        startOn: 'Başlangıç',
        endOn: 'Bitiş',
        priority: 'Öncelik',
        description: 'Açıklama',
        evidence: 'Tamamlamak için kanıt dosyası gerekli',
      },
      members: {
        loading: 'Kişiler yükleniyor…',
        failed: 'Kişi listesi okunamadı.',
      },
      error: {
        title: 'Başlık gerekli.',
        department: 'Koordinatörlük seçin.',
        date: 'Tarih seçin.',
        range: 'Bitiş, başlangıçtan önce olamaz.',
      },
      noDepartment: 'Görev açabileceğiniz bir koordinatörlük yok.',
    },
    transition: {
      menu: 'Durumu değiştir',
      current: 'Durum: {status}',
      evidence: 'Önce kanıt dosyası yükleyin.',
      subtasks: {
        title: 'Açık alt görevler kapatılsın mı?',
        body: 'Görev tamamlanırken açık alt görevler de sizin adınıza kapatılır.',
        confirm: 'Kapat ve tamamla',
      },
      reason: {
        title: 'Tamamlanmış görevi geri al',
        description: 'Görev yeniden "Devam ediyor" durumuna döner.',
        label: 'Gerekçe',
        error: 'En az 3 karakterlik bir gerekçe yazın.',
        submit: 'Geri al',
      },
    },
    remove: {
      action: 'Görevi sil',
      title: 'Görev silinsin mi?',
      body: '"{title}" görevi listeden kaldırılır.',
      confirm: 'Sil',
      done: 'Görev silindi.',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trWorkForms)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type WorkFormsTextKey = Leaves<typeof trWorkForms>

/** `workForms.*` metni (TR). */
export function formsText(key: WorkFormsTextKey, params?: Record<string, string | number>): string {
  ensureMerged()
  return params ? i18n.global.t(key, params) : i18n.global.t(key)
}

/** Durum adı (E-03-23). */
export function statusLabel(status: WorkItemStatus): string {
  return formsText(`workForms.status.${status}`)
}

/** Öncelik adı (`CreateWorkItemRequest.priority`). */
export function priorityLabel(priority: WorkItemPriority): string {
  return formsText(`workForms.priority.${priority}`)
}
